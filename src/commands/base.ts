import { proto, WASocket } from "baileys";
import { MenuManager } from "../manager/menu-manager";
import { UserManager } from "../manager/user-manager";
import { MenuParser } from "../parser/menu-parser";
import * as fs from "fs";
import log from "log-beautify";
import UsernameRegex from "github-username-regex-js";
import GroupManager from "../manager/group/group-manager";

export const prefix = "!";

export class commandHandler {
  private prefix: string;
  private thumbnailOfGithub: Buffer;

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
      const remoteJid = messageKey.remoteJid!;
      const chatPrivate = UserManager.isChatPrivate(remoteJid);
      const userJid = chatPrivate ? remoteJid : messageKey.participant!;
      const userPhone = userJid.split("@")[0];
      const participantID = messageKey.participant!;
      const groupParticipants =
        GroupManager.getGroupMetadata(remoteJid)?.participants;
      const groupParticipant = groupParticipants?.filter(
        (participant) => participant.id === participantID
      )[0];

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
        case "json":
          return JSON.stringify(
            {
              remoteJid,
              userJid,
              userPhone,
              userName: messageInfo.pushName,
              command: {
                name: command,
                args,
              },
              messageTimestamp: messageInfo.messageTimestamp,
              isGroup: !chatPrivate,
              participantID,
              ...(groupParticipant && { groupParticipant }),
            },
            null,
            2
          );
        case "toggle":
          if (chatPrivate) {
            return "Esse comando só pode ser executado em grupo! 😅";
          }

          const isParticipantAdmin = !!groupParticipant.admin!;

          if (!isParticipantAdmin) {
            return "Apenas administradores podem executar esse comando! 😅";
          }

          if (await UserManager.canReceiveNotification(remoteJid)) {
            await UserManager.removeReceiveNotification(remoteJid);

            return "Agora o cardápio diário não será mais enviado para esse grupo! 😢";
          } else {
            await UserManager.addReceiveNotification(remoteJid);

            return "Agora o cardápio diário será enviado para esse grupo! 🥳";
          }
        case "start":
          if (!chatPrivate) {
            return "Esse comando só pode ser executado em uma conversa privada! 😅";
          }

          if (!MenuManager.canReceiveNotificationInPrivateChat()) {
            return "Esse comando não está disponível no momento! 😢";
          }

          if (!(await UserManager.canReceiveNotification(remoteJid))) {
            if (await UserManager.addReceiveNotification(remoteJid)) {
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

          if (await UserManager.canReceiveNotification(remoteJid)) {
            await UserManager.removeReceiveNotification(remoteJid);

            if (await UserManager.removeReceiveNotification(remoteJid)) {
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
            //`- \`!start\` Receba o cardápio diariamente as 10:40 e 16:40!`,
            //`- \`!stop\` Pare de receber o cardápio diariamente!`,
            `- \`!codigo ou !github\` Para ver o repositorio do bot!`,
            `- \`!torrar <username>\` Descreva o perfil do github!`,
          ];
          return message.join("\n").trim();
        case "xandao":
          if (remoteJid == "120363211196009871@g.us") {
            await socket.sendMessage(
              messageKey.remoteJid,
              {
                image: fs.readFileSync("images/xandao.jpg"),
                caption: "Xandão é o cara! 😎",
              },
              { quoted: messageInfo }
            );
          } else {
            return "Esse comando não pode ser executado aqui! 😅";
          }

          break;
        case "codigo":
        case "github":
          // const urlContent = await getUrlInfo(
          //   "https://github.com/OyakXD/CardapioRUBotWP"
          // );

          // const linkPreview = {
          //   ...urlContent,
          //   jpegThumbnail: Buffer.from(
          //     await (await fetch(urlContent.originalThumbnailUrl)).arrayBuffer()
          //   ),
          // };

          if (!this.thumbnailOfGithub) {
            this.thumbnailOfGithub = Buffer.from(
              await (
                await fetch(
                  "https://avatars.githubusercontent.com/u/131064997?v=4"
                )
              ).arrayBuffer()
            );
          }

          await socket.sendMessage(
            messageKey.remoteJid,
            {
              text: "https://github.com/OyakXD/CardapioRUBotWP",
              linkPreview: {
                "matched-text": "https://github.com/OyakXD/CardapioRUBotWP",
                "canonical-url": "https://github.com/OyakXD/CardapioRUBotWP",
                description:
                  "Contribute to OyakXD/CardapioRUBotWP development by creating an account on GitHub.",
                title: "GitHub - OyakXD/CardapioRUBotWP",
                jpegThumbnail: this.thumbnailOfGithub,
              },
            },
            { quoted: messageInfo }
          );
          break;
        case "torrar":
          const username = args.join(" ");

          if (UsernameRegex.test(username)) {
            const response = await fetch(
              `https://joaosvc-roast-api.vercel.app/search?username=${encodeURI(
                username
              )}`
            );

            if (response.status === 200) {
              const data = await response.json();

              if (data.roast) {
                return data.roast;
              }
            } else if (response.status === 500) {
              return "Ops! Parece que nossa torrefadora atingiu o limite diario. Tente novamente amanhã! 😢";
            }

            return "Ops! Parece que nossa torrefadora está em pausa para o café. Tente novamente mais tarde! 😢";
          } else {
            return "Username inválido, por favor, insira um username válido. 😢";
          }
      }
    }

    return null;
  }
}
