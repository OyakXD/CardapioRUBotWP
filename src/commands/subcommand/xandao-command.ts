import { Message, MessageMedia } from "../../services/types";
import { CommandData, SubCommand } from "../sub-command";

export class XandaoCommand extends SubCommand {
  public hideCommandHelp(): boolean {
    return true;
  }

  public getCommandName(): string {
    return "xandao";
  }

  public getCommandLabels(): string[] {
    return [];
  }

  public getDescription(): string {
    return "Veja a foto do xandao";
  }

  public async execute(
    message: Message,
    args: string[],
    data: CommandData
  ): Promise<any> {
    if (data.chatId == "120363211196009871@g.us") {
      await message.reply(MessageMedia.fromFilePath("images/xandao.jpg"), message.from, {
        caption: "Xandão é o cara! 😎",
      });
    } else {
      await message.reply("Esse comando não pode ser executado aqui! 😅");
    }
  }
}
