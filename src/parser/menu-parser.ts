import { MenuManager } from "../manager/menu-manager";
import { Menu } from "../types/types";
import Utils from "../utils/utils";
import { EmojiParser } from "./emoji-parser";

export const MENU_TYPE_PRINCIPAL = "Principal";
export const MENU_TYPE_VEGETARIANO = "Vegetariano";
export const MENU_TYPE_ACOMPANHAMENTO = "Acompanhamento";
export const MENU_TYPE_SALADA = "Salada";
export const MENU_TYPE_GUARNICAO = "Guarnição";
export const MENU_TYPE_SOBREMSA = "Sobremesa";
export const MENU_TYPE_SUCO = "Suco";

export const MENU_TYPES = [
  MENU_TYPE_PRINCIPAL,
  MENU_TYPE_VEGETARIANO,
  MENU_TYPE_ACOMPANHAMENTO,
  MENU_TYPE_SALADA,
  MENU_TYPE_GUARNICAO,
  MENU_TYPE_SOBREMSA,
  MENU_TYPE_SUCO,
] as const;

export type MenuCategory = (typeof MENU_TYPES)[number];

export class MenuParser {
  public static async mountMenuMessage(
    lunch: Menu,
    dinner: Menu,
    date: string
  ) {
    const message = [
      ...this.getMenuHead(date),
      ``,
      ...(await this.mountMenuOpcionalMessage("lunch", lunch)),
      ``,
      ...(await this.mountMenuOpcionalMessage("dinner", dinner)),
    ];

    return message.join("\n").trim();
  }

  public static async mountMenu(type: "lunch" | "dinner") {
    const { lunch, dinner, date } = await MenuManager.getMenu();

    const message = [...this.getMenuHead(date), ``];

    if (type === "lunch") {
      message.push(...(await this.mountMenuOpcionalMessage("lunch", lunch)));
    } else if (type === "dinner") {
      message.push(...(await this.mountMenuOpcionalMessage("dinner", dinner)));
    }

    return message.join("\n").trim();
  }

  public static getMenuHead(date: string) {
    const currentTime = Utils.getCurrentDate();
    const currentHour = parseInt(
      currentTime.toLocaleTimeString("pt-BR", {
        timeZone: "America/Fortaleza",
        hour: "2-digit",
        hour12: false,
      })
    );
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

  public static async getMenuMessage(menu: Menu) {
    if (!menu) {
      return "Não foi possível obter o cardápio.";
    }

    const emojiParser = new EmojiParser();

    let message = Object.entries(menu)
      .map(([category, items]) => {
        const itemMessages = items
          .map((item, index) => {
            const emoji =
              emojiParser.find(item, category as MenuCategory, index) || "";
            return `- ${item} ${emoji}`.trim();
          })
          .join("\n");

        return `\n${category}: \n${itemMessages}`;
      })
      .join("");

    return message.trim();
  }

  public static async mountMenuOpcionalMessage(
    type: "lunch" | "dinner",
    menu: Menu
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
