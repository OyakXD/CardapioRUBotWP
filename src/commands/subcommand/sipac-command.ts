import { Message } from "whatsapp-web.js";
import HttpConnection from "../../request/http-connection";
import { SubCommand } from "../sub-command";

export class SipacCommand extends SubCommand {
  public getCommandName(): string {
    return "sipac";
  }

  public getCommandLabels(): string[] {
    return [];
  }

  public getDescription(): string {
    return "Verifique se o SIPAC está online";
  }

  public async execute(message: Message): Promise<any> {
    if (await HttpConnection.sipac()) {
      await message.reply("SIPAC está online! ✅\nhttps://si3.ufc.br/sipac");
    } else {
      await message.reply("SIPAC está offline! 😓");
    }
  }
}
