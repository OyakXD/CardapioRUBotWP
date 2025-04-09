import { Message } from "whatsapp-web.js";
import { SubCommand } from "../sub-command";
import { gerarRankingPorDia } from "../../core/conquistas";

export class RankingCommand extends SubCommand {

  public getCommandName(): string {
    return "ranking";
  }

  public getCommandLabels(): string[] {
    return ["rank"];
  }

  public getDescription(): string {
    return "Veja o ranking dos mais ativos nas consultas do cárdapio! - Contabilize seus pontos usando o /cardapio por dia";
  }

  public async execute(message: Message): Promise<any> {
    const resposta = gerarRankingPorDia();
    await message.reply(resposta);
  }
}
