"use server";

import { NextRequest, NextResponse } from "next/server";
import providers from "@/lib/providers";
import { StreamProvider } from "@/lib/providers/types";
import { getAnimeInfo } from "@/lib/anime";
import { fetchEpisodesAnilist } from "@/lib/tmdb";

export async function POST(request: NextRequest) {
  const { provider: providerName } = await request.json();

  if (!providerName) {
    return NextResponse.json(
      { message: "Missing provider name" },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  try {
    if (providerName === "anilist") {
      await getAnimeInfo(178025);
      const endTime = Date.now();
      return NextResponse.json({ ping: endTime - startTime });
    }

    if (providerName === "tmdb") {
      await fetchEpisodesAnilist(178025);
      const endTime = Date.now();
      return NextResponse.json({ ping: endTime - startTime });
    }

    const provider = providers.find((p) => p.name === providerName) as
      | StreamProvider
      | undefined;

    if (!provider) {
      return NextResponse.json(
        { message: `Provider '${providerName}' not found` },
        { status: 404 }
      );
    }

    const anilistId = 178025;
    const episodeNumber = 1;

    const id = await provider.map(Number(anilistId));
    if (!id) {
      throw new Error("Failed to map anilistId");
    }

    const episodes = await provider.getEpisodes(id);
    if (!episodes) {
      await provider.scrape(id);
    } else {
      const episode = episodes.find(
        (ep: any) => Number(ep.episode_number) === Number(episodeNumber)
      );
      await provider.scrape(episode?.id || id);
    }

    const endTime = Date.now();
    return NextResponse.json({ ping: endTime - startTime });
  } catch (error) {
    console.error(`[API Status] Error checking ${providerName}:`, error);
    const endTime = Date.now();
    return NextResponse.json(
      { error: true, message: (error as Error).message, ping: endTime - startTime },
      { status: 500 }
    );
  }
}