import HttpConnection from "../../request/http-connection";
import { CommandData, SubCommand } from "../sub-command";
import { WAMessage } from "baileys";

export class SipacCommand extends SubCommand {
    public getCommandName(): string {
        return "sipac";
    }

    public getCommandLabels(): string[] {
        return [];
    }

    public getDescription(): string {
        return "Verifique se o SIPAC está online";
    }

    public async execute(
        message: WAMessage,
        args: string[],
        data: CommandData): Promise<any> {
        if (await HttpConnection.sipac()) {
            return await data.socket.sendMessage(data.chatId, {
                text: "SIPAC está online! ✅\nhttps://si3.ufc.br/sipac"
            }, { quoted: message });
        } else {
            return await data.socket.sendMessage(data.chatId, {
                text: "SIPAC está offline! 😓"
            }, { quoted: message });
        }
    }
}
