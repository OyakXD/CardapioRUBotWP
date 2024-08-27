import { UserManager } from "../../manager/user-manager";
import { CommandData, ReplyMessageFunction, SubCommand } from "../sub-command";

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
    reply: ReplyMessageFunction,
    args: string[],
    data: CommandData
  ): Promise<any> {
    const { remoteJid, chatPrivate } = data;

    if (!chatPrivate) {
      return await reply({
        text: "Esse comando só pode ser executado em uma conversa privada! 😅",
      });
    }

    if (!UserManager.canReceiveNotificationInPrivateChat()) {
      return await reply({
        text: "Esse comando não está disponível no momento! 😢",
      });
    }

    if (await UserManager.canReceiveNotification(remoteJid)) {
      if (await UserManager.removeReceiveNotification(remoteJid)) {
        return await reply({
          text: "Agora você não está recebendo o cardápio diário! 😢",
        });
      } else {
        return await reply({
          text: "Erro ao remover você da lista de notificações! 😢",
        });
      }
    } else {
      return await reply({
        text: "Você não está recebendo o cardápio diário! 😅",
      });
    }
  }
}
