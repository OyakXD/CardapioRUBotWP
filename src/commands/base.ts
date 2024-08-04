import { proto, WASocket } from "baileys";
import { MenuManager } from "../manager/menu-manager";
import fs from "fs";

export const prefix = "!";

export class commandHandler {
  private prefix: string;
  private socket: WASocket;
  private reminderUsers: Set<String>;
  private reminderInterval: NodeJS.Timeout;


  constructor(prefix: string) {
    this.prefix = prefix || "!";
    this.reminderUsers = this.loadReminderUsers();
    this.startReminders();
  }

  private loadReminderUsers(): Set<string> {
      try{
        const data = fs.readFileSync("users.json", "utf-8");
        const users = JSON.parse(data);
        return new Set(users);
      } catch (error) {
        console.error("Erro ao carregar os usuarios", error);
        return new Set();
      }
  }

  private saveReminderUsers(){
    try {
      const users = Array.from(this.reminderUsers);
      fs.writeFileSync("users.json", JSON.stringify(users, null, 2), "utf-8");
    } catch (error) {
      console.error("Erro ao salvar os usuarios", error);
    }
  }

  private startReminders(): void {
    const intervalMs = 3600000;

    this.reminderInterval = setInterval(() => {
      this.sendReminders();
    }, intervalMs);
  }

  private async sendReminders(): Promise<void> {
    const reminderMessage = "Não se esqueça de agender o almoçar e jantar!";
    for(const userId of this.reminderUsers){
      await this.socket.sendMessage(userId, {text: reminderMessage});
    }
  }

  public async handle({ message }: proto.IWebMessageInfo) {
    const body =
      message.extendedTextMessage?.text || message.conversation || "";

    if (body.startsWith(this.prefix)) {
      const args = body.slice(this.prefix.length).trim().split(" ");
      const command = args.shift()?.toLowerCase();

      switch (command) {
        case "amor":
          return "Você é muito especial para mim!";
        case "cardapio":
        case "Cardápio":
          const { lunch, dinner, date } = await MenuManager.getMenu();

          const [lunchMessage, dinnerMessage] = await Promise.all([
            await this.getMenuMessage(lunch),
            await this.getMenuMessage(dinner),
          ]);

          const currentHour = MenuManager.getCurrentDate().getHours();
          const periodMessage =
            currentHour < 12
              ? "Bom dia"
              : currentHour < 18
              ? "Boa tarde"
              : "Boa noite";

          const message = [
            `🍽 ${periodMessage} alunos! No cardápio de hoje (${date}) teremos: 🕛`,
            ``,
            `*Almoço:*`,
            "-".repeat(40),
            lunchMessage,
            ``,
            `*Jantar:*`,
            "-".repeat(40),
            dinnerMessage,
          ];

          return message.join("\n").trim();
          case "notificacao":
          const userId = message.keys.remoteJid!;
          this.reminderUsers.add(userId);
          this.saveReminderUsers();
          return "Você será lembrado de agendar o almoço e jantar todos os dias!";
        default:
          return "Comando não encontrado";
      }
    }

    return null;
  }

  public async getMenuMessage(menu: { [key: string]: string[] }) {
    let message = "";

    const emojis = {
      Principal: ["🍛", "🍲"],
      Vegetariano: "🌱",
      Acompanhamento: ["🍚", "🍚", "🫘"],
      Salada: "🥗",
      Guarnição: "🍟",
      Sobremesa: ["🍈", "🍬"],
      Suco: "🍹",
    };

    for (const [category, itens] of Object.entries(menu)) {
      message += `\n${category}: \n`;

      const emojiCategory = emojis[category] || "";
      const emojiList = Array.isArray(emojiCategory)
        ? emojiCategory
        : [emojiCategory];

      itens.forEach((item, index) => {
        const emoji = emojiList[index]! || "";
        const itemMessage = `${item} ${emoji}`.trim();

        message += `- ${itemMessage}\n`;
      });
    }
    return message.trim();
  }
}
