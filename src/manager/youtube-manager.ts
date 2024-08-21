import {
  streamDownloadYoutube,
  validateYoutube,
} from "../binary/youtube/youtube";
import log from "log-beautify";

export default class YoutubeManager {
  public static async initializer() {
    try {
      log.ok_(`[SOCKET (INFO)] => Validando binário do youtube...`);

      if (!(await validateYoutube())) {
        log.warn_(
          "[SOCKET (ERROR)] => O binário do youtube não foi encontrado"
        );

        log.ok_("[SOCKET (INFO)] => Baixando binário do youtube...");

        await streamDownloadYoutube(
          (progress, maxProgress, downloadedMB, totalMB) => {
            log.warn_(
              `[SOCKET (INFO)] => Baixando binário do youtube: ${progress}% (${downloadedMB}/${totalMB}MB)`
            );
          }
        );

        log.ok_("[SOCKET (INFO)] => Binário do youtube baixado com sucesso");
      } else {
        log.ok_("[SOCKET (INFO)] => Binário do youtube ok");
      }
    } catch (error) {
      log.error_(
        "[SOCKET (ERROR)] => Ocorreu um erro ao inicializar o binário do youtube"
      );
    }
  }
}
