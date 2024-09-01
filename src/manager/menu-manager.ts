import { RequestMenu } from "../request/get-menu";
import { ParserMenu } from "../types/types";
import { scheduleJob } from "node-schedule";
import * as fs from "fs";
import Utils from "../utils/utils";

export class MenuManager {
  private static cachedMenu: ParserMenu | null = null;

  public static async initialize() {
    if (!fs.existsSync(`./models`)) {
      fs.mkdirSync(`./models`);
    }

    scheduleJob({ hour: 4, minute: 0, tz: "America/Fortaleza" }, () =>
      this.createMenu()
    );

    this.createMenu();
  }

  public static async createMenu() {
    const date = Utils.formatCurrentDate(Utils.getCurrentDate());
    const [lunch, dinner] = Utils.isMiddleWeek()
      ? await RequestMenu.get()
      : [null, null];

    fs.writeFileSync(
      `./models/menu.json`,
      JSON.stringify({ lunch, dinner, date }, null, 2)
    );

    this.cachedMenu = { lunch, dinner, date };
  }

  public static async getMenu(): Promise<ParserMenu> {
    try {
      return (this.cachedMenu ??= JSON.parse(
        fs.readFileSync(`./models/menu.json`, "utf-8")
      ));
    } catch (error) {
      return {
        lunch: null,
        dinner: null,
        date: "00/00/0000",
      };
    }
  }
}
