import { CommandHandler } from "../command-base";
import { ReplyMessageFunction, SubCommand } from "../sub-command";

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

  public async execute(reply: ReplyMessageFunction): Promise<any> {
    const message = [`*Comandos disponíveis:*`, ``];
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

      message.push(`- \`${commandTitle}\` ${command.getDescription()}!`);
    }

    await reply({
      text: message.join("\n").trim(),
    });
  }
}
