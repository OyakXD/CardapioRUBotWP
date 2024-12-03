import { Message } from "whatsapp-web.js";
import { UserManager } from "../../manager/user-manager";
import { CommandData, SubCommand } from "../sub-command";

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

    if (!(await UserManager.canReceiveNotification(chatId))) {
      if (await UserManager.addReceiveNotification(chatId)) {
        return await message.reply("Agora você está recebendo o cardápio diário! 🥳");
      } else {
        return await message.reply("Erro ao adicionar você na lista de notificações! 😢");
      }
    } else {
      return await message.reply("Você já está recebendo o cardápio diário! 😅");
    }
  }
}
