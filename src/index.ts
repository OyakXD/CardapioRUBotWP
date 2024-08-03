import makeWASocket, { useMultiFileAuthState, WASocket } from "baileys";
import log from "log-beautify";
import Pino from "pino";
import * as path from "path";
import { writeFileSync } from "fs";

class WhatsappConnector {
  private socket: WASocket | undefined;

  constructor() {
    this.initialize();
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
      //      logger: logger,
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
      messages.forEach(async (message) => {
        if (!message.key.fromMe) {
          await this.socket?.sendMessage(message.key.remoteJid, {
            text: "Olá mundo",
            buttons: [
              {
                buttonId: "Ola",
                buttonText: {
                  displayText: "Ola",
                },
                type: 1,
              },
            ],
          });
        }
      });
    });
  }
}

WhatsappConnector.connect();
