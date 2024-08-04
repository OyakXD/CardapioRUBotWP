import makeWASocket, { useMultiFileAuthState, WASocket } from "baileys";
import log from "log-beautify";
import Pino from "pino";
import { commandHandler, prefix as CommandPrefix } from "./commands/base";

class WhatsappConnector {
  private socket: WASocket | undefined;
  private commandHandler: commandHandler;

  constructor() {
    this.initialize();
    this.commandHandler = new commandHandler(CommandPrefix);
  }

  public static async connect() {
    new WhatsappConnector();
  }

  public async initialize() {
    const { state: authState, saveCreds } = await useMultiFileAuthState(
      "auth_session"
    );

    const logger = Pino({
      level: "debug",
      hooks: {
        logMethod: (args, method, level) => {
          if (level > 20 && level < 40) {
            log.info_("[SOCKET (DEBUG)] => " + args[args.length - 1]);
          }
        },
      },
    });

    this.socket = makeWASocket({
      printQRInTerminal: true,
      auth: authState,
      logger: logger,
    });

    this.socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        log.warn(
          "[SESSION] => Sessão finalizada de forma inesperada! Re-iniciando em 1s...."
        );
        log.warn("[SESSION (ERROR)] => " + lastDisconnect.error);

        setTimeout(() => {
          WhatsappConnector.connect();
        }, 1000);
      } else if (connection === "open") {
        log.ok("[SESSION] => Sessão aberta...");
      }
    });

    this.socket.ev.on("creds.update", saveCreds);

    this.socket.ev.on("messages.upsert", async ({ messages }) => {
      for (const message of messages) {
        if (!message.key.fromMe && message.message) {
          const response = this.commandHandler.handle(message);

          if (response) {
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
}

WhatsappConnector.connect();
