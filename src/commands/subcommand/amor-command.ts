import { ReplyMessageFunction, SubCommand } from "../sub-command";

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

  public async execute(reply: ReplyMessageFunction): Promise<any> {
    await reply({
      text: "Você é muito especial para mim! ❤️",
    });
  }
}
