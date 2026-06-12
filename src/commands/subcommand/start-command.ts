import { UserManager } from "../../manager/user-manager";
import { CommandData, SubCommand } from "../sub-command";
import { WAMessage } from "@whiskeysockets/baileys/lib/Types/Message";

export class StartCommand extends SubCommand {
    public getCommandName(): string {
        return "start";
    }

    public getCommandLabels(): string[] {
        return ["iniciar"];
    }

    public getDescription(): string {
        return "Receba o cardápio diariamente as 10:40 e 16:40";
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

        if (!(await UserManager.canReceiveNotification(chatId))) {
            if (await UserManager.addReceiveNotification(chatId)) {
                return await data.socket.sendMessage(data.chatId, {
                    text: "Agora você está recebendo o cardápio diário! 🥳"
                }, { quoted: message });
            } else {
                return await data.socket.sendMessage(data.chatId, {
                    text: "Erro ao adicionar você na lista de notificações! 😢"
                }, { quoted: message });
            }
        } else {
            return await data.socket.sendMessage(data.chatId, {
                text: "Você já está recebendo o cardápio diário! 😅"
            }, { quoted: message });
        }
    }
}
