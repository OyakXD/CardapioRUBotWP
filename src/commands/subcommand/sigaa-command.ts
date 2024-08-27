import HttpConnection from "../../request/http-connection";
import { ReplyMessageFunction, SubCommand } from "../sub-command";

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

  public async execute(reply: ReplyMessageFunction): Promise<any> {
    if (await HttpConnection.sigaa()) {
      await reply({
        text: "SIGAA está online! ✅\nhttps://si3.ufc.br/sigaa",
      });
    } else {
      await reply({
        text: "SIGAA está offline! 😓",
      });
    }
  }
}
