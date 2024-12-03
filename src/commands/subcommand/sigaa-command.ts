import { Message } from "whatsapp-web.js";
import HttpConnection from "../../request/http-connection";
import { SubCommand } from "../sub-command";

export class SigaaCommand extends SubCommand {
  public getCommandName(): string {
    return "sigaa";
  }

  public getCommandLabels(): string[] {
    return [];
  }

  public getDescription(): string {
    return "Verifique se o SIGAA está online";
  }

  public async execute(message: Message): Promise<any> {
    if (await HttpConnection.sigaa()) {
      await message.reply("SIGAA está online! ✅\nhttps://si3.ufc.br/sigaa");
    } else {
      await message.reply("SIGAA está offline! 😓");
    }
  }
}
