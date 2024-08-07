import makeWASocket, {
  DisconnectReason,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
} from "baileys";
import log from "log-beautify";
import Pino from "pino";
import { commandHandler, prefix as CommandPrefix } from "./commands/base";
import { MenuManager } from "./manager/menu-manager";
import { UserManager } from "./manager/user-manager";
import { Boom } from "@hapi/boom";

class WhatsappConnectorInstance {
  public socket: WASocket | undefined;
  private commandHandler: commandHandler;

  constructor() {
    this.initialize();
    this.commandHandler = new commandHandler(CommandPrefix);
  }

  public static connect() {
    return new WhatsappConnectorInstance();
  }

  public async initialize() {
    const [, , multiAuthState] = await Promise.all([
      MenuManager.initialize(),
      UserManager.initialize(),
      useMultiFileAuthState("auth_session"),
    ]);

    const { state: authState, saveCreds } = multiAuthState;

    const logger = Pino({
      level: "info",
      hooks: {
        logMethod: (args, method, level) => {
          const message = args[args.length - 1];

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

    this.socket = makeWASocket({
      version: [2, 3000, 1014090025],
      printQRInTerminal: true,
      logger: logger,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      mobile: false,
      auth: {
        creds: authState.creds,
        /** caching makes the store faster to send/recv messages */
        keys: makeCacheableSignalKeyStore(authState.keys, logger),
      },
      shouldIgnoreJid: (jid: string) => {
        return (
          jid && !jid.endsWith("@s.whatsapp.net") && !jid.endsWith("@g.us")
        );
      },
    });

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
        log.ok_("[SOCKET (INFO)] => Sessão aberta...");
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
