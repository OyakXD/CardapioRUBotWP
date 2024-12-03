import { Message } from "whatsapp-web.js";
import { MenuManager } from "../../manager/menu-manager";
import { MenuParser } from "../../parser/menu-parser";
import { SubCommand } from "../sub-command";

export class CardapioCommand extends SubCommand {
  public getCommandName(): string {
    return "cardapio";
  }

  public getCommandLabels(): string[] {
    return ["menu", "cardápio"];
  }

  public getDescription(): string {
    return "Veja o cardápio do dia";
  }

  public async execute(message: Message): Promise<any> {
    const { lunch, dinner, date } = await MenuManager.getMenu();

    if (!lunch || !dinner) {
      return await message.reply("Não há cardápio cadastrado para este dia. A publicação poderá ser feita posteriormente ou pode não haver expediente no restaurante universitário neste dia.");
    }

    return await message.reply(await MenuParser.mountMenuMessage(lunch, dinner, date));
  }
}
