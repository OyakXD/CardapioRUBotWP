import { Message, MessageMedia } from "../../services/types";
import { CommandData, SubCommand } from "../sub-command";

export class ZureaCommand extends SubCommand {
  public hideCommandHelp(): boolean {
    return true;
  }

  public getCommandName(): string {
    return "zurea";
  }

  public getCommandLabels(): string[] {
    return [];
  }

  public getDescription(): string {
    return "Veja a foto do zurea";
  }

  public async execute(
    message: Message,
    args: string[],
    data: CommandData
  ): Promise<any> {

    if (data.chatId == "120363211196009871@g.us") {
      await message.reply(MessageMedia.fromFilePath("images/mauricio.jpg"), message.from, {
        caption: "😲",
      });
    } else {
      await message.reply("Esse comando não pode ser executado aqui! 😅");
    }
  }
}
