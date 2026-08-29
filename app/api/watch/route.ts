"use server";

import { NextRequest, NextResponse } from "next/server";
import providers from "@/lib/providers";
import { StreamProvider, ScrapeResult } from "@/lib/providers/types";
import clientPromise from "@/lib/db";
import { getAnimeInfo } from "@/lib/anime";

export async function POST(request: NextRequest) {
  const {
    anilistId,
    episodeNumber,
    provider: providerName,
    config,
  } = await request.json();

  const requestBody = {
    anilistId,
    episodeNumber,
    provider: providerName,
    config,
  };

  if (!anilistId || !episodeNumber || !providerName) {
    return NextResponse.json(
      { message: "Missing required parameters" },
      { status: 400 }
    );
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

  try {
    const client = await clientPromise;
    const db = client.db("animerealms_v2");
    const mappingsCollection = db.collection("providers_mappings");
    const episodesCollection = db.collection("providers_episodes");

    let id: string;
    const mapping = await mappingsCollection.findOne({ anilistId });

    if (mapping && mapping.providers && mapping.providers[provider.name]) {
      id = mapping.providers[provider.name];
    } else {
      id = await provider.map(Number(anilistId));
      if (id) {
        await mappingsCollection.updateOne(
          { anilistId },
          { $set: { [`providers.${provider.name}`]: id } },
          { upsert: true }
        );
      }
    }

    if (!id) {
      return NextResponse.json({ notFound: true });
    }

    let episodes: any[];
    const cachedEpisodes = await episodesCollection.findOne({ anilistId });

    if (
      cachedEpisodes &&
      cachedEpisodes.providers &&
      cachedEpisodes.providers[provider.name]
    ) {
      episodes = cachedEpisodes.providers[provider.name];
    } else {
      episodes = await provider.getEpisodes(id);
      const animeInfo = await getAnimeInfo(Number(anilistId));

      if (animeInfo && animeInfo.status === "FINISHED") {
        await episodesCollection.updateOne(
          { anilistId },
          { $set: { [`providers.${provider.name}`]: episodes } },
          { upsert: true }
        );
      } else {
        await episodesCollection.updateOne(
          { anilistId },
          {
            $set: {
              [`providers.${provider.name}`]: episodes,
              cachedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }

    const episode = episodes.find(
      (ep: any) => Number(ep.episode_number) === Number(episodeNumber)
    );

    const result: ScrapeResult = await provider.scrape(
      episode?.id || id,
      requestBody.config
    );

    const origin = request.headers.get("origin");
    const allowedOrigins = [
      "https://animerealms.org",
      "https://www.animerealms.org",
      "http://localhost:3000",
      "http://localhost",
      "http://127.0.0.1",
      "tauri://localhost",
      "http://tauri.localhost",
      "https://tauri.localhost",
    ];

    const isAllowed = !origin || allowedOrigins.some((o) => origin.includes(o));

    if (!isAllowed) {
      result.streams = [
        {
          url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          quality: "default",
        },
      ];
    }


    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] Error scraping with ${provider.name}:`, error);
    return NextResponse.json(
      { error: true, message: (error as Error).message },
      { status: 500 }
    );
  }
}
