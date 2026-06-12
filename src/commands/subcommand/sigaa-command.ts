import HttpConnection from "../../request/http-connection";
import { CommandData, SubCommand } from "../sub-command";
import { WAMessage } from "baileys";

export class SigaaCommand extends SubCommand {
    public getCommandName(): string {
        return "sigaa";
    }

    public getCommandLabels(): string[] {
        return [];
    }

    public getDescription(): string {
        return "Verifique se o SIGAA está online";
    }

    public async execute(
        message: WAMessage,
        args: string[],
        data: CommandData): Promise<any> {
        if (await HttpConnection.sigaa()) {
            return await data.socket.sendMessage(data.chatId, {
                text: "SIGAA está online! ✅\nhttps://si3.ufc.br/sigaa"
            }, { quoted: message });
        } else {
            return await data.socket.sendMessage(data.chatId, {
                text: "SIGAA está offline! 😓"
            }, { quoted: message });
        }
    }
}
