import { WAMessage } from "baileys";
import { CommandData, SubCommand } from "../sub-command";

export class DebugCommand extends SubCommand {
    public hideCommandHelp(): boolean {
        return true;
    }

    public getCommandName(): string {
        return "debug";
    }

    public getCommandLabels(): string[] {
        return ["json"];
    }

    public getDescription(): string {
        return "Veja os dados da mensagem";
    }

    public async execute(
        message: WAMessage,
        args: string[],
        data: CommandData
    ): Promise<any> {
        await data.socket.sendMessage(data.chatId, {
            text: JSON.stringify(message, null, 2)
        }, { quoted: message });
    }
}
