import log from "log-beautify";
import GroupManager from "./group/group-manager";
import { scheduleJob } from "node-schedule";
import { MenuParser } from "../parser/menu-parser";
import { User } from "@prisma/client";
import { WhatsappConnector } from "..";
import { MessageMedia } from "whatsapp-web.js";
import Utils from "../utils/utils";

export class UserManager {
  public static isSendingMenu = false;
  public static isSendingReminder = false;

  public static async initialize() {
    scheduleJob({ hour: 10, minute: 40, tz: "America/Fortaleza" }, () =>
      this.sendNotification("lunch")
    );
    scheduleJob({ hour: 16, minute: 30, tz: "America/Fortaleza" }, () =>
      this.sendNotification("dinner")
    );
    scheduleJob({ hour: 20, minute: 0, tz: "America/Fortaleza" }, () =>
      this.rememberSchedule()
    );
  }

  public static async sendNotification(type: "lunch" | "dinner") {
    if (UserManager.isSendingMenu) {
      return;
    }

    if (Utils.isMiddleWeek()) {
      const [menu, users] = await Promise.all([
        MenuParser.mountMenu(type),
        this.getUsers(),
      ]);

      UserManager.isSendingMenu = true;

      for (const user of users) {
        if (await this.canReceiveNotification(user)) {
          if (
            (this.canReceiveNotificationInPrivateChat() &&
              this.isChatPrivate(user.jid)) ||
            !this.isChatPrivate(user.jid)
          ) {
            await WhatsappConnector.socket.sendMessage(user.jid, menu);
          }
        }
      }

      UserManager.isSendingMenu = false;
    }
  }

  public static async canReceiveNotification(
    userJid: string | User
  ): Promise<boolean> {
    try {
      return (await this.getUser(userJid))?.notification ?? false;
    } catch (error) {
      return false;
    }
  }

  public static async removeReceiveNotification(userJid: string | User) {
    return await this.updateUserNotification(userJid, false);
  }

  public static async addReceiveNotification(userJid: string | User) {
    return await this.updateUserNotification(userJid, true);
  }

  public static async updateUserNotification(
    userJid: string | User,
    value: boolean
  ) {
    try {
      userJid = typeof userJid !== "string" ? userJid.jid : userJid;

      await WhatsappConnector.getPrisma().user.upsert({
        where: {
          jid: userJid,
        },
        update: {
          notification: value,
        },
        create: {
          jid: userJid,
          notification: value,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  public static async getUsers(): Promise<User[]> {
    try {
      return await WhatsappConnector.getPrisma().user.findMany();
    } catch (error) {
      log.error_("Erro ao carregar os usuarios", error);
      return [];
    }
  }

  public static async getUser(userJid: string | User): Promise<User | null> {
    try {
      if (typeof userJid !== "string") {
        return userJid;
      }

      return await WhatsappConnector.getPrisma().user.findUnique({
        where: {
          jid: userJid,
        },
      });
    } catch (error) {
      log.error_("Erro ao carregar o usuario", error);
      return null;
    }
  }

  public static isChatPrivate(userJid: string) {
    return !userJid.includes("@g.us")!;
  }

  public static canReceiveNotificationInPrivateChat() {
    return true;
  }

  public static async rememberSchedule() {
    if (UserManager.isSendingReminder) {
      return;
    }

    const currentDay = Utils.getCurrentDate().getDay();

    if (currentDay === 0) {
      const receiveNotificationPrivate =
        this.canReceiveNotificationInPrivateChat();
      const users = await this.getUsers();

      const messageMedia = MessageMedia.fromFilePath("images/agendamento.jpg");
      UserManager.isSendingReminder = true;

      for (const user of users) {
        if (!(await this.canReceiveNotification(user))) {
          continue;
        }

        const isGroup = !this.isChatPrivate(user.jid);

        if ((receiveNotificationPrivate && !isGroup) || isGroup) {
          await WhatsappConnector.socket.sendMessage(user.jid, messageMedia, {
            caption:
              "Lembre de agendar seu almoço e jantar! 😋\nhttps://si3.ufc.br/sigaa",
            // ...(isGroup && {
            //   mentions:
            //     GroupManager.getGroupMetadata(user.jid)?.participants.map(
            //       (member) => member.id
            //     ) ?? [],
            // })
          });
        }
      }

      UserManager.isSendingReminder = false;
    }
  }
}
