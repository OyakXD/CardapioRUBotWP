import axios from "axios";
import { RequestBus } from "../request/get-bus";
import { ParserBus } from "../types/types";
import log from "log-beautify";
import * as fs from "fs";

export class BusManager {
  private static cachedBus: ParserBus | null = null;

  public static async initialize() {
    if (!fs.existsSync(`./models`)) {
      fs.mkdirSync(`./models`);
    }

    if (!fs.existsSync(`./images`)) {
      fs.mkdirSync(`./images`);
    }

    this.createBus();
  }

  public static async createBus() {
    const busResponse = await RequestBus.get();

    if (busResponse.image?.url) {
      try {
        const response = await axios.get(busResponse.image?.url, {
          responseType: "arraybuffer",
        });

        fs.writeFileSync("./images/bus.jpg", response.data);
      } catch (error) {
        log.error_(
          "[SOCKET (ERROR)] Não foi possível carregar a imagem do horário de ônibus",
          error
        );
      }
    } else {
      log.error_(
        "[SOCKET (ERROR)] Não foi possível carregar a imagem do horário de ônibus"
      );
    }

    fs.writeFileSync(`./models/bus.json`, JSON.stringify(busResponse, null, 2));

    this.cachedBus = busResponse;
  }

  public static async getBus(): Promise<ParserBus | null> {
    try {
      return (this.cachedBus ??= JSON.parse(
        fs.readFileSync(`./models/bus.json`, "utf-8")
      ));
    } catch (error) {
      return null;
    }
  }
}
