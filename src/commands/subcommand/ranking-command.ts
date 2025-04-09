import { Message } from "whatsapp-web.js";
import { CommandData, SubCommand } from "../sub-command";
import { UserAchievement } from "../../user/user-achievement";

export class RankingCommand extends SubCommand {

  public getCommandName(): string {
    return "ranking";
  }

  public getCommandLabels(): string[] {
    return ["top"];
  }

  public getDescription(): string {
    return "Veja o ranking dos mais ativos nas consultas do cárdapio! - Contabilize seus pontos usando o /cardapio por dia";
  }

  public async execute(
    message: Message,
    args: string[],
    data: CommandData
  ): Promise<any> {
    const { message: topMessage, mentions } = await UserAchievement.generateRankingDay();

    const groupParticipants = data.groupParticipants || [];

    const options = {
      mentions: data.isGroup ? mentions.filter(mention => {
        return groupParticipants.some(p => p.id === mention);
      }) : mentions
    };

    await message.reply(topMessage, undefined, options);
  }
}
