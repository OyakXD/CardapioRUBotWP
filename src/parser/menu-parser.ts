import { MenuManager } from "../manager/menu-manager";

export class MenuParser {
  public static async mountMenuMessage(
    lunch: { [key: string]: string[] },
    dinner: { [key: string]: string[] },
    date: string
  ) {
    let message = [
      ...this.getMenuHead(date),
      ``,
      await this.mountMenuOpcionalMessage("lunch", lunch),
      ``,
      await this.mountMenuOpcionalMessage("dinner", dinner),
    ];

    return message.join("\n").trim();
  }

  public static async mountMenu(type: "lunch" | "dinner") {
    const { lunch, dinner, date } = await MenuManager.getMenu();

    let message = [...this.getMenuHead(date), ``];

    if (type === "lunch") {
      message.push(...(await this.mountMenuOpcionalMessage("lunch", lunch)));
    } else if (type === "dinner") {
      message.push(...(await this.mountMenuOpcionalMessage("dinner", dinner)));
    }

    return message.join("\n").trim();
  }

  public static getMenuHead(date: string) {
    const currentHour = MenuManager.getCurrentDate().getHours();
    const periodMessage =
      currentHour < 12
        ? "Bom dia"
        : currentHour < 18
        ? "Boa tarde"
        : "Boa noite";

    return [
      `🍽 ${periodMessage} alunos! No cardápio de hoje (${date}) teremos: 🕛`,
    ];
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

  public static async mountMenuOpcionalMessage(
    type: "lunch" | "dinner",
    menu: { [key: string]: string[] }
  ) {
    const menuMessage = await this.getMenuMessage(menu);

    return [
      type === "lunch" ? "*Almoço:*" : "*Jantar:*",
      ``,
      `=`.repeat(28),
      menuMessage,
    ];
  }
}
