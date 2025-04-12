import { LocalAuth, Message, MessageContent, MessageSendOptions, Client as WASocket } from "whatsapp-web.js";
import log from "log-beautify";
import QRCode from "qrcode-terminal";
import GroupManager from "../../manager/group/group-manager";
import { WhatsappConnector } from "../..";

export default class WhatsappWebJService {
  public socket: WASocket;

  public async connect() {
    try {
      await this.initialize();
    } catch (error) {
      log.error_(
        "[SOCKET (ERROR)] => Ocorreu um erro interno no bot. Reiniciando em 5s...",
        error
      );

      setTimeout(() => this.connect(), 5_000);
    }
  }

  public async initialize() {
    log.ok_(`[SOCKET (INFO)] => Iniciando bot...`);
    log.ok_(`[SOCKET (INFO)] => Carregando credenciais...`);

    log.ok_(`[SOCKET (INFO)] => Criando socket...`);

    this.socket = new WASocket({
      authStrategy: new LocalAuth({
        dataPath: "../../wa_session"
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
          '--disable-infobars',
          '--window-position=0,0',
          '--window-size=900,900',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
        ],
        executablePath: process.env.CHROMIUM_PATH,
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
      await this.socket.sendPresenceUnavailable();

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
      this.connect();
    });

    this.socket.on("message_create", async (message) => {
      WhatsappConnector.commandHandler.handle(message);
    });

    const oldSendMessage = this.socket.sendMessage;

    this.socket.sendMessage = async (chatId: string, content: MessageContent, options?: MessageSendOptions): Promise<Message | null> => {
      try {
        return await oldSendMessage.call(this.socket, chatId, content, options);
      } catch (error) {
        log.info_(`[SOCKET (INFO)] => Mensagem ignorada para o chat: ${chatId}!`);
        return null;
      }
    }

    log.ok_(`[SOCKET (INFO)] => Validando conexão aguarde...`);
    await this.socket.initialize();
  }
}