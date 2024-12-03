import { Message } from "whatsapp-web.js";
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
    message: Message,
    args: string[],
    data: CommandData
  ): Promise<any> {
    await message.reply(JSON.stringify(data, null, 2));
  }
}
