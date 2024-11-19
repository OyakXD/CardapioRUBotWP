import makeWASocket, {
  AnyMessageContent,
  BaileysEventMap,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  MiscMessageGenerationOptions,
  proto,
  useMultiFileAuthState,
  WAMessageContent,
  WASocket,
} from "baileys";
import { CommandHandler } from "./commands/command-base";
import { MenuManager } from "./manager/menu-manager";
import { UserManager } from "./manager/user-manager";
import { PrismaClient } from "@prisma/client";
import { fetchLatestWhatsappVersion } from "./request/http-connection";
import log from "log-beautify";
import Pino from "pino";
import Ack from "./utils/ack";
import SocketEvent from "./socket/socket-event";
import NodeCache from "node-cache";
import { BusManager } from "./manager/bus-manager";

export const WhatsappConnector = new (class WhatsappInstance {
  public socket: WASocket | undefined;
  public commandHandler: CommandHandler;
  public tryingReconnect: boolean = false;
  public prisma: PrismaClient;

  private socketEvent: SocketEvent;
  private store?: ReturnType<typeof makeInMemoryStore>;
  private maxRetriesFailedMessage: number = 3;
  private whatsappVersion: [number, number, number] = [2, 3000, 1018310816];
  private msgRetryCounterCache: NodeCache = new NodeCache();

  constructor() {
    this.commandHandler = new CommandHandler();
    this.socketEvent = new SocketEvent(this);
    this.prisma = new PrismaClient();

    Promise.all([
      MenuManager.initialize(),
      BusManager.initialize(),
      UserManager.initialize(),
    ]);
  }

  public async connectToWhatsapp(connectCallback?: () => void) {
    try {
      await this.socket?.ws.close();
      await this.initialize(connectCallback);

      setTimeout(() => this.connectToWhatsapp(), 1_000 * 60 * 60 * 10);
    } catch (error) {
      log.error_(
        "[SOCKET (ERROR)] => Ocorreu um erro interno no baileys. Reiniciando em 2s...",
        error
      );

      setTimeout(() => this.connectToWhatsapp(connectCallback), 2_000);
    }
  }

  public async initialize(connectCallback?: () => void) {
    log.ok_(`[SOCKET (INFO)] => Iniciando bot...`);
    log.ok_(`[SOCKET (INFO)] => Carregando credenciais...`);

    this.tryingReconnect = true;

    const { state: authState, saveCreds } = await useMultiFileAuthState(
      "auth_session"
    );

    if (this.fetchWhatsappVersion()) {
      log.ok_(
        `[SOCKET (INFO)] => Buscando versão mais recente do WhatsApp Web...`
      );

      const waWebVersion = await fetchLatestWhatsappVersion(
        this.whatsappVersion
      );
      const { version, isLatest, error } = waWebVersion;

      if (error) {
        return log.error_(
          "[SOCKET (ERROR)] => Erro ao buscar a versão mais recente do WhatsApp Web:",
          error
        );
      }

      if (!isLatest) {
        log.warn_(
          `[SOCKET (WARN)] => A versão do WhatsApp Web está desatualizada. Versão atual: ${version}`
        );
      }

      this.whatsappVersion = version;
    }

    log.ok_(
      `[SOCKET (INFO)] => Usando versão do WhatsApp Web: ${this.whatsappVersion.join(
        "."
      )}`
    );

    const logger = Pino({
      level: "silent",
      hooks: {
        logMethod: (args, method, level) => {
          const message = args[args.length - 1];

          if (Ack.received(String(message))) {
            return;
          }

          if (level === 30) {
            log.ok_("[SOCKET (INFO)] => " + message);
          } else if (level === 50) {
            log.error_("[SOCKET (ERROR)] => " + message);
          } else if (level === 60) {
            log.error_("[SOCKET (FATAL)] => " + message);
          }
        },
      },
    });

    log.ok_(`[SOCKET (INFO)] => Criando socket...`);

    this.socket = makeWASocket({
      version: this.whatsappVersion,
      printQRInTerminal: true,
      logger: logger,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      shouldSyncHistoryMessage: (msg) => {
        log.ok_(
          `[SOCKET (INFO)] => Sincronizando mensagens..[${msg.progress}%]`
        );
        return !!msg.syncType;
      },
      msgRetryCounterCache: this.msgRetryCounterCache,
      auth: {
        creds: authState.creds,
        /** caching makes the store faster to send/recv messages */
        keys: makeCacheableSignalKeyStore(authState.keys, logger),
      },
      browser: ["RU BOT - UFC", "Chrome", "20.0.04"],
      shouldIgnoreJid: (jid: string) => {
        return (
          jid && !jid.endsWith("@s.whatsapp.net") && !jid.endsWith("@g.us")
        );
      },
      ...(this.enableStore() && this.getMessage),
    });

    if (this.enableStore()) {
      log.ok_(`[SOCKET (INFO)] => Iniciando cache...`);

      this.store = makeInMemoryStore({ logger });
      this.store.readFromFile("baileys_store_multi.json");

      setInterval(
        () => this.store.writeToFile("baileys_store_multi.json"),
        10_000
      );
      this.store.bind(this.socket.ev);
    }

    this.socket.ev.process((events: Partial<BaileysEventMap>) =>
      this.socketEvent.handleEvents(events, { connectCallback, saveCreds })
    );
  }

  /**
   * É necessário chamar essa função para enviar mensagens
   * Caso contrário, os erros interno gerados pelo "Baileys"
   * não serão tratados corretamente, causando falha total
   */
  public async sendMessage(
    jid: string,
    message: AnyMessageContent,
    options?: MiscMessageGenerationOptions,
    alreadyTried: boolean = false
  ): Promise<proto.WebMessageInfo | undefined> {
    if (this.tryingReconnect) {
      log.warn_(
        `[SOCKET (ERROR)] => Tentando enviar mensagem para o jid ${jid} enquanto a conexão está sendo reestabelecida.`
      );
      return undefined;
    }

    let attempt = 0;

    while (++attempt <= this.maxRetriesFailedMessage) {
      try {
        return await WhatsappConnector.socket?.sendMessage(
          jid,
          message,
          options
        );
      } catch (error) {
        const errorMessage = (error as Error).message || error.toString();

        if (errorMessage.includes("connection closed")) {
          log.warn_(
            `[SOCKET (ERROR)] => Conexão fechada ao enviar mensagem para o jid ${jid}. Tentando novamente... (tentativa ${attempt}/${this.maxRetriesFailedMessage})`
          );
        } else {
          log.warn_(
            `[SOCKET (ERROR)] => Erro ao enviar mensagem para o jid ${jid} (tentativa ${attempt}/${this.maxRetriesFailedMessage})`,
            error
          );
        }

        if (attempt >= this.maxRetriesFailedMessage) {
          if (!alreadyTried) {
            if (errorMessage.includes("connection closed")) {
              log.warn_(
                `[SOCKET (ERROR)] => Conexão fechada ao enviar mensagem para o jid ${jid}. Tentando criar outra conexão...`
              );

              this.connectToWhatsapp(() => {
                this.sendMessage(jid, message, options, true);
              });

              return undefined;
            }
          }

          log.error_(
            `[SOCKET (ERROR)] => Falha ao enviar mensagem para o jid ${jid} após ${attempt}/${this.maxRetriesFailedMessage} tentativas.`
          );
          return undefined;
        }
      }
    }
  }

  public async getMessage(
    key: proto.IMessageKey
  ): Promise<WAMessageContent | undefined> {
    if (this.store) {
      const message = await this.store.loadMessage(key.remoteJid, key.id);

      return message?.message || undefined;
    }

    return proto.Message.fromObject({});
  }

  /**
   * Se habilitado, as mensagens serão armazenadas em disco
   * Ative para evitar o aviso "waiting for message" ao enviar mensagens
   */
  public enableStore() {
    return true;
  }

  /**
   * Se habilitado, tenta buscar a versão mais recente do WhatsApp Web
   * Ative para evitar problemas de compatibilidade com o WhatsApp Web
   */
  public fetchWhatsappVersion() {
    return false;
  }

  public getPrisma() {
    return this.prisma;
  }
})();

WhatsappConnector.connectToWhatsapp();
