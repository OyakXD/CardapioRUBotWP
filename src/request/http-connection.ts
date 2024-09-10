import axios from "axios";
import { WAVersion } from "baileys";
import { load as loadHTML } from "cheerio";

export default class HttpConnection {
  public static async get(url: string, timeout: number = 6_000) {
    try {
      return await axios.get(url, {
        timeout,
      });
    } catch (error) {
      return false;
    }
  }

  public static async sigaa(): Promise<boolean> {
    const response = await this.get("https://si3.ufc.br/sigaa/verTelaLogin.do");

    return response ? this.si3AuthValidation(response.data) : false;
  }

  public static async sipac() {
    const response = await this.get("https://si3.ufc.br/sipac/login.jsf");

    return response ? this.si3AuthValidation(response.data) : false;
  }

  public static async moodle() {
    const response = await this.get(
      "https://moodle2.quixada.ufc.br/login/index.php"
    );

    return response ? this.moodleAuthValidation(response.data) : false;
  }

  public static moodleAuthValidation(content: any) {
    const $ = loadHTML(content);

    return (
      $('p:contains("Acesse com as credenciais")').length > 0 &&
      $("form").length > 0
    );
  }

  public static si3AuthValidation(content: any) {
    const $ = loadHTML(content);

    return (
      $('h3:contains("Entrar no Sistema")').length > 0 && $("form").length > 0
    );
  }

  public static async fetchLatestWhatsappVersion(
    defaultVersion: [number, number, number],
    retryCount: number = 3
  ): Promise<{ version: WAVersion; isLatest: boolean; error?: string }> {
    let useVersion = {
      version: defaultVersion,
      isLatest: false,
    };

    while (retryCount-- > 0) {
      try {
        const { data } = await axios.get(
          "https://wppconnect.io/whatsapp-versions/",
          { timeout: 15_000 }
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
        useVersion = {
          ...useVersion,
          error: error.message,
        };
      }
    }

    return useVersion;
  }
}

export const fetchLatestWhatsappVersion =
  HttpConnection.fetchLatestWhatsappVersion;
