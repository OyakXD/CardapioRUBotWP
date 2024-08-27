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

  /**
   * Retorna o emoji correspondente ao item
   *
   * @param item Item, exemplo: "Banana", "Cuscuz"...
   * @param category Categoria do item, exemplo: SOBREMESSA, GUARNIÇÃO...
   * @param index Índice do item na lista
   *
   * Exemplo de estrutura:
   *
   * SOBREMESSA:
   *   0: Banana {emoji}
   *   1: Doce {emoji}
   *
   * GUARNIÇÃO:
   *   0: Cuscuz {emoji}
   *
   * find("Banana", MENU_TYPE_SOBREMSA, 0) => {emoji}
   *
   * @returns Emoji correspondente ou uma string vazia se o emoji não for encontrado.
   */
  public find(item: string, category: MenuCategory, index: number): string {
    /** Nesse código puxar categoria do item, e pegar o emoji com base no indice */
    const emojiCategory = this.emojis[category] ?? [];

    const emojiList = Array.isArray(emojiCategory)
      ? emojiCategory
      : [emojiCategory];

    return emojiList[index] ?? "";
  }
}
