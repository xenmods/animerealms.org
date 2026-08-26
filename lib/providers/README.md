# Streaming Providers

This directory contains streaming and source scraper implementations for the application.

## Creating a Provider

1. Create a TypeScript file in `lib/providers/anime/` (e.g. `my-provider.ts`).
2. Implement the `StreamProvider` interface:

```typescript
import { StreamProvider, ScrapeResult } from "@/lib/providers/types";

class MyProvider implements StreamProvider {
  name = "my-provider";
  short = "myprovider";
  proxyRequired = true; // Set to true if browser CORS proxy is needed

  // Maps an AniList media ID to the provider's internal identifier
  async map(anilistId: number): Promise<string | null> {
    // 1. Fetch anime title using getAnimeInfo(anilistId)
    // 2. Search provider site
    // 3. Return matching anime ID
    return "anime-slug-or-id";
  }

  // Fetches episode list for the mapped anime ID
  async getEpisodes(
    providerId: string
  ): Promise<Array<{ episode_number: number; id: string }> | null> {
    return [
      { episode_number: 1, id: "episode-1-id" },
      { episode_number: 2, id: "episode-2-id" },
    ];
  }

  // Scrapes video stream URLs and subtitles for a specific episode ID
  async scrape(episodeId: string): Promise<ScrapeResult> {
    return {
      streams: [
        {
          url: "https://example.com/master.m3u8",
          quality: "auto",
        },
      ],
    };
  }
}

const myProvider = new MyProvider();
export default myProvider;
```

## Registering a Provider

To make the provider accessible in the application:

1. **`lib/providers/index.ts`**: Import the provider instance and append it to the `providers` array.
2. **`lib/providers/list.ts`**: Add the provider key to `providerNames` and its display metadata to `providersConfig`:

```typescript
export const providersConfig = {
  // ...
  "my-provider": {
    name: "My Provider",
    short: "myprovider",
    proxyRequired: true,
  },
};
```
