import axios from "axios";

export default class HttpConnection {
  public static async get(url: string, timeout: number = 2_000) {
    try {
      await axios.get(url, { timeout });
    } catch (error) {
      return false;
    }

    return true;
  }

  public static async sigaa() {
    return await this.get("https://si3.ufc.br/sigaa");
  }

  public static async moodle() {
    return await this.get("https://moodle2.quixada.ufc.br");
  }

  public static async sipac() {
    return await this.get("https://si3.ufc.br/sipac");
  }
}
