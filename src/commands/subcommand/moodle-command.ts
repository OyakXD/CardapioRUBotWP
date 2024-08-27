import HttpConnection from "../../request/http-connection";
import { ReplyMessageFunction, SubCommand } from "../sub-command";

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

  public async execute(reply: ReplyMessageFunction): Promise<any> {
    if (await HttpConnection.sigaa()) {
      await reply({
        text: "Moodle está online! ✅\nhttps://moodle2.quixada.ufc.br",
      });
    } else {
      await reply({
        text: "Moodle está offline! 😓",
      });
    }
  }
}
