"use server";

import { getTmdbId } from "@/lib/tmdb";
import { searchSubtitles } from "wyzie-lib";

export interface CommunitySubtitle {
  id: string;
  url: string;
  label: string;
  language: string;
  format: string;
  source: string;
}

export async function fetchCommunitySubtitles(
  anilistId: number,
  episodeNumber: number,
  seasonNumber: number = 1
): Promise<{
  success: boolean;
  subtitles?: CommunitySubtitle[];
  error?: string;
}> {
  try {
    const tmdbId = await getTmdbId(anilistId);

    if (!tmdbId) {
      return { success: false, error: "TMDB ID not found for this anime." };
    }

    console.log(
      `[SUBS] Fetching for TMDB ${tmdbId} S${seasonNumber} E${episodeNumber}`
    );

    const params: any = {
      tmdb_id: tmdbId,
      format: "srt",
      season: seasonNumber,
      episode: episodeNumber,
    };

    const results = await searchSubtitles(params);

    if (!results || results.length === 0) {
      return { success: true, subtitles: [] };
    }

    const subtitles: CommunitySubtitle[] = results.map((sub: any) => ({
      id: sub.id || Math.random().toString(36).substring(7),
      url: sub.url,
      label: sub.display || `${sub.language} - ${sub.source || "Community"}`,
      language: sub.language || "en",
      format: "srt",
      source: "Wyzie",
    }));

    return { success: true, subtitles };
  } catch (error: any) {
    console.error("Error fetching community subtitles:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch subtitles",
    };
  }
}
