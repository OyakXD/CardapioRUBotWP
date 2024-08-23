import makeWASocket, {
  AnyMessageContent,
  DisconnectReason,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  MiscMessageGenerationOptions,
  proto,
  useMultiFileAuthState,
  WAMessageContent,
  WASocket,
} from "baileys";
import log from "log-beautify";
import Pino from "pino";
import { commandHandler, prefix as CommandPrefix } from "./commands/base";
import { MenuManager } from "./manager/menu-manager";
import { UserManager } from "./manager/user-manager";
import { Boom } from "@hapi/boom";
import GroupManager from "./manager/group/group-manager";
import Ack from "./utils/ack";

class WhatsappConnectorInstance {
  public socket: WASocket | undefined;
  private commandHandler: commandHandler;
  private store?: ReturnType<typeof makeInMemoryStore>;
  private failedMessages: Map<string, number> = new Map();
  private maxRetriesFailedMessage: number = 3;
  private whatsappVersion: [number, number, number] = [2, 3000, 1015920675];

  constructor() {
    this.commandHandler = new commandHandler(CommandPrefix);

    this.handlerInitializer();
  }

  public async handlerInitializer() {
    try {
      await this.initialize();
    } catch (error) {
      log.error_(
        "[SOCKET (ERROR)] => Ocorreu um erro interno no baileys. Reiniciando em 2s...",
        error
      );

      setTimeout(() => this.handlerInitializer(), 2_000);
    }
  }

  public static connect() {
    return new WhatsappConnectorInstance();
  }

  public async initialize() {
    log.ok_(`[SOCKET (INFO)] => Iniciando bot...`);

    log.ok_(`[SOCKET (INFO)] => Carregando credenciais...`);
    const [, , multiAuthState] = await Promise.all([
      MenuManager.initialize(),
      UserManager.initialize(),
      useMultiFileAuthState("auth_session"),
    ]);

    const { state: authState, saveCreds } = multiAuthState;

    if (this.lastedWhatsappVersion()) {
      log.ok_(
        `[SOCKET (INFO)] => Buscando versão mais recente do WhatsApp Web...`
      );

      const waWebVersion = await fetchLatestWaWebVersion({});
      const { version, isLatest, error } = waWebVersion;

      if (error) {
        return log.error_(
          "[SOCKET (ERROR)] => Erro ao buscar a versão mais recente do WhatsApp Web"
        );
      }

      if (!isLatest) {
        log.warn_(
          `[SOCKET (WARN)] => A versão do WhatsApp Web está desatualizada. Versão atual: ${version}`
        );
      }

      this.whatsappVersion = version;
    }

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
      shouldSyncHistoryMessage: () => true,
      generateHighQualityLinkPreview: true,
      mobile: false,
      auth: {
        creds: authState.creds,
        /** caching makes the store faster to send/recv messages */
        keys: makeCacheableSignalKeyStore(authState.keys, logger),
      },
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      shouldIgnoreJid: (jid: string) => {
        return (
          jid && !jid.endsWith("@s.whatsapp.net") && !jid.endsWith("@g.us")
        );
      },
      ...(this.enableStore() && {
        getMessage: async (
          key: proto.IMessageKey
        ): Promise<WAMessageContent | undefined> => {
          if (this.store) {
            const message = await this.store.loadMessage(
              key.remoteJid!,
              key.id!
            );
            return message?.message || undefined;
          }

          // only if store is present
          return proto.Message.fromObject({});
        },
      }),
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

    this.socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        log.warn_(
          "connection closed due to",
          lastDisconnect.error,
          ", reconnecting",
          shouldReconnect
        );
        if (shouldReconnect) {
          WhatsappConnectorInstance.connect();
        }
      } else if (connection === "open") {
        log.ok_(`[SOCKET (INFO)] => Carregando informações dos grupos...`);

        GroupManager.loadGroupsMetadata(this.socket!).then(() => {
          log.ok_(
            `[SOCKET (INFO)] => Sessão aberta em ${
              this.socket.user.id.split(":")[0]
            }`
          );
        });
      }
    });

    this.socket.ev.on("creds.update", () => {
      /* Remove previous listeners */
      this.socket.ev.removeAllListeners("creds.update");
      saveCreds();
    });

    this.socket.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") {
        return;
      }

      for (const message of messages) {
        if (!message.message || message.message?.pollUpdateMessage) {
          continue;
        }

        const response = await this.commandHandler.handle(message, this.socket);

        if (response) {
          if (this.readMessageOnReceive()) {
            await this.socket!.readMessages([message.key]);
          }

          /* Validar mensagens com erro antes de responder */
          const retryNode = await this.createRetryNode(message);

          if (retryNode) {
            await this.sendMessage(
              message.key.remoteJid,
              {
                text: response,
              },
              {
                quoted: message,
              }
            );
          }
        }
      }
    });
  }

  public async sendMessage(
    jid: string,
    message: AnyMessageContent,
    options?: MiscMessageGenerationOptions
  ): Promise<proto.WebMessageInfo | undefined> {
    try {
      return await WhatsappConnector.socket?.sendMessage(jid, message, options);
    } catch (error) {
      log.error_(`Error sending message to jid ${jid}:`, error);
    }
  }

  private async createRetryNode(message: proto.IWebMessageInfo) {
    const messageId = message.key.id;
    let retryCount = this.failedMessages.get(messageId) || 0;

    if (retryCount++ >= this.maxRetriesFailedMessage) {
      this.failedMessages.delete(messageId);
      return null;
    } else {
      this.failedMessages.set(messageId, retryCount);
    }

    return {
      key: {
        id: messageId,
        remoteJid: message.key.remoteJid,
        participant: message.key.participant,
      },
      message: message.message,
      messageTimestamp: message.messageTimestamp,
      status: message.status,
    };
  }

  public readMessageOnReceive() {
    return false;
  }

  public enableStore() {
    return false;
  }

  public lastedWhatsappVersion() {
    return false;
  }
}

export const WhatsappConnector = WhatsappConnectorInstance.connect();
