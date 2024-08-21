export const YOUTUBE_URLS: Record<string, Record<string, string>> = {
  win32: {
    x64: "https://github.com/yt-dlp/yt-dlp/releases/download/2024.04.09/yt-dlp.exe",
    x86: "https://github.com/yt-dlp/yt-dlp/releases/download/2024.04.09/yt-dlp_x86.exe",
    ia32: "https://github.com/yt-dlp/yt-dlp/releases/download/2024.04.09/yt-dlp_min.exe",
  },
  linux: {
    x64: "https://github.com/yt-dlp/yt-dlp/releases/download/2024.04.09/yt-dlp_linux",
    arm: "https://github.com/yt-dlp/yt-dlp/releases/download/2024.04.09/yt-dlp_linux_armv7l",
    arm64:
      "https://github.com/yt-dlp/yt-dlp/releases/download/2024.04.09/yt-dlp_linux_aarch64",
  },
  darwin: {
    x64: "https://github.com/yt-dlp/yt-dlp/releases/download/2024.04.09/yt-dlp_macos",
    arm64:
      "https://github.com/yt-dlp/yt-dlp/releases/download/2024.04.09/yt-dlp_macos_legacy",
  },
};
