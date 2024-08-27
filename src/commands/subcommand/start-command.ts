import { UserManager } from "../../manager/user-manager";
import { CommandData, ReplyMessageFunction, SubCommand } from "../sub-command";

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

    if (!(await UserManager.canReceiveNotification(remoteJid))) {
      if (await UserManager.addReceiveNotification(remoteJid)) {
        return await reply({
          text: "Agora você está recebendo o cardápio diário! 🥳",
        });
      } else {
        return await reply({
          text: "Erro ao adicionar você na lista de notificações! 😢",
        });
      }
    } else {
      return await reply({
        text: "Você já está recebendo o cardápio diário! 😅",
      });
    }
  }
}
