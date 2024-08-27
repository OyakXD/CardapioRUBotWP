import HttpConnection from "../../request/http-connection";
import { ReplyMessageFunction, SubCommand } from "../sub-command";

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

  public async execute(reply: ReplyMessageFunction): Promise<any> {
    if (await HttpConnection.sigaa()) {
      await reply({
        text: "SIPAC está online! ✅\nhttps://si3.ufc.br/sipac",
      });
    } else {
      await reply({
        text: "SIPAC está offline! 😓",
      });
    }
  }
}
