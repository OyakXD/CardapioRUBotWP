import { WAMessage, proto } from "@whiskeysockets/baileys";
import { CommandHandler } from "../command-base";
import { SubCommand, CommandData } from "../sub-command";

export class HelpCommand extends SubCommand {
    public hideCommandHelp(): boolean {
        return true;
    }

    public getCommandName(): string {
        return "ajuda";
    }

    public getCommandLabels(): string[] {
        return ["help", "comandos", "commands"];
    }

    public getDescription(): string {
        return "Veja os comandos disponíveis";
    }

    public async execute(message: WAMessage, args: string[], data: CommandData): Promise<any> {
        const messages = [`*Comandos disponíveis:*`, ``];
        const commands = CommandHandler.getCommands();

        for (const command of commands) {
            if (command.hideCommandHelp()) {
                continue;
            }
            const commandArguments = command
                .getArguments()
                .map((arg) => `<${arg}>`)
                .join(" ");
            const commandTitle =
                `${command.getCommandName()} ${commandArguments}`.trim();

            messages.push(`- \`${commandTitle}\` ${command.getDescription()}!`);
        }

        messages.push(``, `use /<comando> para utilizar o comando`);

        await data.socket.sendMessage(data.chatId, {
            text: messages.join("\n").trim()
        }, { quoted: message });

    }
}
