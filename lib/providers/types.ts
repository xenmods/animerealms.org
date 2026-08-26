export interface Stream {
  url: string;
  quality: string;
  downloadLink?: string;
  headers?: Record<string, string>;
}

export interface ScrapeResult {
  streams?: Stream[];
  subtitles?: Array<{
    url: string;
    default?: boolean;
    kind?: string;
    label?: string;
    headers?: Record<string, string>;
  }>;
  notFound?: boolean;
  error?: boolean;
  message?: string;
}

export interface StreamProvider {
  name: string;
  proxyRequired: boolean;
  map: (anilistId: number) => Promise<any>;
  getEpisodes: (providerId: any) => Promise<any>;
  scrape: (
    id: any,
    config?: any
  ) => Promise<{
    streams?: Stream[];
    notFound?: boolean;
    error?: boolean;
    message?: string;
  }>;
}
