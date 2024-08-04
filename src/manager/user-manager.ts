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
      { hour: 19, minute: 38, tz: "America/Fortaleza" },
      () => {
        this.sendNotification("dinner");
      }
    );
  }

  public static async sendNotification(type: "lunch" | "dinner") {
    if (MenuManager.isMiddleWeek) {
      const menu = await MenuParser.mountMenu(type);
      const users = await this.getUsers();

      users.forEach(async (user: string) => {
        if (await this.canReceiveNotification(user)) {
          if (
            (MenuManager.canReceiveNotificationInPrivateChat() &&
              this.isChatPrivate(user)) ||
            !this.isChatPrivate(user)
          ) {
            WhatsappConnector.socket.sendMessage(user, {
              text: menu,
            })
          }
        }
      });
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
      log.error("Erro ao carregar os usuarios", error);
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
}
