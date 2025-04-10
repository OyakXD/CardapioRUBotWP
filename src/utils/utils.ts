import { DateTime } from 'luxon';

export default class Utils {
  public static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  public static getCurrentDate() {
    return new Date();
  }

  public static formatCurrentDate(date: Date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  public static isMiddleWeek() {
    let day = Utils.getCurrentDate().getDay();

    return day >= 1 && day <= 5;
  }

  public static getBrazilToday(luxon: boolean = true) {
    if (luxon) {
      return DateTime.now().setZone('America/Sao_Paulo').startOf('day').toMillis();
    }

    const now = new Date();
    const offset = -3 * 60 * 60 * 1000; // UTC-3 para BRT (Brasília)
    const localDate = new Date(now.getTime() + offset);
    localDate.setUTCHours(0, 0, 0, 0);
    return localDate.getTime() - offset;
  };
}
