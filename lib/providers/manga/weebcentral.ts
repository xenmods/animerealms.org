import * as cheerio from "cheerio";
import FuzzySet from "fuzzyset";
import cloudscraper from "cloudscraper";
import { Manga, Chapter, Page, MangaProvider } from "@/lib/providers/manga-types";

class WeebCentral implements MangaProvider {
  name = "WeebCentral";
  baseUrl = "https://weebcentral.com";
  
  private headers = {
    'Referer': 'https://weebcentral.com/',
    'Origin': 'https://weebcentral.com',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache'
  };

  private async fetchAnilistMetadata(id: number) {
    const query = `
      query ($id: Int) {
        Media (id: $id, type: MANGA) {
          id
          title {
            romaji
            english
            native
          }
          synonyms
        }
      }
    `;

    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { id }
        })
      });

      if (!response.ok) throw new Error(`AniList API Error: ${response.statusText}`);
      
      const data = await response.json();
      return data.data.Media;
    } catch (error) {
      console.error(`[${this.name}] AniList Fetch Error:`, error);
      return null;
    }
  }

  async map(anilistId: number): Promise<string | null> {
    const metadata = await this.fetchAnilistMetadata(anilistId);
    if (!metadata) return null;

    const { title, synonyms } = metadata;
    
    const possibleTitles = [
      title.english,
      title.romaji,
      title.native,
      ...(synonyms || [])
    ].filter((t): t is string => Boolean(t));

    const searchQuery = title.english || title.romaji;
    if (!searchQuery) return null;

    const searchResults = await this.search(searchQuery);

    if (searchResults.length === 0) {
        return null;
    }

    const fs = FuzzySet(possibleTitles);
    
    let bestMatchId: string | null = null;
    let bestScore = 0;

    for (const result of searchResults) {
        const match = fs.get(result.title);
        
        if (match && match[0]) {
            const score = match[0][0];
            
            if (score > bestScore) {
                bestScore = score;
                bestMatchId = result.id;
            }
        }
    }

    if (bestScore > 0.7) {
        return bestMatchId;
    }

    console.warn(`[${this.name}] No good match found for ${anilistId}`);
    return null;
  }

  async search(query: string): Promise<Manga[]> {
    try {
      const params = new URLSearchParams({
        text: query,
        sort: 'Best Match',
        order: 'Descending',
        official: 'Any',
        anime: 'Any',
        adult: 'Any',
        display_mode: 'Full Display'
      });

      const url = `${this.baseUrl}/search/data?${params.toString()}`;
      
      const html = await cloudscraper({
        method: 'GET',
        url: url,
        headers: this.headers,
        jar: true
      });

      const $ = cheerio.load(html);
      
      if ($('title').text().includes('Just a moment')) {
        console.error(`[${this.name}] Cloudflare challenge detected (Search).`);
        return [];
      }

      const mangas: Manga[] = [];

      $('article.bg-base-300').each((index, element) => {
        const $article = $(element);
        const $link = $article.find('a[href*="/series/"]').first();
        const seriesUrl = $link.attr('href');
        
        const seriesIdMatch = seriesUrl?.match(/\/series\/([^\/]+)/);
        const seriesId = seriesIdMatch ? seriesIdMatch[1] : null;

        const name = $link.attr('href')?.split('/').pop()?.replace(/-/g, ' ').trim() || 
                     $article.find('.line-clamp-1').text().trim();

        const posterUrl = $article.find('source[type="image/webp"]').attr('srcset') || 
                          $article.find('img').attr('src');

        const $chapterLink = $article.find('a[href*="/chapters/"]').first();
        const latestChapterUrl = $chapterLink.attr('href');
        const latestChapterIdMatch = latestChapterUrl?.match(/\/chapters\/([^\/]+)/);
        const latestChapterId = latestChapterIdMatch ? latestChapterIdMatch[1] : undefined;

        if (seriesId && name && posterUrl) {
          mangas.push({
            id: seriesId,
            title: name,
            image: posterUrl,
            latestChapterId
          });
        }
      });

      return mangas;
    } catch (error: any) {
      console.error(`[${this.name}] Search Error:`, error.message || error);
      return [];
    }
  }

  async getChapters(seriesId: string): Promise<Chapter[]> {
    try {
      const seriesHtml = await cloudscraper({
        method: 'GET',
        url: `${this.baseUrl}/series/${seriesId}`,
        headers: this.headers,
        jar: true
      });
      
      let $ = cheerio.load(seriesHtml);
      
      if ($('title').text().includes('Just a moment')) {
        console.error(`[${this.name}] Cloudflare challenge detected (GetChapters-Series).`);
        return [];
      }

      const $latestChapterLink = $('a[href*="/chapters/"]').first();
      const latestChapterUrl = $latestChapterLink.attr('href');
      const latestChapterIdMatch = latestChapterUrl?.match(/\/chapters\/([^\/]+)/);
      const latestChapterId = latestChapterIdMatch ? latestChapterIdMatch[1] : null;

      if (!latestChapterId) {
        console.error(`[${this.name}] Could not find any chapters for series: ${seriesId}`);
        return [];
      }

      const listUrl = `${this.baseUrl}/series/${seriesId}/chapter-select?current_chapter=${latestChapterId}&current_page=0`;
      
      const html = await cloudscraper({
        method: 'GET',
        url: listUrl,
        headers: this.headers,
        jar: true
      });

      $ = cheerio.load(html);
      
      if ($('title').text().includes('Just a moment')) {
        console.error(`[${this.name}] Cloudflare challenge detected (GetChapters-List).`);
        return [];
      }

      const chapters: Chapter[] = [];

      $('div.grid button, div.grid a').each((index, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        const href = $el.attr('href');
        
        if (text) {
          let chapterId = href ? href.split('/').pop() : null;
          
          if (!chapterId && $el.attr('id') === 'selected_chapter') {
            const urlObj = new URL(listUrl);
            chapterId = urlObj.searchParams.get('current_chapter');
          }

          if (chapterId) {
            const numberMatch = text.match(/(\d+(\.\d+)?)/);
            const number = numberMatch ? parseFloat(numberMatch[0]) : 0;

            chapters.push({
              id: chapterId,
              title: text,
              number: number
            });
          }
        }
      });

      return chapters;
    } catch (error: any) {
      console.error(`[${this.name}] GetChapters Error:`, error.message || error);
      return [];
    }
  }

  async scrape(chapterId: string): Promise<Page[]> {
    try {
      const url = `${this.baseUrl}/chapters/${chapterId}`;
      const html = await cloudscraper({
        method: 'GET',
        url: url,
        headers: this.headers,
        jar: true
      });

      const $ = cheerio.load(html);

      if ($('title').text().includes('Just a moment')) {
        console.error(`[${this.name}] Cloudflare challenge detected (Scrape).`);
        return [];
      }

      const firstPageUrl = $('link[rel="preload"][as="image"]').attr('href');
      if (!firstPageUrl) return [];

      const lastSlashIndex = firstPageUrl.lastIndexOf('/');
      const baseUrl = firstPageUrl.substring(0, lastSlashIndex + 1);
      const fileName = firstPageUrl.substring(lastSlashIndex + 1);

      let chapterNum = null;
      const match1 = fileName.match(/^(\d+)-\d+\.png$/);
      const match2 = fileName.match(/^([\d.]+)-\d+\.png$/);

      if (match1) chapterNum = match1[1];
      else if (match2) chapterNum = match2[1];

      if (!chapterNum) return [];

      const pages: Page[] = [];
      let consecutiveFailures = 0;
      const maxFailures = 3;
      let i = 1;

      while (consecutiveFailures < maxFailures) {
        const pageNum = String(i).padStart(3, '0');
        const pageUrl = `${baseUrl}${chapterNum}-${pageNum}.png`;

        try {
          await cloudscraper({
            method: 'HEAD',
            url: pageUrl,
            headers: this.headers,
            resolveWithFullResponse: true,
            jar: true
          });
          
          pages.push({
            number: i,
            url: pageUrl
          });
          consecutiveFailures = 0;
        } catch (e) {
          consecutiveFailures++;
        }
        
        i++;
      }

      return pages;
    } catch (error: any) {
      console.error(`[${this.name}] Scrape/Pages Error:`, error.message || error);
      return [];
    }
  }
}

const provider = new WeebCentral();
export default provider;