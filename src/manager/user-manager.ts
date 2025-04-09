import log from "log-beautify";
import GroupManager from "./group/group-manager";
import { scheduleJob } from "node-schedule";
import { MenuParser } from "../parser/menu-parser";
import { User, Notification } from "@prisma/client";
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
      const [menu, chatsNotifications] = await Promise.all([
        MenuParser.mountMenu(type),
        this.getChatsNotifications(),
      ]);

      UserManager.isSendingMenu = true;

      for (const chatNotification of chatsNotifications) {
        if (chatNotification.enabled) {
          if (
            (this.canReceiveNotificationInPrivateChat() &&
              this.isChatPrivate(chatNotification.chatJid)) ||
            !this.isChatPrivate(chatNotification.chatJid)
          ) {
            await WhatsappConnector.socket.sendMessage(chatNotification.chatJid, menu);
          }
        }
      }

      UserManager.isSendingMenu = false;
    }
  }

  public static async canReceiveNotification(
    chatJid: string
  ): Promise<boolean> {
    try {
      const notification = await WhatsappConnector.getPrisma().notification.findUnique({
        where: {
          chatJid: chatJid,
        },
      });
      
      return notification?.enabled ?? false;
    } catch (error) {
      return false;
    }
  }

  public static async removeReceiveNotification(chatJid: string) {
    return await this.updateChatNotification(chatJid, false);
  }

  public static async addReceiveNotification(chatJid: string) {
    return await this.updateChatNotification(chatJid, true);
  }

  public static async updateChatNotification(
    chatJid: string,
    value: boolean
  ) {
    try {
      await WhatsappConnector.getPrisma().notification.upsert({
        where: {
          chatJid: chatJid,
        },
        update: {
          enabled: value,
        },
        create: {
          chatJid: chatJid,
          enabled: value,
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

  public static async getChatsNotifications(): Promise<Notification[]> {
    try {
      return await WhatsappConnector.getPrisma().notification.findMany({
        where: {
          enabled: true,
        },
      });
    } catch (error) {
      log.error_("Erro ao carregar as notificações", error);
      return [];
    }
  }

  public static async getUser(phone: string | User): Promise<User | null> {
    try {
      if (typeof phone !== "string") {
        return phone;
      }

      return await WhatsappConnector.getPrisma().user.findUnique({
        where: {
          phone: phone,
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

  public static convertPhoneToJid(phone: string) {
    if (phone.endsWith('@s.whatsapp.net')) {
      return phone;
    }

    if (phone.endsWith('@c.us')) {
      return phone.replace('c.us', 's.whatsapp.net');
    }
    
    return `${phone}@s.whatsapp.net`;
  }

  public static convertJidToPhone(jid: string) {
    return jid.split("@")[0] ?? jid;
  }

  public static canReceiveNotificationInPrivateChat() {
    return false;
  }

  public static async rememberSchedule() {
    if (UserManager.isSendingReminder) {
      return;
    }

    const currentDay = Utils.getCurrentDate().getDay();

    if (currentDay === 0) {
      const receiveNotificationPrivate =
        this.canReceiveNotificationInPrivateChat();
      const chatsNotifications = await this.getChatsNotifications();

      const messageMedia = MessageMedia.fromFilePath("images/agendamento.jpg");
      UserManager.isSendingReminder = true;

      for (const chatNotification of chatsNotifications) {
        const isGroup = !this.isChatPrivate(chatNotification.chatJid);

        if ((receiveNotificationPrivate && !isGroup) || isGroup) {
          await WhatsappConnector.socket.sendMessage(chatNotification.chatJid, messageMedia, {
            caption:
              "Lembre de agendar seu almoço e jantar! 😋\nhttps://si3.ufc.br/sigaa",
            ...(isGroup && {
              mentions:
                GroupManager.getGroupMetadata(chatNotification.chatJid)?.participants.map(
                  (member) => member.id
                ) ?? [],
            })
          });
        }
      }

      UserManager.isSendingReminder = false;
    }
  }
}
