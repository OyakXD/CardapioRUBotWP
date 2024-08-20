import makeWASocket, {
  DisconnectReason,
  fetchLatestWaWebVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
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
import Ack from "./utils/ack";

class WhatsappConnectorInstance {
  public socket: WASocket | undefined;
  private commandHandler: commandHandler;

  constructor() {
    this.commandHandler = new commandHandler(CommandPrefix);

    try {
      this.initialize();
    } catch (error) {
      log.error_(
        "[SOCKET (ERROR)] => Ocorreu um erro interno no baileys. Reiniciando em 2s..."
      );

      setTimeout(() => this.initialize(), 2_000);
    } 
  }

  public static connect() {
    return new WhatsappConnectorInstance();
  }

  public async initialize() {
    const [, , multiAuthState, waWebVersion] = await Promise.all([
      MenuManager.initialize(),
      UserManager.initialize(),
      useMultiFileAuthState("auth_session"),
      fetchLatestWaWebVersion({}),
    ]);

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

    const { state: authState, saveCreds } = multiAuthState;

    const logger = Pino({
      level: "info",
      hooks: {
        logMethod: (args, method, level) => {
          const message = args[args.length - 1];

          if (Ack.received(message)) {
            return;
          }

          if (level === 30) {
            log.ok_("[SOCKET (INFO)] => " + message);
          } else if (level === 40) {
            //log.warn_("[SOCKET (WARN)] => " + message);
          } else if (level === 50) {
            log.error_("[SOCKET (ERROR)] => " + message);
          } else if (level === 60) {
            log.error_("[SOCKET (FATAL)] => " + message);
          }
        },
      },
    });

    const store = makeInMemoryStore({ logger });

    store.readFromFile("baileys_store_multi.json");
    setInterval(() => store.writeToFile("baileys_store_multi.json"), 10_000);

    this.socket = makeWASocket({
      version,
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
      getMessage: async (
        key: proto.IMessageKey
      ): Promise<WAMessageContent | undefined> => {
        if (store) {
          const message = await store.loadMessage(key.remoteJid!, key.id!);
          return message?.message || undefined;
        }

        // only if store is present
        return proto.Message.fromObject({});
      },
    });

    store.bind(this.socket.ev);

    this.socket.ev.on("connection.update", (update) => {
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
        log.ok_(
          `[SOCKET (INFO)] => Sessão aberta(${
            this.socket.user.id.split(":")[0]
          })`
        );
      }
    });

    this.socket.ev.on("creds.update", saveCreds);

    this.socket.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") {
        return;
      }

      for (const message of messages) {
        if (message.message) {
          if (message.message?.pollUpdateMessage) return;

          const response = await this.commandHandler.handle(
            message,
            this.socket
          );

          if (response) {
            if (this.readMessageOnReceive()) {
              await this.socket!.readMessages([message.key]);
            }

            await this.socket?.sendMessage(
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

  public readMessageOnReceive() {
    return false;
  }
}

export const WhatsappConnector = WhatsappConnectorInstance.connect();
