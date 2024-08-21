import path from "path";
import fetch from "node-fetch";
import fs from "fs";
import { exec } from "child_process";
import { YOUTUBE_URLS } from "./constants";
import { pipeline } from "stream/promises";
import Utils from "../../utils/utils";
import { YoutubeDownloadResult } from "../../types/types";

export const getYoutubePath = (): string => {
  return path.join(
    "bin",
    `youtube${Utils.systemName() === "win32" ? ".exe" : ""}`
  );
};

const getYoutubeUrl = (name: string, arch: string): string | null => {
  return YOUTUBE_URLS[name][arch] ?? null;
};

export const searchYoutubeDownload = async (
  url: string
): Promise<YoutubeDownloadResult> => {
  return new Promise<YoutubeDownloadResult>((resolve, reject) => {
    exec(
      `${getYoutubePath()} -f bestaudio --print "%(id)s %(webpage_url)s %(url)s" "${url}"`,
      (error, stdout) => {
        if (error) {
          return reject(`Error: ${error.message}`);
        }

        const output = stdout.trim().split(" ");
        const watchId = output[0];
        const originalUrl = output[1];
        const downloadLink = output.slice(2).join(" ");

        resolve({
          watchId,
          originalUrl,
          downloadLink,
        });
      }
    );
  });
};

export const getYoutubeVersion = async (): Promise<{
  version: string | null;
}> => {
  return new Promise<{ version: string | null }>((resolve, reject) => {
    exec(`${getYoutubePath()} --version`, (error, stdout, stderr) => {
      if (error) {
        console.log("Error:", error.message);
        resolve({ version: null });
        return;
      }

      resolve({ version: stdout.trim() });
    });
  });
};

export const validateYoutube = async (): Promise<boolean> => {
  try {
    const youtubePath = getYoutubePath();
    const stats = await fs.promises.stat(youtubePath);

    if (!stats.isFile()) {
      return false;
    }

    if (Utils.systemName() === "win32") {
      const extension = path.extname(youtubePath);

      if (extension.toLowerCase() !== ".exe") {
        return false;
      }
    } else {
      const mode = stats.mode;
      const isExecutable = (mode & 0o111) !== 0;

      if (!isExecutable) {
        return false;
      }
    }

    const { version } = await getYoutubeVersion();

    if (!version) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const streamDownloadYoutube = async (
  progressCallback: (
    progress: number,
    maxProgress: number,
    downloadedMB: number,
    totalMB: number
  ) => void
) => {
  const url = getYoutubeUrl(Utils.systemName(), Utils.systemArch());
  const youtubePath = getYoutubePath();

  if (url === null) {
    throw new Error("YouTube binary is not available for your system.");
  }

  try {
    if (fs.existsSync(youtubePath)) {
      if (!(await validateYoutube())) {
        throw new Error("Existing YouTube binary is not valid.");
      }
      return youtubePath;
    }

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(
        `Failed to download youtube binary: ${response.statusText}`
      );
    }

    const totalSize = parseInt(
      response.headers.get("content-length") || "0",
      10
    );
    let accumulatedSize = 0;

    const fileStream = fs.createWriteStream(youtubePath);

    response.body?.on("data", (chunk: Buffer) => {
      accumulatedSize += chunk.length;
      const progress = totalSize
        ? Math.round((accumulatedSize / totalSize) * 100)
        : 0;
      const downloadedMB = parseFloat(
        (accumulatedSize / (1024 * 1024)).toFixed(2)
      );
      const totalMB = parseFloat((totalSize / (1024 * 1024)).toFixed(2));

      progressCallback(progress, 100, downloadedMB, totalMB);
    });

    await pipeline(response.body, fileStream);

    if (Utils.systemName() === "linux" || Utils.systemName() === "darwin") {
      const currentMode = (await fs.promises.stat(youtubePath)).mode;
      const newMode = currentMode | 0o111;

      await fs.promises.chmod(youtubePath, newMode);
    }

    if (!(await validateYoutube())) {
      throw new Error("Downloaded YouTube binary is not valid.");
    }

    return youtubePath;
  } catch (error: any) {
    if (fs.existsSync(youtubePath)) {
      fs.unlinkSync(youtubePath);
    }

    throw new Error(`Failed to download YouTube binary: ${error.message}`);
  }
};
