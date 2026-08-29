import { isTauri } from "@/lib/tauri";
import { ScrapeResult, Stream } from "./types";

interface DownloadedFile {
  filename: string;
  path: string;
  size_bytes: number;
  formatted_size: string;
  modified: number;
  anime_title: string;
  episode: number;
}

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Searches local downloaded episodes for a match by title/alias and episode number
 */
export async function findLocalDownloadedEpisode(
  animeTitles: string[],
  episodeNumber: number
): Promise<{ path: string; formatted_size: string; filename: string } | null> {
  if (!isTauri()) {
    return null;
  }


  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const downloadedFiles: DownloadedFile[] = await invoke("get_downloaded_files");

    if (!Array.isArray(downloadedFiles) || downloadedFiles.length === 0) {
      return null;
    }

    const cleanTargets = animeTitles.filter(Boolean).map(cleanString);

    for (const file of downloadedFiles) {
      if (file.episode === episodeNumber) {
        const cleanFileTitle = cleanString(file.anime_title);
        const cleanFileName = cleanString(file.filename);

        // Check if any alias matches the file title or file name
        const matches = cleanTargets.some(
          (target) =>
            cleanFileTitle.includes(target) ||
            target.includes(cleanFileTitle) ||
            cleanFileName.includes(target)
        );

        if (matches) {
          return {
            path: file.path,
            formatted_size: file.formatted_size,
            filename: file.filename,
          };
        }
      }
    }
  } catch (err) {
    console.warn("[LocalProvider] Error querying local downloads:", err);
  }

  return null;
}

/**
 * Scrapes the local downloads provider for the given episode
 */
export async function scrapeLocalDownloadProvider(
  animeTitles: string[],
  episodeNumber: number
): Promise<ScrapeResult> {
  const match = await findLocalDownloadedEpisode(animeTitles, episodeNumber);

  if (match) {
    const streamUrl = `http://127.0.0.1:39282/local_file?path=${encodeURIComponent(match.path)}`;
    const stream: Stream = {
      url: streamUrl,
      quality: `Local 1080p (${match.formatted_size})`,
    };

    return {
      streams: [stream],
      subtitles: [],
    };
  }

  return {
    notFound: true,
    message: "No local downloaded episode found",
  };
}
