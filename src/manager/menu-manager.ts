import { RequestMenu } from "../request/get-menu";
import { ParserMenu } from "../types/types";
import * as fs from "fs";

export class MenuManager {
  public static async initialize() {
    setTimeout(this.loadMenu, 1000 * 60 * 60 * 6);

    this.loadMenu();
  }

  public static async loadMenu() {
    if (MenuManager.isMiddleWeek()) {
      const [lunch, dinner] = await RequestMenu.get();
      const date = MenuManager.formatCurrentDate(MenuManager.getCurrentDate());

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

    return day >= 1 && day <= 5;
  }

  public static async getMenu(): Promise<ParserMenu> {
    return JSON.parse(fs.readFileSync(`./models/menu.json`, "utf-8"));
  }

  public static getCurrentDate() {
    return new Date();
  }

  public static formatCurrentDate(date: Date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  public static canReceiveNotificationInPrivateChat() {
    return false;
  }
}
