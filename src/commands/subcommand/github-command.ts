import { WAMessage, WAUrlInfo, generateLinkPreviewIfRequired, getUrlInfo } from "baileys";
import { CommandData, SubCommand } from "../sub-command";
import log from "log-beautify";

export class GithubCommand extends SubCommand {
    private previewData: WAUrlInfo | undefined;

    public getCommandName(): string {
        return "codigo";
    }

    public getCommandLabels(): string[] {
        return ["github", "git", "repo", "repositorio"];
    }

    public getDescription(): string {
        return "Para ver o repositorio do bot";
    }

    public async execute(message: WAMessage, args: string[], data: CommandData): Promise<any> {
        const repoUrl = "https://github.com/OyakXD/CardapioRUBotWP";

        this.previewData ??= await generateLinkPreviewIfRequired(repoUrl,
            getUrlInfo,
            data.socket.logger
        );

        try {

            await data.socket.sendMessage(data.chatId, {
                text: repoUrl,
                // contextInfo: {
                //     externalAdReply: {
                //         title: this.previewData?.title || "CardapioRUBotWP",
                //         body: this.previewData?.description || "Repositório do bot",
                //         mediaType: 1,
                //         thumbnailUrl: this.previewData?.originalThumbnailUrl,
                //         sourceUrl: repoUrl,
                //         renderLargerThumbnail: true,
                //         showAdAttribution: false
                //     }
                // }
            }, { quoted: message });
        } catch (error) {
            log.error_("[COMMAND (GITHUB)] => Erro ao gerar preview, enviando apenas link seco...", error);

            await data.socket.sendMessage(data.chatId, {
                text: repoUrl
            }, { quoted: message });
        }
    }
}
