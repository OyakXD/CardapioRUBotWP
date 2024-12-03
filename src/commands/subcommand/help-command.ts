import { Message } from "whatsapp-web.js";
import { CommandHandler } from "../command-base";
import { SubCommand } from "../sub-command";

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

  public async execute(message: Message): Promise<any> {
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

    await message.reply(messages.join("\n").trim());
  }
}
