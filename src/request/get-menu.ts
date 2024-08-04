import axios from "axios";
import cheerio, { Cheerio, Element } from "cheerio";

export const previewMenuURL =
  "https://www.ufc.br/restaurante/cardapio/1-restaurante-universitario-de-fortaleza/2024-08-05";

export class RequestMenu {
  private menuURL: string = previewMenuURL;

  public async get() {
    const [lunch, dinner] = await this.request();

    if (!lunch || !dinner) {
      return [null, null];
    }

    return await Promise.all([this.parser(lunch), this.parser(dinner)]);
  }

  public async request() {
    try {
      const response = await axios.get(this.menuURL);

      if (response.status !== 200) {
        return null;
      }

      const $ = cheerio.load(response.data);
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

  public async parser(menu: Cheerio<Element>) {
    const categories: { [key: string]: string[] } = {
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

    const formatedJson: { [key: string]: string[] } = {};

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
