import { proto } from "baileys";
import { MenuManager } from "../manager/menu-manager";

export const prefix = "!";

export class commandHandler {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix || "!";
  }

  public async handle({ message }: proto.IWebMessageInfo) {
    const body =
      message.extendedTextMessage?.text || message.conversation || "";

    if (body.startsWith(this.prefix)) {
      const args = body.slice(this.prefix.length).trim().split(" ");
      const command = args.shift()?.toLowerCase();

      switch (command) {
        case "amor":
          return "Você é muito especial para mim!";
        case "cardapio":
        case "Cardápio":
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
}
