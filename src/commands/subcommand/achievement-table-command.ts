import { CommandData, SubCommand } from "../sub-command";
import { ACHIEVEMENTS } from "../../user/types";
import { WAMessage } from "@whiskeysockets/baileys/lib/Types/Message";

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

    public async execute(message: WAMessage, args: string[], data: CommandData): Promise<any> {
        let resposta = "📊 Tabela de Conquistas:\n\n"

        for (const achievement of ACHIEVEMENTS) {
            if (achievement.requiredDays < 9999) {
                resposta += `- ${achievement.displayName} — ${achievement.requiredDays} Pontos(dias)\n`;
            }
        }


        await data.socket.sendMessage(data.chatId, {
            text: resposta.trim()
        }, { quoted: message });
    }
}
