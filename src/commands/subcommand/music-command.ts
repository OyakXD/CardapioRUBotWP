import { proto } from "baileys";
import { CommandData, ReplyMessageFunction, SubCommand } from "../sub-command";
import { YoutubeSearchResult } from "../../types/types";
import Utils from "../../utils/utils";
import DDown from "../../request/ddown";

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
    reply: ReplyMessageFunction,
    args: string[],
    data: CommandData
  ): Promise<any> {
    const { chatPrivate } = data;

    if (!chatPrivate) {
      return await reply({
        text: "Esse comando só pode ser executado em uma conversa privada! 😅",
      });
    }

    const link = args.join(" ");

    if (!Utils.validateUrl(link)) {
      return await reply({
        text: "Link inválido! 😢",
      });
    }

    let songsFound = 0;

    if (this.musicRunningCount >= this.maxMusicRunningCount) {
      return await reply({
        text: "Limite de download de músicas ao mesmo tempo atingido, aguarde a fila esvaziar! 😢",
      });
    }
    this.musicRunningCount++;

    const musicTask = setTimeout(() => this.musicRunningCount--, 60_000 * 3);

    const clearMusicTask = () => {
      clearTimeout(musicTask);
      this.musicRunningCount--;
    };

    const replyKey: proto.IMessageKey = (
      await reply({
        text: "Coletando informações do link aguarde...",
      })
    ).key;

    const metadata: YoutubeSearchResult[] = await DDown.search(
      link,
      async (data: YoutubeSearchResult[]) => {
        songsFound += data?.length ?? 0;

        if (replyKey) {
          await reply({
            text: `Músicas encontradas: ${songsFound}`,
            edit: replyKey,
          });
        }
      }
    );

    /* o end-point retorna nullo caso não tenha informações. */
    if (!metadata || metadata.length === 0) {
      clearMusicTask();

      return await reply({
        text: "Erro ao coletar informações do link! 😢",
        edit: replyKey,
      });
    }

    await reply({
      text: "Gerando dados da música, aguarde...",
      edit: replyKey,
    });

    const songs = metadata.filter((data) => data && data.success && data.song);

    /* Estrutura para gerenciar as mensagem de progresso */
    const progressData = {
      message: [] as string[],
      queries: {} as { [_: string]: any },
      count: 0,
      downloaded: 0,
      total: songs.length,
    };

    const progressTask = setInterval(() => {
      const percentage = Math.floor(
        (progressData.downloaded / progressData.total) * 100
      );

      if (progressData.count === 0) {
        progressData.message = ["Aguardando serviço de download..."];
      } else {
        progressData.message = [
          `Você pode ver o progresso de download das músicas abaixo:`,
          ``,
          `Progresso: ${progressData.downloaded}/${progressData.total} (${percentage}%)`,
        ];
      }

      reply({
        text: progressData.message.join("\n"),
        edit: replyKey,
      });
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

      await reply({
        text: [
          `Músicas Geradas ${downloaded}/${total}! 🥳`,
          ``,
          ...response.map((data) => {
            return [
              `*Titulo*: \`${String(data.song.name).toLocaleUpperCase()}\``,
              `*Artistas*: \`${
                data.song.artists ? data.song.artists.join(", ") : "~"
              }\``,
              `*Melhor score*: ${data.song.bestScore || "N/A"}`,
              `*Link para download*: ${data.download_url}`,
              ``,
            ].join("\n");
          }),
        ]
          .join("\n")
          .trim(),
        edit: replyKey,
      });
    } else {
      await reply({
        text: "Erro ao gerar as músicas! 😢",
        edit: replyKey,
      });
    }

    clearMusicTask();
  }
}
