import { CommandHandler } from "./commands/command-base";
import { PrismaClient } from "@prisma/client";
import { MenuManager } from "./manager/menu-manager";
import { BusManager } from "./manager/bus-manager";
import { UserManager } from "./manager/user-manager";
import { Message, MessageContent } from "./services/types";
import log from "log-beautify";

type WHATSAPP_LIB = "whatsapp-js" | "baileys";

export const WhatsappConnector = new (class WhatsappInstance {
  public commandHandler: CommandHandler;
  public prisma: PrismaClient;
  public whatsappLib: WHATSAPP_LIB = "baileys";

  constructor() {
    this.commandHandler = new CommandHandler();
    this.prisma = new PrismaClient();

    Promise.all([
      MenuManager.initialize(),
      BusManager.initialize(),
      UserManager.initialize(),
    ]);
  }

  public async connectToWhatsapp() {
    if (this.whatsappLib === "whatsapp-js") {
      // Initialize whatsapp-js
    } else if (this.whatsappLib === "baileys") {
      // Initialize baileys
    }
  }

  public async sendMessage(chatId: string, content: any, options?: any) {
    if (this.whatsappLib === "whatsapp-js") {
      
    } else if (this.whatsappLib === "baileys") {
      // Initialize baileys
    }
  }

  public getPrisma() {
    return this.prisma;
  }
})();

WhatsappConnector.connectToWhatsapp();