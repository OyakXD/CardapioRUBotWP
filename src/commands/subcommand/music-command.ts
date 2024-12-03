import { CommandData, SubCommand } from "../sub-command";
import { YoutubeSearchResult } from "../../types/types";
import Utils from "../../utils/utils";
import DDown from "../../request/ddown";
import { Message } from "whatsapp-web.js";

export class MusicCommand extends SubCommand {
  private musicRunningCount = 0;
  private maxMusicRunningCount = 3;

  public getCommandName(): string {
    return "music";
  }

  public getCommandLabels(): string[] {
    return ["musica"];
  }

  public getDescription(): string {
    return "Baixe suas músicas favoritas";
  }

  public getArguments(): string[] {
    return ["url"];
  }

  public async execute(
    message: Message,
    args: string[],
    data: CommandData
  ): Promise<any> {
    const { chatPrivate } = data;

    if (!chatPrivate) {
      return await message.reply("Esse comando só pode ser executado em uma conversa privada! 😅");
    }

    const link = args.join(" ");

    if (!Utils.validateUrl(link)) {
      return await message.reply("Link inválido! 😢");
    }

    let songsFound = 0;

    if (this.musicRunningCount >= this.maxMusicRunningCount) {
      return await message.reply("Limite de download de músicas ao mesmo tempo atingido, aguarde a fila esvaziar! 😢");
    }
    this.musicRunningCount++;

    const musicTask = setTimeout(() => this.musicRunningCount--, 60_000 * 3);

    const clearMusicTask = () => {
      clearTimeout(musicTask);
      this.musicRunningCount--;
    };

    const replyKey: Message = await message.reply("Coletando informações do link aguarde...");

    const metadata: YoutubeSearchResult[] = await DDown.search(
      link,
      async (data: YoutubeSearchResult[]) => {
        songsFound += data?.length ?? 0;

        if (replyKey) {
          await message.edit(`Músicas encontradas: ${songsFound}`);
        }
      }
    );

    /* o end-point retorna nullo caso não tenha informações. */
    if (!metadata || metadata.length === 0) {
      clearMusicTask();

      return await message.edit("Erro ao coletar informações do link! 😢");
    }

    await message.edit("Gerando dados da música, aguarde...");

    const songs = metadata.filter((data) => data && data.success && data.song);

    /* Estrutura para gerenciar as mensagem de progresso */
    const progressData = {
      message: [] as string[],
      queries: {} as { [_: string]: { progress: number; text: string } },
      count: 0,
      downloaded: 0,
      total: songs.length,
    };

    const progressTask = setInterval(() => {
      const percentage = Math.floor(
        (progressData.downloaded / progressData.total) * 100
      );

      let totalQueriesProgress = 0;
      let queryCount = 0;

      for (const status of Object.values(progressData.queries)) {
        totalQueriesProgress += status.progress;
        queryCount++;
      }

      const averageQueryProgress =
        queryCount > 0 ? totalQueriesProgress / queryCount : 0;

      if (progressData.count === 0) {
        progressData.message = ["Aguardando serviço de download..."];
      } else {
        progressData.message = [
          `Você pode ver o progresso de download das músicas abaixo:`,
          ``,
          `Progresso Geral: ${progressData.downloaded}/${progressData.total} (${percentage}%)`,
          `Progresso Médio: ${averageQueryProgress}`,
        ];
      }

      message.edit(progressData.message.join("\n"));
    }, 1_000);

    const response = (
      await Promise.all(
        songs.map(async ({ song }) => {
          return {
            ...(await DDown.get(song.url, (progress) => {
              const text = [
                `*Titulo*: \`${String(song.name).toLocaleUpperCase()}\``,
                `*Progresso*: \`${progress.progress / 10}%\``,
                `*Status*: \`${progress.text}\``,
              ]
                .join("\n")
                .trim();

              if (!progressData.queries[song.url]) {
                progressData.count++;
              }

              progressData.queries[song.url] = {
                progress: progress.progress / 10,
                text,
              };

              if (progress.success) {
                delete progressData.queries[song.url];

                progressData.downloaded++;
                progressData.count--;
              }
            })),
            song,
          };
        })
      )
    ).filter(
      (searchResult) => searchResult?.success && searchResult?.download_url
    );

    clearInterval(progressTask);

    if (response.length > 0) {
      const downloaded = response.length;
      const total = songs.length;

      await message.edit([
        `Músicas Geradas ${downloaded}/${total}! 🥳`,
        ``,
        ...response.map((data) => {
          return [
            `*Titulo*: \`${String(data.song.name).toLocaleUpperCase()}\``,
            `*Artistas*: \`${data.song.artists ? data.song.artists.join(", ") : "~"
            }\``,
            `*Melhor score*: ${data.song.bestScore || "N/A"}`,
            `*Link para download*: ${data.download_url}`,
            ``,
          ].join("\n");
        }),
      ]
        .join("\n")
        .trim());
    } else {
      await message.edit("Erro ao gerar as músicas! 😢");
    }

    clearMusicTask();
  }
}
