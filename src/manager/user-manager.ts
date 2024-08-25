import * as fs from "fs";
import log from "log-beautify";
import { MenuManager } from "./menu-manager";
import schedule from "node-schedule";
import { MenuParser } from "../parser/menu-parser";
import { WhatsappConnector } from "..";

export class UserManager {
  public static async initialize() {
    schedule.scheduleJob(
      { hour: 10, minute: 40, tz: "America/Fortaleza" },
      () => {
        this.sendNotification("lunch");
      }
    );
    schedule.scheduleJob(
      { hour: 16, minute: 30, tz: "America/Fortaleza" },
      () => {
        this.sendNotification("dinner");
      }
    );
    schedule.scheduleJob(
      { hour: 20, minute: 0, tz: "America/Fortaleza" },
      () => {
        this.rememberSchedule();
      }
    );
  }

  public static async sendNotification(type: "lunch" | "dinner") {
    if (MenuManager.isMiddleWeek()) {
      const [menu, users] = await Promise.all([
        MenuParser.mountMenu(type),
        this.getUsers(),
      ]);

      if (!menu) {
        return;
      }

      for (const user of users as string[]) {
        if (await this.canReceiveNotification(user)) {
          if (
            (MenuManager.canReceiveNotificationInPrivateChat() &&
              this.isChatPrivate(user)) ||
            !this.isChatPrivate(user)
          ) {
            await WhatsappConnector.sendMessage(user, {
              text: menu,
            });
          }
        }
      }
    }
  }

  public static async canReceiveNotification(userId: string) {
    try {
      return (await this.getUsers()).includes(userId);
    } catch (error) {
      return false;
    }
  }

  public static async removeReceiveNotification(userId: string) {
    try {
      await this.saveUsers(
        (await this.getUsers()).filter((user: string) => user !== userId)
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  public static async addReceiveNotification(userId: string) {
    try {
      await this.saveUsers([...(await this.getUsers()), userId]);
      return true;
    } catch (error) {
      return false;
    }
  }

  public static async getUsers() {
    try {
      if (fs.existsSync("models/users.json")) {
        return JSON.parse(
          await fs.promises.readFile("models/users.json", "utf-8")
        );
      } else {
        return [];
      }
    } catch (error) {
      log.error_("Erro ao carregar os usuarios", error);
      return [];
    }
  }

  public static async saveUsers(users: string[]) {
    await fs.promises.writeFile(
      "models/users.json",
      JSON.stringify(users, null, 2),
      "utf-8"
    );
  }

  public static isChatPrivate(userJid: string) {
    return userJid.includes("@s.whatsapp.net")!;
  }

  public static async rememberSchedule() {
    let currentDay = MenuManager.getCurrentDate().getDay();

    if (currentDay === 0 || currentDay === 3) {
      const users = await this.getUsers();

      for (const user of users as string[]) {
        if (this.canReceiveNotification(user)) {
          if (
            (MenuManager.canReceiveNotificationInPrivateChat() &&
              this.isChatPrivate(user)) ||
            !this.isChatPrivate(user)
          ) {
            WhatsappConnector.sendMessage(user, {
              image: fs.readFileSync("images/agendamento.jpg"),
              caption:
                "Lembre de agendar seu almoço e jantar! 😋\nhttps://si3.ufc.br/sigaa",
            });
          }
        }
      }
    }
  }
}
