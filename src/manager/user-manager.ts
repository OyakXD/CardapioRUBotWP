import * as fs from "fs";
import log from "log-beautify";

export class UserManager {
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
}
