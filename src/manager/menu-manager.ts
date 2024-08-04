import { RequestMenu } from "../request/get-menu";
import * as fs from "fs";

export class MenuManager {
  public static async initialize() {
    setTimeout(this.loadMenu, 1000 * 60 * 6);

    this.loadMenu();
  }

  public static async loadMenu() {
    if (this.isMiddleWeek() || true) {
      const [lunch, dinner] = await new RequestMenu().get();
      const date = this.getCurrentDate().toLocaleDateString("pt-BR");

      if (!fs.existsSync(`./models`)) {
        fs.mkdirSync(`./models`);
      }

      fs.writeFileSync(
        `./models/menu.json`,
        JSON.stringify({ lunch, dinner, date }, null, 2)
      );
    }
  }

  public static isMiddleWeek() {
    let day = this.getCurrentDate().getDay();

    return day > 1 && day < 5;
  }

  public static getCurrentDate() {
    return new Date();
  }

  public static async getMenu() {
    return JSON.parse(fs.readFileSync(`./models/menu.json`, "utf-8"));
  }
}
