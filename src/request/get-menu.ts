import axios from "axios";
import cheerio, { load as loadHTML, Cheerio, Element } from "cheerio";
import { Menu, ParserCategory } from "../types/types";

export const previewMenuURL =
  "https://www.ufc.br/restaurante/cardapio/5-restaurante-universitario-de-quixada";

export class RequestMenu {
  public static async get(): Promise<Menu[] | null[]> {
    const [lunch, dinner] = await this.request();

    if (!lunch || !dinner) {
      return [null, null];
    }

    return await Promise.all([this.parser(lunch), this.parser(dinner)]);
  }

  public static async request() {
    try {
      const response = await axios.get(previewMenuURL, { timeout: 10_000 });

      const $ = loadHTML(response.data);
      const lunchTable = $("table.refeicao.almoco");
      const dinnerTable = $("table.refeicao.jantar");

      if (lunchTable.length && dinnerTable.length) {
        return [lunchTable, dinnerTable];
      }
    } catch (error) {
      return [null, null];
    }

    return [null, null];
  }

  public static async parser(menu: Cheerio<Element>) {
    const categories: ParserCategory = {
      Principal: [],
      Vegetariano: [],
      Salada: [],
      Guarnição: [],
      Acompanhamento: [],
      Suco: [],
      Sobremesa: [],
    };

    menu.find("tr.item").each((i, element) => {
      const cols = cheerio(element).find("td");

      if (cols.length) {
        const category = cols.eq(0).text().trim();
        const itens: string[] = [];

        cols.slice(1).each((_, col) => {
          cheerio(col)
            .find("span.desc")
            .each((_, desc) => {
              itens.push(cheerio(desc).text().trim());
            });
        });

        categories[category].push(...itens);
      }
    });

    const formatedJson: ParserCategory = {};

    for (const [category, itens] of Object.entries(categories)) {
      formatedJson[category] = [];
      let description: string = "";

      for (const item of itens) {
        if (item.startsWith("(")) {
          description = item.trim();

          if (description) {
            const lastItem: number = formatedJson[category].length - 1;

            formatedJson[category][lastItem] += ` ${description}`;
          }
        } else {
          formatedJson[category].push(item.trim());
        }
      }
    }

    return formatedJson;
  }
}
