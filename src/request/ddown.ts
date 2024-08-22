import axios from "axios";
import { YoutubeSearchResult } from "../types/types";

const DOWNLOAD_URL = "https://ab.cococococ.com/ajax/download.php";
const PROGRESS_URL = "https://p.oceansaver.in/ajax/progress.php";
const SEARCH_URL = "https://song-search-api.vercel.app/full-search-songs";

interface CallbackProgress {
  progress: number;
  success: number;
  text: string;
  download_url: string | null;
}

export default class DDown {
  public static async search(
    searchQuery: string,
    callback?: (data: YoutubeSearchResult[]) => void,
    offset: number = 0,
    searchLimit?: number
  ) {
    try {
      const response = await axios.post(
        SEARCH_URL,
        { searchQuery, searchLimit, offset },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data) {
        return null;
      }

      const { metadata, type, hasMore, nextOffset, nextId, limit } =
        response.data;

      const metadataResults = [];

      if (type === "songs") {
        metadataResults.push(...metadata);

        if (callback) callback(metadata);

        if (hasMore) {
          const moreResults = await this.search(
            nextId,
            callback,
            nextOffset,
            limit
          );

          if (moreResults) {
            metadataResults.push(...moreResults);
          }
        }
      } else if (type === "albums") {
        const albumResults = await Promise.all(
          metadata.map((album: string) => this.search(album, callback))
        );

        metadataResults.push(...albumResults.flat());

        if (callback) callback(metadata);
      }

      return metadataResults;
    } catch (error) {
      return null;
    }
  }

  public static async get(
    url: string,
    callback?: (progress: CallbackProgress) => void
  ): Promise<CallbackProgress | null> {
    const options = this.buildOptions({
      url: url,
      format: "mp3",
      api: "dfcb6d76f2f6a9894gjkege8a4ab232222",
      copyright: 0,
    });

    const downloadResponse = await fetch(`${DOWNLOAD_URL}?${options}`, {
      cache: "no-store",
    });

    if (downloadResponse.ok) {
      const downloadData = await downloadResponse.json();

      if (downloadData.success) {
        const progress = async () => {
          const response = await fetch(
            `${PROGRESS_URL}?id=${downloadData.id}`,
            { cache: "no-store" }
          );

          if (response.ok) {
            const data = await response.json();

            if (!data.success) {
              if (callback) callback(data);

              return await new Promise((resolve) => {
                setTimeout(async () => {
                  resolve(await progress());
                }, 700);
              });
            }

            return data;
          }

          return null;
        };

        const progressData = await progress();

        if (callback) callback(progressData);
        return progressData;
      }
    }

    return null;
  }

  private static buildOptions(options: any) {
    return new URLSearchParams(options).toString();
  }
}
