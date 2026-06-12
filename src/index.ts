import { CommandHandler } from "./commands/command-base";
import { MenuManager } from "./manager/menu-manager";
import { UserManager } from "./manager/user-manager";
import { PrismaClient } from "@prisma/client";
import { BusManager } from "./manager/bus-manager";
import log from "log-beautify";
import GroupManager from "./manager/group/group-manager";
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    WASocket
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode-terminal";

export const WhatsappConnector = new (class WhatsappInstance {
    public commandHandler: CommandHandler;
    public prisma: PrismaClient;
    public socket: WASocket | null = null;

    constructor() {
        this.commandHandler = new CommandHandler();
        this.prisma = new PrismaClient();
    }

    public async start() {
        try {
            await Promise.all([
                MenuManager.initialize(),
                BusManager.initialize(),
                UserManager.initialize(),
            ])
            await this.initialize();
        } catch (error) {
            log.error_(
                "[SOCKET (ERROR)] => Ocorreu um erro interno no bot. Reiniciando em 5s...",
                error
            );

            setTimeout(() => this.start(), 5_000);
        }
    }

    public async initialize() {
        log.ok_(`[SOCKET (INFO)] => Iniciando bot...`);
        log.ok_(`[SOCKET (INFO)] => Carregando credenciais...`);

        const { state, saveCreds } = await useMultiFileAuthState('./wa_session');
        const { version } = await fetchLatestBaileysVersion();

        log.ok_(`[SOCKET (INFO)] => Criando socket...`);

        this.socket = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            logger: pino({ level: 'silent' }),
            browser: ['RUBot', 'Chrome', '1.0.0']
        });

        this.socket.ev.on('creds.update', saveCreds);

        this.socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                log.ok_('[SOCKET (INFO)] => QR Code gerado, escaneie para autenticar:');
                QRCode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                log.error_('[SOCKET (ERROR)] => Cliente desconectado. Motivo:', lastDisconnect?.error);

                if (shouldReconnect) {
                    log.ok_('[SOCKET (INFO)] => Tentando reconectar...');
                    this.initialize();
                } else {
                    log.error_('[SOCKET (FATAL)] => Você foi desconectado permanentemente. Apague a pasta wa_session e escaneie novamente.');
                    process.exit(1);
                }
            } else if (connection === 'open') {
                log.ok_('[SOCKET (INFO)] => Autenticado com sucesso!');
                log.ok_(`[SOCKET (INFO)] => Carregando informações dos grupos...`);

                await this.socket.sendPresenceUpdate('unavailable');

                GroupManager.loadGroupsMetadata(this.socket).then(() => {
                    log.ok_('[SOCKET (INFO)] => Conectado ao Whatsapp via Baileys!');
                });
            }
        });

        this.socket.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                if (chatUpdate.type === 'notify') {
                    for (const message of chatUpdate.messages) {
                        if (!message.message) continue;

                        await this.commandHandler.handle(message, this.socket);
                    }
                }
            } catch (error) {
                log.error_('[SOCKET (ERROR)] => Erro ao processar mensagem recebida:', error);
            }
        });

        this.socket.ev.on('call', async (calls) => {
            for (const call of calls) {
                if (call.status === 'offer') {
                    try {
                        await this.socket!.rejectCall(call.id, call.from);

                        await this.socket!.sendMessage(call.from, {
                            text: "📞 Chamada rejeitada, não me ligue!"
                        });
                    } catch (error) {
                        log.error_(`[SOCKET (ERROR)] => Erro ao cancelar chamada de ${call.from}:`, error);
                    }
                }
            }
        });
    }

    public getPrisma() {
        return this.prisma;
    }
})();

WhatsappConnector.start();