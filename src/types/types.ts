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
  song: {
    name: string;
    url: string;
    album: string;
    artists: string[];
    duration: number;
    bestScore: string | null;
  };
}

export interface YoutubeLinksResult {
  metadata: YoutubeSearchResult[];
}
