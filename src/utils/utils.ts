import os from "os";

export default class Utils {
  public static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  public static systemOS(): Record<string, string> {
    return {
      name: os.platform(),
      arch: os.arch(),
    };
  }

  public static systemName(): string {
    return os.platform();
  }

  public static systemArch(): string {
    return os.arch();
  }
}
