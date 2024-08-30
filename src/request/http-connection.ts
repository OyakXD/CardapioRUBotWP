import axios from "axios";
import { WAVersion } from "baileys";
import { load as loadHTML } from "cheerio";

export default class HttpConnection {
  public static async get(url: string, timeout: number = 7_000) {
    try {
      await axios.get(url, { timeout });
    } catch (error) {
      return false;
    }

    return true;
  }

  public static async sigaa(): Promise<boolean> {
    try {
      const response = await axios.get('https://si3.ufc.br/sigaa/verTelaLogin.do', {
        timeout: 10_000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  public static async moodle() {
    return await this.get("https://moodle2.quixada.ufc.br");
  }

  public static async sipac() {
    return await this.get("https://si3.ufc.br/sipac");
  }

  public static async fetchLatestWhatsappVersion(
    defaultVersion: [number, number, number]
  ): Promise<{ version: WAVersion; isLatest: boolean; error?: string }> {
    const useVersion = {
      version: defaultVersion,
      isLatest: false,
    };

    try {
      const { data } = await axios.get(
        "https://wppconnect.io/whatsapp-versions/",
        { timeout: 5_000 }
      );

      const $ = loadHTML(data);
      const versionMatch = $("main .row h3")
        .first()
        .text()
        .match(/(\d+\.\d+\.\d+)/);

      if (versionMatch) {
        const version = versionMatch[0].split(".").map(Number) as WAVersion;

        return {
          version: version,
          isLatest: true,
        };
      }

      return useVersion;
    } catch (error: any) {
      return {
        ...useVersion,
        error: error.message,
      };
    }
  }
}

export const fetchLatestWhatsappVersion =
  HttpConnection.fetchLatestWhatsappVersion;
