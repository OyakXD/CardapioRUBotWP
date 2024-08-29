/**
 * EmojiParser
 *
 * Esta classe é responsável por armazenar os emojis utilizados no cardápio
 * Observação: as categorias são fixas e não podem ser alteradas.
 *
 * A estrutura da classe pode ser completamente alterada, desde que a função
 * find seja mantida.
 *
 * @class EmojiParser
 */

import {
  MENU_TYPE_ACOMPANHAMENTO,
  MENU_TYPE_GUARNICAO,
  MENU_TYPE_PRINCIPAL,
  MENU_TYPE_SALADA,
  MENU_TYPE_SOBREMSA,
  MENU_TYPE_SUCO,
  MENU_TYPE_VEGETARIANO,
  MenuCategory,
} from "./menu-parser";

type EMOJI_MAP = {
  [key in MenuCategory]: string | string[];
};

export class EmojiParser {
  public emojis: EMOJI_MAP = {
    [MENU_TYPE_PRINCIPAL]: ["🍛", "🍲"],
    [MENU_TYPE_VEGETARIANO]: "🌱",
    [MENU_TYPE_ACOMPANHAMENTO]: ["🍚", "🍚", "🫘"],
    [MENU_TYPE_SALADA]: "🥗",
    [MENU_TYPE_GUARNICAO]: "🍟",
    [MENU_TYPE_SOBREMSA]: ["🍎", "🍬"],
    [MENU_TYPE_SUCO]: "🍹",
  };

  private dessertEmojis: { [key: string]: string } = {
    banana: "🍌",
    maca: "🍎",
    melancia: "🍉",
    laranja: "🍊",
    mamao: "🥭",
    doce: "🍬",
  };

  private accompanimentEmoji: { [key: string]: string[] } = {
    "🍚": ["arroz"],
    "🫘": ["feijao"],
  };

  private garnishEmojis: { [key: string]: string[] } = {
    "🌽": ["cuscuz", "cuscuz de milho, farofa"],
    "🍝": ["macarrao", "espaguete", "penne", "fusilli"],
    "🍲": ["pure de abobora"],
  };

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "")
      .replace(/\s+/g, "");
  }

  public find(item: string, category: MenuCategory, index: number): string {
    const normalizedItem = this.normalizeText(item);

    if (this.dessertEmojis[normalizedItem]) {
      console.log();
      return this.dessertEmojis[normalizedItem];
    }

    if (category == MENU_TYPE_ACOMPANHAMENTO) {
      for (const [emoji, keywords] of Object.entries(this.accompanimentEmoji)) {
        if (keywords.some((keyword) => normalizedItem.includes(keyword))) {
          return emoji;
        }
      }
    }

    if (category == MENU_TYPE_GUARNICAO) {
      for (const [emoji, keywords] of Object.entries(this.garnishEmojis)) {
        if (
          keywords.some((keyword) =>
            normalizedItem.includes(keyword.replace(/\s+/g, ""))
          )
        ) {
          return emoji;
        }
      }
    }

    const emojiCategory = this.emojis[category];

    if (!emojiCategory) {
      return "";
    }

    const emojiList = Array.isArray(emojiCategory)
      ? emojiCategory
      : [emojiCategory];

    const emoji = emojiList[index % emojiList.length];

    return emoji;
  }
}
