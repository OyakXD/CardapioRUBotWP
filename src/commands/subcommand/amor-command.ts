import { WAMessage } from "baileys";
import { CommandData, SubCommand } from "../sub-command";

export class AmorCommand extends SubCommand {
    public hideCommandHelp(): boolean {
        return true;
    }

    public getCommandName(): string {
        return "amor";
    }

    public getCommandLabels(): string[] {
        return [];
    }

    public getDescription(): string {
        return "Mostre sua carência";
    }

    public async execute(message: WAMessage, args: string[], data: CommandData): Promise<any> {
        return await data.socket.sendMessage(data.chatId, {
            text: "Você é muito especial para mim! ❤️"
        }, { quoted: message });
    }
}
