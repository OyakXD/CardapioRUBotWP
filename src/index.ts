import { CommandHandler } from "./commands/command-base";
import { MenuManager } from "./manager/menu-manager";
import { UserManager } from "./manager/user-manager";
import { PrismaClient } from "@prisma/client";
import { BusManager } from "./manager/bus-manager";
import { LocalAuth, Client as WASocket } from "whatsapp-web.js";
import log from "log-beautify";
import QRCode from "qrcode-terminal";
import GroupManager from "./manager/group/group-manager";

export const WhatsappConnector = new (class WhatsappInstance {
  public commandHandler: CommandHandler;
  public prisma: PrismaClient;
  public socket: WASocket;

  constructor() {
    this.commandHandler = new CommandHandler();
    this.prisma = new PrismaClient();

    Promise.all([
      MenuManager.initialize(),
      BusManager.initialize(),
      UserManager.initialize(),
    ]);
  }

  public async connectToWhatsapp() {
    try {
      await this.initialize();
    } catch (error) {
      log.error_(
        "[SOCKET (ERROR)] => Ocorreu um erro interno no bot. Reiniciando em 1s...",
        error
      );

      setTimeout(this.connectToWhatsapp, 1_000);
    }
  }

  public async initialize() {
    log.ok_(`[SOCKET (INFO)] => Iniciando bot...`);
    log.ok_(`[SOCKET (INFO)] => Carregando credenciais...`);

    log.ok_(`[SOCKET (INFO)] => Criando socket...`);

    this.socket = new WASocket({
      authStrategy: new LocalAuth({
        dataPath: "./wa_session"
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-extensions',
        ],
      },
    });

    this.socket.on("qr", (qr) => {
      log.ok_('[SOCKET (INFO)] => QR Code gerado, escaneie para autenticar:');
      QRCode.generate(qr, { small: true });
    })

    this.socket.on("authenticated", () => {
      log.ok_('[SOCKET (INFO)] => Autenticado com sucesso!');
    });

    this.socket.on("auth_failure", (msg) => {
      log.error_('[SOCKET (ERROR)] => Falha na autenticação:', msg);
      process.exit(1);
    });

    this.socket.on("ready", async () => {
      log.ok_(`[SOCKET (INFO)] => Carregando informações dos grupos...`);

      GroupManager.loadGroupsMetadata(this.socket).then(() => {
        log.ok_('[SOCKET (INFO)] => Conectado ao Whatsapp!');
      })
    });

    this.socket.on("call", async (call) => {
      try {
        if (!call.isGroup && !call.fromMe) {
          await call.reject();
          await this.socket.sendMessage(call.from, "📞 Chamada rejeitada, não me ligue!");
        }
      } catch (error) {
        log.error_(
          `[SOCKET (ERROR)] => Error ao cancelar chamada de ${call.from}:`
        );
      }
    })

    this.socket.on("disconnected", (reason) => {
      log.error_('[SOCKET (ERROR)] => Cliente desconectado. Tentando reconectar...', reason);
      this.connectToWhatsapp();
    });

    this.socket.on("message", async (message) => {
      this.commandHandler.handle(message);
    });

    log.ok_(`[SOCKET (INFO)] => Validando conexão aguarde...`);
    await this.socket.initialize();
  }

  public getPrisma() {
    return this.prisma;
  }
})();

WhatsappConnector.connectToWhatsapp();
