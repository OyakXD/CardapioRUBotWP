import { Message } from "whatsapp-web.js";
import HttpConnection from "../../request/http-connection";
import { SubCommand } from "../sub-command";

export class MoodleCommand extends SubCommand {
  public getCommandName(): string {
    return "moodle";
  }

  public getCommandLabels(): string[] {
    return [];
  }

  public getDescription(): string {
    return "Verifique se o MOODLE está online";
  }

  public async execute(message: Message): Promise<any> {
    if (await HttpConnection.moodle()) {
      await message.reply("Moodle está online! ✅\nhttps://moodle2.quixada.ufc.br");
    } else {
      await message.reply("Moodle está offline! 😓");
    }
  }
}
