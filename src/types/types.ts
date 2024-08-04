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
