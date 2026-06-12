
import { CommandData, SubCommand } from "../sub-command";
import { UserAchievement } from "../../user/user-achievement";
import GroupManager from "../../manager/group/group-manager";
import { WAMessage } from "baileys";

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
        message: WAMessage,
        args: string[],
        data: CommandData
    ): Promise<any> {
        const { message: topMessage, mentions } = await UserAchievement.generateRankingDay();

        const options = {
            // mentions: data.isGroup ? mentions.filter(mention => {
            //   return GroupManager.isGroupMember(data.chatId, mention);
            // }) : mentions
        };

        await data.socket.sendMessage(data.chatId, {
            text: topMessage
        }, { quoted: message });
    }
}
