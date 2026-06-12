
import { WAMessage } from "baileys";
import { UserManager } from "../../manager/user-manager";
import { CommandData, SubCommand } from "../sub-command";

export class ToggleCommand extends SubCommand {
    public hideCommandHelp(): boolean {
        return true;
    }

    public getCommandName(): string {
        return "toggle";
    }

    public getCommandLabels(): string[] {
        return [];
    }

    public getDescription(): string {
        return "Ative ou desative o cardápio diário nos grupos";
    }

    public async execute(
        message: WAMessage,
        args: string[],
        data: CommandData
    ): Promise<any> {
        const { chatId, isGroup, isParticipantAdmin } = data;

        if (!isGroup) {
            return await data.socket.sendMessage(data.chatId, {
                text: "Esse comando só pode ser executado em grupo! 😅"
            }, { quoted: message });
        }

        if (!isParticipantAdmin) {
            return await data.socket.sendMessage(data.chatId, {
                text: "Apenas administradores podem executar esse comando! 😅"
            }, { quoted: message });
        }

        if (!(await UserManager.canReceiveNotification(chatId))) {
            if (await UserManager.addReceiveNotification(chatId)) {
                return await data.socket.sendMessage(data.chatId, {
                    text: "Agora o cardápio diário será enviado para esse grupo! 🥳"
                }, { quoted: message });
            } else {
                return await data.socket.sendMessage(data.chatId, {
                    text: "Erro ao adicionar o grupo na lista de notificações! 😢"
                }, { quoted: message });
            }
        } else {
            if (await UserManager.removeReceiveNotification(chatId)) {
                return await data.socket.sendMessage(data.chatId, {
                    text: "Agora o cardápio diário não será mais enviado para esse grupo! 😢"
                }, { quoted: message });
            } else {
                return await data.socket.sendMessage(data.chatId, {
                    text: "Erro ao remover o grupo da lista de notificações! 😢"
                }, { quoted: message });
            }
        }
    }
}
