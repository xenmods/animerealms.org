import * as cheerio from "cheerio";
import { Stream, StreamProvider, ScrapeResult } from "@/lib/providers/types";

class MegaPlayDub implements StreamProvider {
  name = "megaplay-dub";
  proxyRequired = true;
  url = "https://megaplay.buzz";
  short = "megaplay-dub";

  async map(anilistId: number): Promise<string | null> {
    try {
      return anilistId.toString();
    } catch (error) {
      console.error(`[${this.name}] Error mapping:`, error);
      return null;
    }
  }

  async getEpisodes(providerId: string): Promise<any[] | null> {
    try {
      const query = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            episodes
            nextAiringEpisode {
              episode
            }
          }
        }
      `;

      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { id: parseInt(providerId) },
        }),
      });

      const json = await response.json();
      const media = json.data?.Media;

      if (!media) return [];

      let totalEpisodes = media.episodes;
      if (!totalEpisodes && media.nextAiringEpisode) {
        totalEpisodes = media.nextAiringEpisode.episode - 1;
      }

      if (!totalEpisodes) totalEpisodes = 100;

      const episodes = [];
      for (let i = 1; i <= totalEpisodes; i++) {
        episodes.push({
          id: `${providerId}|${i}`,
          episode_number: i,
        });
      }

      return episodes;
    } catch (error) {
      console.error(`[${this.name}] Error fetching episodes:`, error);
      return null;
    }
  }

  async scrape(episodeId: string): Promise<ScrapeResult> {
    try {
      const [providerId, episodeNumber] = episodeId.split("|");

      const playerUrl = `${this.url}/stream/ani/${providerId}/${episodeNumber}/dub`;

      const commonHeaders = {
        authority: "megaplay.buzz",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua": '"Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-gpc": "1",
        cookie: "SITE_TOTAL_ID=ce655f0eea754f2888ea98ded373e3b5",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
      };

      const playerResponse = await fetch(playerUrl, {
        method: "GET",
        headers: {
          ...commonHeaders,
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          referer: "https://megaplay.buzz/api",
          "sec-fetch-dest": "iframe",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
        },
      });

      if (!playerResponse.ok) {
        return {
          error: true,
          message: `Failed to fetch player HTML: ${playerResponse.status}`,
        };
      }

      let html = await playerResponse.text();
      let $ = cheerio.load(html);

      let dataId = $("#megaplay-player").attr("data-id") || $("[data-id]").attr("data-id");
      let currentDomain = this.url;
      let currentReferer = playerUrl;
      
      if (!dataId) {
        const iframeSrc = $("iframe").attr("src");
        if (iframeSrc) {
          const iframeUrl = new URL(iframeSrc.startsWith("//") ? `https:${iframeSrc}` : iframeSrc, this.url);
          currentDomain = iframeUrl.origin;
          currentReferer = iframeUrl.href;
          
          const iframeResponse = await fetch(currentReferer, {
            method: "GET",
            headers: {
              ...commonHeaders,
              authority: iframeUrl.hostname,
              accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
              referer: playerUrl,
              "sec-fetch-dest": "iframe",
              "sec-fetch-mode": "navigate",
              "sec-fetch-site": "cross-site",
              "upgrade-insecure-requests": "1",
            },
          });
          
          if (iframeResponse.ok) {
             html = await iframeResponse.text();
             $ = cheerio.load(html);
             dataId = $("[data-id]").attr("data-id");
             if (!dataId) {
                 const match = html.match(/data-id="(\d+)"/);
                 dataId = match ? match[1] : null;
             }
          }
        }
      }

      if (!dataId) {
        return {
          notFound: true,
          message: "Could not extract data-id from player HTML or iframe",
        };
      }

      const sourcesUrl = `${currentDomain}/stream/getSources?id=${dataId}&id=${dataId}`;
      const sourcesResponse = await fetch(sourcesUrl, {
        method: "GET",
        headers: {
          ...commonHeaders,
          authority: new URL(currentDomain).hostname,
          accept: "application/json, text/javascript, */*; q=0.01",
          referer: currentReferer,
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
        },
      });

      if (!sourcesResponse.ok) {
        return {
          error: true,
          message: `Failed to fetch sources: ${sourcesResponse.status}`,
        };
      }

      const sourcesJson = await sourcesResponse.json();

      if (!sourcesJson || !sourcesJson.sources || !sourcesJson.sources.file) {
        return {
          notFound: true,
          message: "No source file found in JSON response",
        };
      }

      const streamHeaders = {
        Referer: `${currentDomain}/`,
        "User-Agent": commonHeaders["user-agent"],
        Origin: currentDomain,
        Cookie: commonHeaders["cookie"],
        "sec-ch-ua": commonHeaders["sec-ch-ua"],
        "sec-ch-ua-mobile": commonHeaders["sec-ch-ua-mobile"],
        "sec-ch-ua-platform": commonHeaders["sec-ch-ua-platform"]
      };

      const streams: Stream[] = [
        {
          url: sourcesJson.sources.file,
          quality: "auto",
          headers: streamHeaders,
        },
      ];

      const subtitles = [];
      if (sourcesJson.tracks && Array.isArray(sourcesJson.tracks)) {
        for (const track of sourcesJson.tracks) {
          if (track.kind === "captions" || track.kind === "subtitles") {
            subtitles.push({
              url: track.file,
              label: track.label || "Unknown",
              kind: track.kind,
              default: track.default || false,
              headers: streamHeaders,
            });
          } else if (track.kind === "thumbnails") {
            subtitles.push({
              url: track.file,
              label: "Thumbnails",
              kind: "thumbnails",
              default: false,
              headers: streamHeaders,
            });
          }
        }
      }

      return {
        streams,
        subtitles,
        intro: sourcesJson.intro
          ? { start: sourcesJson.intro.start, end: sourcesJson.intro.end }
          : undefined,
        outro: sourcesJson.outro
          ? { start: sourcesJson.outro.start, end: sourcesJson.outro.end }
          : undefined,
      };
    } catch (error) {
      console.error(`[${this.name}] Error scraping:`, error);
      return { error: true, message: (error as Error).message };
    }
  }
}

export default new MegaPlayDub();
