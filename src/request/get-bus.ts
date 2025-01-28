import axios from "axios";
import { load as loadHTML } from "cheerio";
import { ParserBus } from "../types/types";

export const previewMenuURL =
  "https://www.quixada.ufc.br/itinerario-dos-onibus/";

export class RequestBus {
  public static async get(): Promise<ParserBus | null> {
    try {
      const response = await axios.get(previewMenuURL, { timeout: 10_000 });

      const $ = loadHTML(response.data);

      const updatedText = $('p:contains("Atualizado em")').text().trim();
      const stopsText = $('h4:contains("PARADAS")').text().trim();
      const routeText = $('span:contains("Rota de ida")')
        .parent()
        .text()
        .trim();

      const returnRouteText = $('span:contains("Rota de retorno")')
        .parent()
        .text()
        .trim();

      const stopsDetails = $('span:contains("Rota de ida")')
        .parent()
        .next("ol")
        .children("li")
        .map((i, el) => $(el).text().trim())
        .get()
        .join("\n");

        const returnStopsDetails = $('span:contains("Rota de retorno")')
          .parent()
          .parent()
          .next("ol")
          .children("li")
          .map((i, el) => $(el).text().trim())
          .get()
          .join("\n");

      const imageUrl = $("img.wp-image-23084").attr("src").trim();
      const imageWith = Number(
        $("img.wp-image-23084").attr("width").trim() || 2250
      );
      const imageHeight = Number(
        $("img.wp-image-23084").attr("height").trim() || 2250
      );

      return {
        updatedText,
        stopsText,
        routeText,
        stopsDetails,
        returnRouteText,
        returnStopsDetails,
        image: {
          url: imageUrl,
          width: imageWith,
          height: imageHeight,
        },
      };
    } catch (error) {
      return null;
    }
  }
}
