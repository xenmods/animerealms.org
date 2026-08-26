import { execFile } from "child_process";
import { promisify } from "util";
import * as cheerio from "cheerio";
import FuzzySet from "fuzzyset";
import { Stream, StreamProvider, ScrapeResult } from "@/lib/providers/types";
import { getAnimeInfo } from "@/lib/anime";

const execFileAsync = promisify(execFile);

async function anidbCurl(url: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("curl", [
      "-sL",
      "-A",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "-e",
      "https://anidb.app/",
      "--max-time",
      "10",
      url,
    ]);
    return stdout;
  } catch {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://anidb.app/",
      },
    });
    return res.text();
  }
}

class AniDB implements StreamProvider {
  name = "anidb";
  proxyRequired = true;
  url = "https://anidb.app";
  short = "anidb";

  async map(anilistId: number): Promise<string | null> {
    try {
      const media = await getAnimeInfo(anilistId);
      if (!media || !media.title) return null;

      const rawTitles = [
        media.title.english,
        media.title.romaji,
        media.title.native,
      ].filter(Boolean);

      const uniqueTitles: string[] = [];
      const seen = new Set<string>();
      for (const t of rawTitles) {
        const lower = t.toLowerCase().trim();
        if (!seen.has(lower)) {
          seen.add(lower);
          uniqueTitles.push(t.trim());
        }
      }

      if (uniqueTitles.length === 0) return null;

      for (const title of uniqueTitles) {
        const searchUrl = `${this.url}/search/suggestions?q=${encodeURIComponent(title)}`;
        const html = await anidbCurl(searchUrl);
        const $ = cheerio.load(html);

        const results: Array<{ id: string; title: string }> = [];
        $("a[href*='/anime/']").each((_, el) => {
          const href = $(el).attr("href");
          const itemTitle =
            $(el).find("p").first().text().trim() ||
            $(el).attr("title") ||
            "";
          if (href && itemTitle) {
            const match = href.match(/\/anime\/([a-z0-9-]+-[0-9]+)/i);
            if (match) {
              results.push({ id: match[1], title: itemTitle });
            }
          }
        });

        if (results.length === 0) {
          const browseUrl = `${this.url}/browse?q=${encodeURIComponent(title)}`;
          const browseHtml = await anidbCurl(browseUrl);
          const $b = cheerio.load(browseHtml);
          $b("a[href*='/anime/']").each((_, el) => {
            const href = $b(el).attr("href");
            const itemTitle =
              $b(el).attr("title") ||
              $b(el).find("h3, p, span").first().text().trim() ||
              "";
            if (href && itemTitle) {
              const match = href.match(/\/anime\/([a-z0-9-]+-[0-9]+)/i);
              if (match) {
                results.push({ id: match[1], title: itemTitle });
              }
            }
          });
        }

        if (results.length === 0) continue;

        const normalizedSearch = title.toLowerCase().trim();
        const exactMatch = results.find(
          (r) => r.title.toLowerCase().trim() === normalizedSearch
        );
        if (exactMatch) return exactMatch.id;

        const fuzzy = new FuzzySet();
        results.forEach((r) => fuzzy.add(r.title));
        const matches = fuzzy.get(title);

        if (matches && matches.length > 0) {
          const bestMatchTitle = matches[0][1];
          const bestResult = results.find((r) => r.title === bestMatchTitle);
          if (bestResult) {
            return bestResult.id;
          }
        }

        return results[0].id;
      }

      return null;
    } catch (error) {
      console.error(`[${this.name}] Error mapping:`, error);
      return null;
    }
  }

  async getEpisodes(
    providerId: string
  ): Promise<Array<{ episode_number: number; id: string }> | null> {
    try {
      if (!providerId || typeof providerId !== "string") return null;
      const numericId = providerId.split("-").pop();
      if (!numericId) return null;

      const episodesUrl = `${this.url}/api/frontend/anime/${numericId}/episodes`;
      const json = await anidbCurl(episodesUrl);
      const data = JSON.parse(json);
      if (!data.episodes || !Array.isArray(data.episodes)) return [];

      return data.episodes.map((ep: any) => ({
        episode_number: ep.number,
        id: String(ep.id),
      }));
    } catch (error) {
      console.error(`[${this.name}] Error fetching episodes:`, error);
      return null;
    }
  }

  async scrape(episodeId: string): Promise<ScrapeResult> {
    try {
      if (!episodeId) return { notFound: true };
      const languagesUrl = `${this.url}/api/frontend/episode/${episodeId}/languages`;
      const json = await anidbCurl(languagesUrl);
      const langData = JSON.parse(json);

      if (!langData.languages || langData.languages.length === 0) {
        return { notFound: true, message: "No languages found for episode" };
      }

      const targetLang =
        langData.languages.find(
          (l: any) =>
            l.code === "jpn" ||
            l.name?.toLowerCase().includes("japanese") ||
            l.name?.toLowerCase().includes("sub")
        ) || langData.languages[0];

      if (!targetLang || !targetLang.embed_url) {
        return { notFound: true, message: "No embed URL found" };
      }

      const embedHtml = await anidbCurl(targetLang.embed_url);
      const fileMatch = embedHtml.match(/file:\s*['"]([^'"]+)['"]/);

      if (!fileMatch || !fileMatch[1]) {
        return { notFound: true, message: "No video file found in embed" };
      }

      const masterUrl = fileMatch[1];
      const streams: Stream[] = [
        {
          url: masterUrl,
          quality: "auto",
          headers: {
            Referer: `${this.url}/`,
          },
        },
      ];

      try {
        const playlist = await anidbCurl(masterUrl);
        const lines = playlist.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith("#EXT-X-STREAM-INF")) {
            const resMatch = line.match(/RESOLUTION=\d+x(\d+)/i);
            const quality = resMatch ? `${resMatch[1]}p` : "default";
            const nextLine = lines[i + 1]?.trim();
            if (nextLine && !nextLine.startsWith("#")) {
              const streamUrl = nextLine.startsWith("http")
                ? nextLine
                : new URL(nextLine, masterUrl).toString();
              streams.push({
                url: streamUrl,
                quality,
                headers: {
                  Referer: `${this.url}/`,
                },
              });
            }
          }
        }
      } catch (err) {
        console.warn(
          `[${this.name}] Failed to parse master playlist variants:`,
          err
        );
      }

      return {
        streams,
      };
    } catch (error) {
      console.error(`[${this.name}] Error scraping:`, error);
      return { error: true, message: String(error) };
    }
  }
}

const anidb = new AniDB();
export default anidb;
