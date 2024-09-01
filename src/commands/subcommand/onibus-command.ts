import { BusManager } from "../../manager/bus-manager";
import { ReplyMessageFunction, SubCommand } from "../sub-command";
import fs from "fs";

export class OnibusCommand extends SubCommand {
  public getCommandName(): string {
    return "onibus";
  }

  public getCommandLabels(): string[] {
    return ["bus", "horarios", "ônibus"];
  }

  public getDescription(): string {
    return "Veja os horários do ônibus";
  }

  public async execute(reply: ReplyMessageFunction): Promise<any> {
    const {
      updatedText,
      stopsText,
      routeText,
      stopsDetails,
      returnRouteText,
      returnStopsDetails,
      image,
    } = await BusManager.getBus();

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
      height: image.height ?? 2250,
      width: image.width ?? 2250,
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
