import { Message } from "whatsapp-web.js";
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
    message: Message,
    args: string[],
    data: CommandData
  ): Promise<any> {
    const { chatId, isGroup, isParticipantAdmin } = data;

    if (!isGroup) {
      return await message.reply("Esse comando só pode ser executado em grupo! 😅");
    }

    if (!isParticipantAdmin) {
      return await message.reply("Apenas administradores podem executar esse comando! 😅");
    }

    if (!(await UserManager.canReceiveNotification(chatId))) {
      if (await UserManager.addReceiveNotification(chatId)) {
        return await message.reply("Agora o cardápio diário será enviado para esse grupo! 🥳");
      } else {
        return await message.reply("Erro ao adicionar o grupo na lista de notificações! 😢");
      }
    } else {
      if (await UserManager.removeReceiveNotification(chatId)) {
        return await message.reply("Agora o cardápio diário não será mais enviado para esse grupo! 😢");
      } else {
        return await message.reply("Erro ao remover o grupo da lista de notificações! 😢");
      }
    }
  }
}
