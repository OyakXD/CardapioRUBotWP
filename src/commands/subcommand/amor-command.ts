import { Message } from "../../services/types";
import { SubCommand } from "../sub-command";

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

  public async execute(message: Message): Promise<any> {
    await message.reply("Você é muito especial para mim! ❤️");
  }
}
