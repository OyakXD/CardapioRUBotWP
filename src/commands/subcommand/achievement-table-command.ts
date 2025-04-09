import { Message } from "whatsapp-web.js";
import { SubCommand } from "../sub-command";
import { ACHIEVEMENTS } from "../../user/types";

export class AchievementTableCommand extends SubCommand {

  public getCommandName(): string {
    return "tabela-conquista";
  }

  public getCommandLabels(): string[] {
    return ["tabela", "ranks"];
  }

  public getDescription(): string {
    return "Veja os ranks disponíveis";
  }

  public async execute(message: Message): Promise<any> {
      let resposta = "📊 Tabela de Conquistas:\n\n"    
  
      for (const achievement of ACHIEVEMENTS){
        resposta += `- ${achievement.displayName} — ${achievement.requiredDays} Pontuação\n`;
      }
  
      await message.reply(resposta.trim());
  }
}
