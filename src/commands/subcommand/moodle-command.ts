import HttpConnection from "../../request/http-connection";
import { CommandData, SubCommand } from "../sub-command";
import { WAMessage } from "@whiskeysockets/baileys/lib/Types/Message";

export class MoodleCommand extends SubCommand {
    public getCommandName(): string {
        return "moodle";
    }

    public getCommandLabels(): string[] {
        return [];
    }

    public getDescription(): string {
        return "Verifique se o MOODLE está online";
    }

    public async execute(
        message: WAMessage,
        args: string[],
        data: CommandData): Promise<any> {
        if (await HttpConnection.moodle()) {
            await data.socket.sendMessage(data.chatId, {
                text: "Moodle está online! ✅\nhttps://moodle2.quixada.ufc.br"
            }, { quoted: message });
        } else {
            await data.socket.sendMessage(data.chatId, {
                text: "Moodle está offline! 😓"
            }, { quoted: message });
        }
    }
}
