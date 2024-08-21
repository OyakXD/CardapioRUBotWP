import axios from "axios";

export default class HttpConnection {
  public static async get(url: string) {
    try {
      await axios.get(url);
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
}
