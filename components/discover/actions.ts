"use server";

import { auth } from "@/auth";
import { getAllProgress } from "@/components/shared/action";
import clientPromise from "@/lib/db";
import {
  fetchPopularAnime,
  fetchTrendingAnime,
  getAnilistThisSeason,
  getOverallTopAnime,
} from "@/lib/home";
import { getAnimeRecommendations } from "@/lib/recommendations";
import { getTitleLogo } from "@/lib/tmdb";

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function fetchRecommendations(animeId: number) {
  try {
    const recommendations = await getAnimeRecommendations(animeId);
    return recommendations;
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return [];
  }
}

// Helper to get or refresh global cache
async function getGlobalCache() {
  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const cacheCollection = db.collection("discover_cache");

  const globalCache = await cacheCollection.findOne({ _id: "global" as any });

  const isGlobalStale =
    !globalCache ||
    !globalCache.cachedAt ||
    new Date().getTime() - new Date(globalCache.cachedAt).getTime() >
      CACHE_DURATION_MS;

  if (isGlobalStale) {
    try {
      const [trending, popular, season, top] = await Promise.all([
        fetchTrendingAnime(),
        fetchPopularAnime(),
        getAnilistThisSeason(),
        getOverallTopAnime(),
      ]);

      const newGlobalData = {
        _id: "global",
        trending,
        popular,
        season,
        top,
        cachedAt: new Date(),
      };

      await cacheCollection.updateOne(
        { _id: "global" as any },
        { $set: newGlobalData },
        { upsert: true }
      );
      return newGlobalData;
    } catch (error) {
      console.error("Failed to fetch global discover data", error);
      // Fallback or return partial
      if (globalCache) return globalCache;
      return { trending: [], popular: [], season: [], top: [] };
    }
  }
  return globalCache;
}

export async function getHeroData(locale: string) {
  const globalData = await getGlobalCache();

  let trendingWithLogos = globalData.trending || [];
  if (trendingWithLogos.length > 0) {
    trendingWithLogos = trendingWithLogos.slice(0, 8);
    trendingWithLogos = await Promise.all(
      trendingWithLogos.map(async (anime: any) => {
        try {
          const logoData = await getTitleLogo(anime.id, locale);
          return { ...anime, logo: logoData?.logo || null };
        } catch (e) {
          console.error(`Failed logo fetch for ${anime.id}`, e);
          return anime;
        }
      })
    );
  }
  return trendingWithLogos;
}

export async function getDiscoverLists() {
  const session = await auth();
  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const cacheCollection = db.collection("discover_cache");

  const globalData = await getGlobalCache();

  let recommendations: any[] = [];
  let recommendedBasedOn = "";

  if (session?.user?.name) {
    const userId = session.user.name;
    const recCacheId = `rec_${userId}`;
    const recCache = await cacheCollection.findOne({ _id: recCacheId as any });

    const isRecStale =
      !recCache ||
      !recCache.cachedAt ||
      new Date().getTime() - new Date(recCache.cachedAt).getTime() >
        CACHE_DURATION_MS;

    if (!isRecStale && recCache) {
      recommendations = recCache.recommendations;
      recommendedBasedOn = recCache.recommendedBasedOn;
    } else {
      const watched = await getAllProgress(userId);
      const lastWatched =
        watched?.length > 0 ? watched[watched.length - 1] : null;

      if (lastWatched) {
        const animeId = lastWatched.anime_id || lastWatched.anime?.id;
        const animeTitle =
          lastWatched.anime?.title?.english ||
          lastWatched.anime?.title?.romaji ||
          "Unknown";

        if (animeId) {
          try {
            recommendations = await getAnimeRecommendations(animeId);
            recommendedBasedOn = animeTitle;

            await cacheCollection.updateOne(
              { _id: recCacheId as any },
              {
                $set: {
                  recommendations,
                  recommendedBasedOn,
                  cachedAt: new Date(),
                },
              },
              { upsert: true }
            );
          } catch (err) {
            console.error("Failed to fetch recommendations", err);
          }
        }
      }
    }
  }

  let recentHistory: any[] = [];
  if (session?.user?.name) {
    recentHistory = await getAllProgress(session.user.name);
  }

  return {
    popular: globalData?.popular || [],
    season: globalData?.season || [],
    top: globalData?.top || [],
    recommendations,
    recommendedBasedOn,
    recentHistory,
  };
}
