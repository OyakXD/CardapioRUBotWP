import { CommandData, ReplyMessageFunction, SubCommand } from "../sub-command";
import fs from "fs";

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
    reply: ReplyMessageFunction,
    args: string[],
    data: CommandData
  ): Promise<any> {
    const { remoteJid } = data;

    if (remoteJid == "120363211196009871@g.us") {
      await reply({
        image: fs.readFileSync("images/xandao.jpg"),
        caption: "Xandão é o cara! 😎",
        width: 256,
        height: 356,
      });
    } else {
      await reply({
        text: "Esse comando não pode ser executado aqui! 😅",
      });
    }
  }
}
