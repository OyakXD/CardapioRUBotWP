import { CommandData, ReplyMessageFunction, SubCommand } from "../sub-command";
import fs from "fs";

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
    reply: ReplyMessageFunction,
    args: string[],
    data: CommandData
  ): Promise<any> {
    const { remoteJid } = data;

    if (remoteJid == "120363211196009871@g.us") {
      await reply({
        image: fs.readFileSync("images/mauricio.jpg"),
        caption: "😲",
        width: 1220,
        height: 608,
      });
    } else {
      await reply({
        text: "Esse comando não pode ser executado aqui! 😅",
      });
    }
  }
}
