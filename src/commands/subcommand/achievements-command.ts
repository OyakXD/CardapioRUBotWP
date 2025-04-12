import { Message } from "../../services/types";
import { CommandData, SubCommand } from "../sub-command";
import { UserAchievement } from "../../user/user-achievement";
import { UserManager } from "../../manager/user-manager";

export class AchievementsCommand extends SubCommand {

  public getCommandName(): string {
    return "conquistas";
  }

  public getCommandLabels(): string[] {
    return ["conqs"];
  }

  public getDescription(): string {
    return "Veja as conquistas de um usuario de consulta no cardápio do RU";
  }

  public async execute(
    message: Message,
    args: string[],
    data: CommandData
  ): Promise<any> {
    try {
      const mentionedUser = args.join(" ").trim();
      
      let targetUserId = data.userId;

      if (mentionedUser) {
        let mentionedNumber = mentionedUser.replace(/\D/g, '');

        if (mentionedNumber.startsWith('55')) {
          mentionedNumber = mentionedNumber.substring(2);
        }

        if (mentionedNumber.length === 11 && mentionedNumber.startsWith('9')) {
          mentionedNumber = mentionedNumber.substring(1);
        }

        if (mentionedNumber.length !== 10) {
          return await message.reply("❌ Número mencionado inválido.");
        }
        
        mentionedNumber = `55${mentionedNumber}`;
        
        const mentionedUserData = UserManager.getUser(mentionedNumber);

        if (mentionedUserData) {
          targetUserId = UserManager.convertPhoneToJid(mentionedNumber);
        } else {
          return await message.reply("❌ Usuário mencionado não encontrado no sistema.");
        }
      }

      const { message: achievementMessage, mentions } = await UserAchievement.showAchievement(targetUserId);

      const options = {
        mentions: data.isGroup ? mentions.filter(mention => {
          return data.groupParticipants?.some(p => p.id === mention) ?? false;
        }) : mentions
      };

      await message.reply(achievementMessage, undefined, options);
      
    } catch (error) {
      console.error('Erro no comando conquistas:', error);
      await message.reply("❌ Ocorreu um erro ao exibir as conquistas.");
    }
  }
}
