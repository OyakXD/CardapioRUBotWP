import { WAMessage } from "baileys";
import { CommandData, SubCommand } from "../sub-command";
import UsernameRegex from "github-username-regex-js";

export class RoastCommand extends SubCommand {
    public getCommandName(): string {
        return "torrar";
    }

    public getCommandLabels(): string[] {
        return ["roast"];
    }

    public getDescription(): string {
        return "Descreva o perfil do github";
    }

    public getArguments(): string[] {
        return ["username"];
    }

    public async execute(
        message: WAMessage,
        args: string[],
        data: CommandData
    ): Promise<any> {
        const username = args.join(" ");

        if (UsernameRegex.test(username)) {
            const response = await fetch(
                `https://joaosvc-roast-api.vercel.app/search?username=${encodeURI(
                    username
                )}`
            );

            if (response.ok) {
                const { roast } = await response.json();

                if (roast) {

                    return await data.socket.sendMessage(data.chatId, {
                        text: roast
                    }, { quoted: message });
                }
            } else if (response.status === 500) {
                return await data.socket.sendMessage(data.chatId, {
                    text: "Ops! Parece que nossa torrefadora atingiu o limite. 😢"
                }, { quoted: message });
            }

            await data.socket.sendMessage(data.chatId, {
                text: "Ops! Parece que nossa torrefadora está em pausa para o café. Tente novamente mais tarde! 😢"
            }, { quoted: message });
        } else {
            await data.socket.sendMessage(data.chatId, {
                text: "Username inválido, por favor, insira um username válido. 😢"
            }, { quoted: message });
        }
    }
}
