import { Message } from "whatsapp-web.js";
import { UserManager } from "../../manager/user-manager";
import { CommandData, SubCommand } from "../sub-command";

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
    message: Message,
    args: string[],
    data: CommandData
  ): Promise<any> {
    const { chatId, chatPrivate } = data;

    if (!chatPrivate) {
      return await message.reply("Esse comando só pode ser executado em uma conversa privada! 😅");
    }

    if (!UserManager.canReceiveNotificationInPrivateChat()) {
      return await message.reply("Esse comando não está disponível no momento! 😢");
    }

    if (await UserManager.canReceiveNotification(chatId)) {
      if (await UserManager.removeReceiveNotification(chatId)) {
        return await message.reply("Agora você não está recebendo o cardápio diário! 😢");
      } else {
        return await message.reply("Erro ao remover você da lista de notificações! 😢");
      }
    } else {
      return await message.reply("Você não está recebendo o cardápio diário! 😅");
    }
  }
}
