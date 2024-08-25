import { RequestMenu } from "../request/get-menu";
import { ParserMenu } from "../types/types";
import * as fs from "fs";
import schedule from "node-schedule";

export class MenuManager {
  public static async initialize() {
    if (!fs.existsSync(`./models`)) {
      fs.mkdirSync(`./models`);
    }
    schedule.scheduleJob({ hour: 4, minute: 0, tz: "America/Fortaleza" }, () =>
      this.loadMenu()
    );
  }

  public static async loadMenu() {
    const date = MenuManager.formatCurrentDate(MenuManager.getCurrentDate());
    const isMiddleWeek = MenuManager.isMiddleWeek();
    const [lunch, dinner] = isMiddleWeek
      ? await RequestMenu.get()
      : [null, null];

    fs.writeFileSync(
      `./models/menu.json`,
      JSON.stringify({ lunch, dinner, date }, null, 2)
    );
  }

  public static isMiddleWeek() {
    let day = this.getCurrentDate().getDay();

    return day >= 1 && day <= 5;
  }

  public static async getMenu(): Promise<ParserMenu> {
    try {
      return JSON.parse(fs.readFileSync(`./models/menu.json`, "utf-8"));
    } catch (error) {
      return {
        lunch: null,
        dinner: null,
        date: "00/00/0000",
      };
    }
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
    return true;
  }
}
