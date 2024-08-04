import { proto, WASocket } from "baileys";
import { MenuManager } from "../manager/menu-manager";
import { UserManager } from "../manager/user-manager";

export const prefix = "!";

export class commandHandler {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix || "!";
  }

  public async handle(
    { message, key: messageKey }: proto.IWebMessageInfo,
    socket: WASocket
  ) {
    const body =
      message.extendedTextMessage?.text || message.conversation || "";

    if (body.startsWith(this.prefix)) {
      const args = body.slice(this.prefix.length).trim().split(" ");
      const command = args.shift()?.toLowerCase();
      const userId = messageKey.remoteJid!;

      switch (command) {
        case "amor":
          return "Você é muito especial para mim!";
        case "cardapio":
        case "cardápio":
          const { lunch, dinner, date } = await MenuManager.getMenu();

          const [lunchMessage, dinnerMessage] = await Promise.all([
            await this.getMenuMessage(lunch),
            await this.getMenuMessage(dinner),
          ]);

          const currentHour = MenuManager.getCurrentDate().getHours();
          const periodMessage =
            currentHour < 12
              ? "Bom dia"
              : currentHour < 18
              ? "Boa tarde"
              : "Boa noite";

          const message = [
            `🍽 ${periodMessage} alunos! No cardápio de hoje (${date}) teremos: 🕛`,
            ``,
            `*Almoço:*`,
            "-".repeat(40),
            lunchMessage,
            ``,
            `*Jantar:*`,
            "-".repeat(40),
            dinnerMessage,
          ];

          return message.join("\n").trim();
        case "toggle":
          if (this.isChatPrivate(messageKey)) {
            return "Esse comando só pode ser executado em grupo!";
          }

          const participantID = messageKey.participant!;
          const groupParticipant = (
            await socket.groupMetadata(messageKey.remoteJid!)
          ).participants.filter(
            (participant) => participant.id === participantID
          )[0]!;
          const isParticipantAdmin = !!groupParticipant.admin!;

          if (!isParticipantAdmin) {
            return "Apenas administradores podem executar esse comando!";
          }

          if (await UserManager.canReceiveNotification(userId)) {
            await UserManager.removeReceiveNotification(userId);

            return "Agora o cardápio diário não será mais enviado para esse grupo!";
          } else {
            await UserManager.addReceiveNotification(userId);

            return "Agora o cardápio diário será enviado para esse grupo!";
          }
        case "start":
          if (!this.isChatPrivate(messageKey)) {
            return "Esse comando só pode ser executado em uma conversa privada!";
          }

          if (!MenuManager.canReceiveNotificationInPrivateChat()) {
            return "Esse comando não está disponível no momento!";
          }

          if (!(await UserManager.canReceiveNotification(userId))) {
            if (await UserManager.addReceiveNotification(userId)) {
              return "Agora você está recebendo o cardápio diário!";
            } else {
              return "Erro ao adicionar você na lista de notificações!";
            }
          } else {
            return "Você já está recebendo o cardápio diário!";
          }
        case "stop":
          if (!this.isChatPrivate(messageKey)) {
            return "Esse comando só pode ser executado em uma conversa privada!";
          }

          if (!MenuManager.canReceiveNotificationInPrivateChat()) {
            return "Esse comando não está disponível no momento!";
          }

          if (await UserManager.canReceiveNotification(userId)) {
            await UserManager.removeReceiveNotification(userId);

            if (await UserManager.removeReceiveNotification(userId)) {
              return "Agora você não está recebendo o cardápio diário!";
            } else {
              return "Erro ao remover você da lista de notificações!";
            }
          } else {
            return "Você não está recebendo o cardápio diário!";
          }
        default:
          return "Comando não encontrado";
      }
    }

    return null;
  }

  public async getMenuMessage(menu: { [key: string]: string[] }) {
    let message = "";

    const emojis = {
      Principal: ["🍛", "🍲"],
      Vegetariano: "🌱",
      Acompanhamento: ["🍚", "🍚", "🫘"],
      Salada: "🥗",
      Guarnição: "🍟",
      Sobremesa: ["🍈", "🍬"],
      Suco: "🍹",
    };

    for (const [category, itens] of Object.entries(menu)) {
      message += `\n${category}: \n`;

      const emojiCategory = emojis[category] || "";
      const emojiList = Array.isArray(emojiCategory)
        ? emojiCategory
        : [emojiCategory];

      itens.forEach((item, index) => {
        const emoji = emojiList[index]! || "";
        const itemMessage = `${item} ${emoji}`.trim();

        message += `- ${itemMessage}\n`;
      });
    }
    return message.trim();
  }

  public isChatPrivate(messageKey: proto.IMessageKey) {
    return messageKey.remoteJid!.includes("@s.whatsapp.net")!;
  }
}
