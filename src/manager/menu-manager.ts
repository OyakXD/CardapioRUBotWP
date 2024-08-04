import { RequestMenu } from "../request/get-menu";
import * as fs from "fs";

export class MenuManager {
  public static async initialize() {
    setTimeout(this.loadMenu, 1000 * 60 * 60 * 6);

    this.loadMenu();
  }

  public static async loadMenu() {
    if (MenuManager.isMiddleWeek() || true) {
      const [lunch, dinner] = await new RequestMenu().get();
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

    return day > 1 && day < 5;
  }

  public static async getMenu() {
    return JSON.parse(fs.readFileSync(`./models/menu.json`, "utf-8"));
  }

  public static getCurrentDate() {
    const fortalezaTime = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Fortaleza",
    });

    return new Date(fortalezaTime);
  }

  public static formatCurrentDate(date: Date) {
    const day = String(date.getMonth() + 1).padStart(2, "0");
    const month = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  public static canReceiveNotificationInPrivateChat() {
    return false;
  }
}
