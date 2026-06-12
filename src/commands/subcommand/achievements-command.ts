import { CommandData, SubCommand } from "../sub-command";
import { UserAchievement } from "../../user/user-achievement";
import { UserManager } from "../../manager/user-manager";
import GroupManager from "../../manager/group/group-manager";
import { WAMessage } from "@whiskeysockets/baileys/lib/Types/Message";

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
        message: WAMessage,
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
                    return await data.socket.sendMessage(data.chatId, {
                        text: "❌ Número mencionado inválido."
                    }, { quoted: message });
                }

                targetUserId = UserManager.convertPhoneToJid(`55${mentionedNumber}`);
            }

            const { message: achievementMessage, mentions } = await UserAchievement.showAchievement(targetUserId, data.chatId);

            const options = {
                // mentions: data.isGroup ? mentions.filter(mention => {
                //   return GroupManager.isGroupMember(data.chatId, mention);
                // }) : mentions
            };

            return await data.socket.sendMessage(data.chatId, {
                text: achievementMessage
            }, { quoted: message });

        } catch (error) {
            console.error('Erro no comando conquistas:', error);
            await data.socket.sendMessage(data.chatId, {
                text: "❌ Ocorreu um erro ao exibir as conquistas."
            }, { quoted: message });
        }
    }
}
