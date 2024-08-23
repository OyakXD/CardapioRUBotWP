import axios from "axios";
import { YoutubeSearchResult } from "../types/types";

const DOWNLOAD_URL = "https://ab.cococococ.com/ajax/download.php";
const PROGRESS_URL = "https://p.oceansaver.in/ajax/progress.php";
const SONG_SEARCH_URL = "https://song-search-api.vercel.app";

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
      const axiosInstance = axios.create({
        baseURL: SONG_SEARCH_URL,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await axiosInstance.post("/search-songs", {
        searchQuery,
        searchLimit,
        offset,
      });

      if (!response.data) {
        return null;
      }

      const { metadata, type, hasMore, nextOffset, nextId, limit } =
        response.data;

      const metadataResults = [];

      if (type === "songs") {
        const simpleMetadata = await Promise.all(
          metadata.map(async (song: any) => {
            try {
              const response = await axiosInstance.post("/simple-link", song);

              if (response.data) {
                return response.data;
              }
            } catch (error) {
              return null;
            }
          })
        );

        metadataResults.push(...simpleMetadata);

        if (callback) callback(simpleMetadata);

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
