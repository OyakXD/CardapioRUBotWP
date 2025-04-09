import { Message } from "whatsapp-web.js";
import { SubCommand } from "../sub-command";
import { CONQUISTAS } from "../../core/conquistas";

export class TabelaConquista extends SubCommand {

  public getCommandName(): string {
    return "tabela-conquista";
  }

  public getCommandLabels(): string[] {
    return ["tabela"];
  }

  public getDescription(): string {
    return "Veja os ranks disponíveis";
  }

  public async execute(message: Message): Promise<any> {
    let resposta = "📊 Tabela de Conquistas:\n\n"    

    for (const c of CONQUISTAS){
      resposta += `- ${c.titulo} — ${c.pontos} Pontuação\n`;
    }

    await message.reply(resposta.trim());
  }
}
