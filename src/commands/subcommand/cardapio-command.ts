import { MenuManager } from "../../manager/menu-manager";
import { MenuParser } from "../../parser/menu-parser";
import { CommandData, SubCommand } from "../sub-command";
import { UserAchievement } from "../../user/user-achievement";
import { WAMessage } from "@whiskeysockets/baileys";

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

    public async execute(
        message: WAMessage,
        args: string[],
        data: CommandData
    ): Promise<any> {

        if (data.chatPrivate) {
            UserAchievement.update(data.userId, message);
        }

        const { lunch, dinner, date } = await MenuManager.getMenu();

        if (!lunch || !dinner) {
            await data.socket.sendMessage(data.chatId, {
                text: "Não há cardápio cadastrado para este dia. A publicação poderá ser feita posteriormente ou pode não haver expediente no restaurante universitário neste dia."
            }, { quoted: message });
        }

        return await data.socket.sendMessage(data.chatId, {
            text: await MenuParser.mountMenuMessage(lunch, dinner, date)
        }, { quoted: message });
    }
}
