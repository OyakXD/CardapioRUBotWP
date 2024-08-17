import { proto, WASocket } from "baileys";
import { MenuManager } from "../manager/menu-manager";
import { UserManager } from "../manager/user-manager";
import { MenuParser } from "../parser/menu-parser";
import * as fs from "fs";
import log from "log-beautify";

export const prefix = "!";

export class commandHandler {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix || "!";
  }

  public async handle(messageInfo: proto.IWebMessageInfo, socket: WASocket) {
    const { message, key: messageKey } = messageInfo;
    const body =
      message.extendedTextMessage?.text || message.conversation || "";

    if (body.startsWith(this.prefix)) {
      const args = body.slice(this.prefix.length).trim().split(" ");
      const command = args.shift()?.toLowerCase();
      const userId = messageKey.remoteJid!;
      const chatPrivate = UserManager.isChatPrivate(userId);
      const userJid = chatPrivate ? userId : messageKey.participant!;
      const userPhone = userJid.split("@")[0];

      log.info_(`[SOCKET (INFO)] => ${userPhone} => /${command}`);

      switch (command) {
        case "amor":
          return "Você é muito especial para mim! ❤️";
        case "cardapio":
        case "cardápio":
          const { lunch, dinner, date } = await MenuManager.getMenu();

          if (!lunch || !dinner) {
            return "Não há cardápio cadastrado para este dia. A publicação poderá ser feita posteriormente ou pode não haver expediente no restaurante universitário neste dia.";
          }
          return MenuParser.mountMenuMessage(lunch, dinner, date);
        case "toggle":
          if (chatPrivate) {
            return "Esse comando só pode ser executado em grupo! 😅";
          }

          const participantID = messageKey.participant!;
          const groupParticipant = (
            await socket.groupMetadata(messageKey.remoteJid!)
          ).participants.filter(
            (participant) => participant.id === participantID
          )[0]!;
          const isParticipantAdmin = !!groupParticipant.admin!;

          if (!isParticipantAdmin) {
            return "Apenas administradores podem executar esse comando! 😅";
          }

          if (await UserManager.canReceiveNotification(userId)) {
            await UserManager.removeReceiveNotification(userId);

            return "Agora o cardápio diário não será mais enviado para esse grupo! 😢";
          } else {
            await UserManager.addReceiveNotification(userId);

            return "Agora o cardápio diário será enviado para esse grupo! 🥳";
          }
        case "start":
          if (!chatPrivate) {
            return "Esse comando só pode ser executado em uma conversa privada! 😅";
          }

          if (!MenuManager.canReceiveNotificationInPrivateChat()) {
            return "Esse comando não está disponível no momento! 😢";
          }

          if (!(await UserManager.canReceiveNotification(userId))) {
            if (await UserManager.addReceiveNotification(userId)) {
              return "Agora você está recebendo o cardápio diário! 🥳";
            } else {
              return "Erro ao adicionar você na lista de notificações! 😢";
            }
          } else {
            return "Você já está recebendo o cardápio diário! 😅";
          }
        case "stop":
          if (!chatPrivate) {
            return "Esse comando só pode ser executado em uma conversa privada! 😅";
          }

          if (!MenuManager.canReceiveNotificationInPrivateChat()) {
            return "Esse comando não está disponível no momento! 😢";
          }

          if (await UserManager.canReceiveNotification(userId)) {
            await UserManager.removeReceiveNotification(userId);

            if (await UserManager.removeReceiveNotification(userId)) {
              return "Agora você não está recebendo o cardápio diário! 😢";
            } else {
              return "Erro ao remover você da lista de notificações! 😢";
            }
          } else {
            return "Você não está recebendo o cardápio diário! 😅";
          }
        case "help":
        case "ajuda":
        case "info":
          const message = [
            `*Comandos disponíveis:*`,
            ``,
            `- \`!cardapio\` Veja o cardápio do dia!`,
            `- \`!start\` Receba o cardápio diariamente as 10:40 e 16:40!`,
            `- \`!stop\` Pare de receber o cardápio diariamente!`,
          ];
          return message.join("\n").trim();
        case "xandao":
          await socket.sendMessage(
            messageKey.remoteJid,
            {
              image: fs.readFileSync("images/xandao.jpg"),
              caption: "Xandão é o cara! 😎",
            },
            { quoted: messageInfo }
          );
          break;
      }
    }

    return null;
  }
}
