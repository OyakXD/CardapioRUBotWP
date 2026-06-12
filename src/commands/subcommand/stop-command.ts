import { UserManager } from "../../manager/user-manager";
import { CommandData, SubCommand } from "../sub-command";
import { WAMessage } from "@whiskeysockets/baileys/lib/Types/Message";

export class StopCommand extends SubCommand {
    public getCommandName(): string {
        return "stop";
    }

    public getCommandLabels(): string[] {
        return ["parar"];
    }

    public getDescription(): string {
        return "Pare de receber o cardápio diario";
    }

    public async execute(
        message: WAMessage,
        args: string[],
        data: CommandData
    ): Promise<any> {
        const { chatId, chatPrivate } = data;

        if (!chatPrivate) {
            return await data.socket.sendMessage(data.chatId, {
                text: "Esse comando só pode ser executado em uma conversa privada! 😅"
            }, { quoted: message });
        }

        if (!UserManager.canReceiveNotificationInPrivateChat()) {
            return await data.socket.sendMessage(data.chatId, {
                text: "Esse comando não está disponível no momento! 😢"
            }, { quoted: message });
        }

        if (await UserManager.canReceiveNotification(chatId)) {
            if (await UserManager.removeReceiveNotification(chatId)) {
                return await data.socket.sendMessage(data.chatId, {
                    text: "Agora você não está recebendo o cardápio diário! 😢"
                }, { quoted: message });
            } else {
                return await data.socket.sendMessage(data.chatId, {
                    text: "Erro ao remover você da lista de notificações! 😢"
                }, { quoted: message });
            }
        } else {
            return await data.socket.sendMessage(data.chatId, {
                text: "Você não está recebendo o cardápio diário! 😅"
            }, { quoted: message });
        }
    }
}
