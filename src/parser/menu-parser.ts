import { MenuManager } from "../manager/menu-manager";

export class MenuParser {
  public static async mountMenuMessage(
    lunch: { [key: string]: string[] },
    dinner: { [key: string]: string[] },
    date: string
  ) {
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
  }

  public static async getMenuMessage(menu: { [key: string]: string[] }) {
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
