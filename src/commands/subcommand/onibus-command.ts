
import { WAMessage } from "baileys";
import { BusManager } from "../../manager/bus-manager";
import { CommandData, SubCommand } from "../sub-command";
import fs from "fs";
import log from "log-beautify";
import { previewMenuURL } from "../../request/get-bus";

export class OnibusCommand extends SubCommand {
    public getCommandName(): string {
        return "onibus";
    }

    public getCommandLabels(): string[] {
        return ["bus", "horarios", "ônibus"];
    }

    public getDescription(): string {
        return "Veja os horários do ônibus";
    }

    public async execute(message: WAMessage, args: string[], data: CommandData): Promise<any> {
        const {
            updatedText,
            stopsText,
            routeText,
            stopsDetails,
            returnRouteText,
            returnStopsDetails,
            image,
        } = await BusManager.getBus();

        const formattedStopsIda = stopsDetails
            .split("\n")
            .map((stop, index) => `${index + 1}. ${stop}`)
            .join("\n");

        const formattedStopsRetorno = returnStopsDetails
            .split("\n")
            .map((stop, index) => `${index + 1}. ${stop}`)
            .join("\n");

        const captionText = [
            updatedText,
            stopsText,
            routeText,
            formattedStopsIda,
            returnRouteText,
            formattedStopsRetorno,
            `Confira as imagens dentro do site: ${previewMenuURL}`
        ].join("\n\n");

        const imagePath = "images/bus.jpg";

        if (fs.existsSync(imagePath)) {
            await data.socket.sendMessage(data.chatId, {
                image: fs.readFileSync(imagePath),
                caption: captionText
            }, { quoted: message });
        } else {
            log.warn_(`[COMMAND (ONIBUS)] => Imagem não encontrada em ${imagePath}. Enviando apenas texto.`);
            await data.socket.sendMessage(data.chatId, {
                text: captionText
            }, { quoted: message });
        }
    }
}
