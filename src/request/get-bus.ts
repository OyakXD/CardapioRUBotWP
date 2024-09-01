import axios, { AxiosResponse } from "axios";
import cheerio, { load as loadHTML } from "cheerio";

export class RequestBus {
  private url: string;

  constructor() {
    this.url = "https://www.quixada.ufc.br/itinerario-dos-onibus/";
  }

  public async getBusScheduleInfoIda(): Promise<{
    updatedText: string;
    stopsText: string;
    routeText: string;
    stopsDetails: string;
  }> {
    try {
      const response: AxiosResponse<string> = await axios.get(this.url);
      const html: string = response.data;

      const $ = loadHTML(html);

      const updatedText = $('p:contains("Atualizado em")').text().trim();
      const stopsText = $('h4:contains("PARADAS")').text().trim();
      const routeText = $('span:contains("Rota de ida")')
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

      return { updatedText, stopsText, routeText, stopsDetails };
    } catch (error) {
      console.error(error);
    }
  }

  public async getBusScheduleInfoRetorno(): Promise<{
    returnRouteText: string;
    returnStopsDetails: string;
  }> {
    try {
      const response: AxiosResponse<string> = await axios.get(this.url);
      const html: string = response.data;

      const $ = loadHTML(html);

      // Extrair o texto da "ALTERAÇÃO NO PONTO DE EMBARQUE"
      const returnRouteText = $('span:contains("Rota de retorno")')
        .parent()
        .text()
        .trim();

      // Extrair os detalhes das paradas apenas para "Rota de retorno"
      const returnStopsDetails = $(
        'span:contains("ALTERAÇÃO NO PONTO DE EMBARQUE")'
      )
        .parent()
        .parent() // Sobe para o <li> pai
        .nextAll("li") // Seleciona todos os <li> seguintes que são paradas de retorno
        .map((i, el) => $(el).text().trim())
        .get()
        .join("\n");

      return { returnRouteText, returnStopsDetails };
    } catch (error) {
      console.error(
        "Erro ao realizar o web scraping para rota de retorno:",
        error
      );
      throw new Error(
        "Erro ao obter as informações do site para rota de retorno."
      );
    }
  }
}
