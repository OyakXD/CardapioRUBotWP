export interface Menu {
  [key: string]: string[];
}

export interface ParserCategory {
  [key: string]: string[];
}

export interface ParserMenu {
  lunch: Menu | null;
  dinner: Menu | null;
  date: string;
}

export interface YoutubeSearchResult {
  success: boolean;
  message: string;
  searchResult: {
    youtubeUrl: string | null;
    bestScore: number | null;
  };
}

export interface YoutubeLinksResult {
  links: YoutubeSearchResult[];
}

export interface YoutubeDownloadResult {
  watchId: string;
  originalUrl: string;
  downloadLink: string;
}
