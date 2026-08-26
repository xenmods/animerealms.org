export interface Manga {
  id: string;
  title: string;
  image: string;
  latestChapterId?: string;
}

export interface Chapter {
  id: string;
  title: string;
  number?: number;
  url?: string;
}

export interface Page {
  number: number;
  url: string;
}

export interface MangaProvider {
  name: string;
  baseUrl: string;
  map: (anilistId: number) => Promise<string | null>;
  search: (query: string) => Promise<Manga[]>;
  getChapters: (mangaId: string) => Promise<Chapter[]>;
  scrape: (chapterId: string) => Promise<Page[]>;
}