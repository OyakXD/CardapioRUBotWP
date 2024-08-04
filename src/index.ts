import makeWASocket, {
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
} from "baileys";
import log from "log-beautify";
import Pino from "pino";
import { commandHandler, prefix as CommandPrefix } from "./commands/base";
import { MenuManager } from "./manager/menu-manager";
import { UserManager } from "./manager/user-manager";

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
      await MenuManager.initialize(),
      await UserManager.initialize(),
      await useMultiFileAuthState("auth_session"),
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
        log.warn_(
          "[SOCKET (WARN)] => Sessão finalizada de forma inesperada! Re-iniciando em 1s...."
        );
        log.warn_("[SOCKET (WARN)] => " + lastDisconnect.error);

        setTimeout(WhatsappConnectorInstance.connect, 1000);
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
        if (message.key.fromMe && message.message) {
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
    return true;
  }
}

export const WhatsappConnector = WhatsappConnectorInstance.connect();
