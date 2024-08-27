import { CommandData, ReplyMessageFunction, SubCommand } from "../sub-command";

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
    reply: ReplyMessageFunction,
    args: string[],
    data: CommandData
  ): Promise<any> {
    await reply({
      text: JSON.stringify(data, null, 2),
    });
  }
}
