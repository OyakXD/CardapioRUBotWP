import makeWASocket, { ConnectionState, DisconnectReason, WASocket, useMultiFileAuthState } from "baileys";
import { Boom } from '@hapi/boom';
import { writeFileSync, readFileSync, existsSync } from "fs";

class WhatsappConnector {
    private sock: WASocket | undefined;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        // const creds = this.loadCreds();
        // if(!creds) {
        //     console.error('Credencias não encontradas ou inválidas');
        //     return;
        // }
        // this.sock = makeWASocket({
        //     printQRInTerminal: true
        //    // auth: creds
        // } as any);

        const { state, saveCreds } = await useMultiFileAuthState("auth_session");

        const sock = makeWASocket({
            printQRInTerminal: true,
            auth: state,
        });

        sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect.error as Boom)?.output?.statusCode !==
                DisconnectReason.loggedOut;
            console.log(
                "connection closed due to ",
                lastDisconnect.error,
                ", reconnecting ",
                shouldReconnect
            );

            // reconnect if not logged out
            if (shouldReconnect) {
                WhatsappConnector.connect(); 
            }
            } else if (connection === "open") {
            console.log("opened connection");
            }
        });

        

        // //this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
        // //this.sock.ev.on('creds.update', this.saveCreds);
        // // this.sock.ev.on('messages.upsert', this.handleMessages.bind(this));
    }

    private saveCreds(creds: any) {
        writeFileSync('whatsapp-session.json', JSON.stringify(creds, null, 2));
    }

    private loadCreds() {
        if (existsSync('whatsapp-session.json')) {
            const creds = readFileSync('whatsapp-session.json', { encoding: 'utf-8' });
            return JSON.parse(creds);
        }
        return null;
    }

    private handleConnectionUpdate(update: Partial<ConnectionState>) {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to', lastDisconnect?.error, 'reconnecting', shouldReconnect);

            if (shouldReconnect) {
                this.initialize();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    }
    
    private async handleMessages(m: any) {
        if (!m.messages[0].key.fromMe) {
            console.log('replying to', m.messages[0].key.remoteJid);
            await this.sock?.sendMessage(m.messages[0].key.remoteJid!, { text: 'Olá teste!' });
        }
    }

    public static async connect() {
        new WhatsappConnector();
    }
}

WhatsappConnector.connect();    
