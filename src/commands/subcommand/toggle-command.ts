import { UserManager } from "../../manager/user-manager";
import { CommandData, ReplyMessageFunction, SubCommand } from "../sub-command";

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
    reply: ReplyMessageFunction,
    args: string[],
    data: CommandData
  ): Promise<any> {
    const { remoteJid, isGroup, groupParticipant } = data;

    if (!isGroup) {
      return await reply({
        text: "Esse comando só pode ser executado em grupo! 😅",
      });
    }

    const isParticipantAdmin = !!groupParticipant.admin!;

    if (!isParticipantAdmin) {
      return await reply({
        text: "Apenas administradores podem executar esse comando! 😅",
      });
    }

    if (!(await UserManager.canReceiveNotification(remoteJid))) {
      if (await UserManager.addReceiveNotification(remoteJid)) {
        return await reply({
          text: "Agora o cardápio diário será enviado para esse grupo! 🥳",
        });
      } else {
        return await reply({
          text: "Erro ao adicionar o grupo na lista de notificações! 😢",
        });
      }
    } else {
      if (await UserManager.removeReceiveNotification(remoteJid)) {
        return await reply({
          text: "Agora o cardápio diário não será mais enviado para esse grupo! 😢",
        });
      } else {
        return await reply({
          text: "Erro ao remover o grupo da lista de notificações! 😢",
        });
      }
    }
  }
}
