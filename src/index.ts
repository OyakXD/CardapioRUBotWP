import makeWASocket, { ConnectionState, DisconnectReason, WASocket, useMultiFileAuthState } from "baileys";
import { Boom } from '@hapi/boom';
import { writeFileSync, readFileSync, existsSync } from "fs";

class WhatsappConnector {
    private sock: WASocket | undefined;

    constructor() {
        this.initialize();
    }

    private async initialize() {

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
