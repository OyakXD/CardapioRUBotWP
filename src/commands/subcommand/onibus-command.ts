import { MenuManager } from "../../manager/menu-manager";
import { MenuParser } from "../../parser/menu-parser";
import { RequestBus } from "../../request/get-bus";
import { ReplyMessageFunction, SubCommand } from "../sub-command";
import fs from "fs";

export class OnibusCommand extends SubCommand {
  public getCommandName(): string {
    return "onibus";
  }

  public getCommandLabels(): string[] {
    return ["horarios", "ônibus"];
  }

  public getDescription(): string {
    return "Veja os horários do onibus";
  }

  public async execute(reply: ReplyMessageFunction): Promise<any> {
    const scrapper = new RequestBus();
    const { updatedText, stopsText, routeText, stopsDetails } =
      await scrapper.getBusScheduleInfoIda();
    const { returnRouteText, returnStopsDetails } =
      await scrapper.getBusScheduleInfoRetorno();

    const formattedStopsIda = stopsDetails
      .split("\n")
      .map((stop, index) => `${index + 1}. ${stop}`)
      .join("\n");

    const formattedStopsRetorno = returnStopsDetails
      .split("\n")
      .map((stop, index) => `${index + 1}. ${stop}`)
      .join("\n");

    await reply({
      image: fs.readFileSync("images/bus.jpg"),
      height: 820,
      width: 828,
      caption:
        updatedText +
        "\n\n" +
        stopsText +
        "\n\n" +
        routeText +
        "\n\n" +
        formattedStopsIda +
        "\n\n" +
        returnRouteText +
        "\n\n" +
        formattedStopsRetorno +
        "\n\n" +
        "Confira as imagens dentro do site: https://www.quixada.ufc.br/itinerario-dos-onibus/",
    });
  }
}
