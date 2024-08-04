import { proto } from "baileys";
import { MenuManager } from "../manager/menu-manager";

export const prefix = "!";

export class commandHandler {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix || "!";
  }

  public async handle({ message }: proto.IWebMessageInfo) {
    const body = message.extendedTextMessage?.text || "";

    if (body.startsWith(this.prefix)) {
      const args = body.slice(this.prefix.length).trim().split(" ");
      const command = args.shift()?.toLowerCase();

      switch (command) {
        case "amor":
          return "Você é muito especial para mim!";
        case "cardapio":
        case "Cardápio":
        const { lunch, dinner } = await MenuManager.getMenu(); 
        return "Almoço: \n" + await this.getMenuMessage(lunch) + "Jantar: \n" + await this.getMenuMessage(dinner);
        default:
          return "Comando não encontrado";
      }
    }

    return null;
  }

  public async getMenuMessage(menu: { [key: string]: string[] }){
    let message = "";

    for(const[category, itens] of Object.entries(menu)){
      message += `${category}: \n`;

      itens.forEach((item) => {
        message += `- ${item}\n`;
      });

      message += "\n";
    }
    return message;
  }
}
