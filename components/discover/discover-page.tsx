"use client";

import Navbar from "@/components/shared/navbar";
import AnimeList from "@/components/shared/anime-list";
import { useState, useTransition, useEffect } from "react";
import DiscoverHero from "./discover-hero";
import { useTranslations, useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchRecommendations, getHeroData, getDiscoverLists } from "./actions";
import { Icon } from "@iconify/react";
import { AnimeListSkeleton } from "@/components/shared/anime-list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverPage() {
  const t = useTranslations("Discover");
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const [heroData, setHeroData] = useState<any[] | null>(null);
  const [listsData, setListsData] = useState<{
    popular: any[];
    top: any[];
    season: any[];
    recommendations: any[];
    recommendedBasedOn: string;
    recentHistory: any[];
  } | null>(null);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendedBasedOn, setRecommendedBasedOn] = useState("");

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

    async function loadHero() {
      try {
        const data = await getHeroData(locale);
        if (mounted) setHeroData(data);
      } catch (e) {
        console.error("Failed to load hero", e);
      }
    }

    async function loadLists() {
      try {
        const data = await getDiscoverLists();
        if (mounted) {
          setListsData(data);
          setRecommendations(data.recommendations);
          setRecommendedBasedOn(data.recommendedBasedOn);
        }
      } catch (e) {
        console.error("Failed to load lists", e);
      }
    }

    loadHero();
    loadLists();

    return () => {
      mounted = false;
    };
  }, [locale]);

  const handleRecommendationChange = (value: string) => {
    const selectedHistory = listsData?.recentHistory?.find(
      (h: any) => h.anime?.id.toString() === value || h.anime_id === value
    );
    if (!selectedHistory) return;

    const animeId = selectedHistory.anime?.id || selectedHistory.anime_id;
    const animeTitle =
      selectedHistory.anime?.title?.english ||
      selectedHistory.anime?.title?.romaji;

    setRecommendedBasedOn(animeTitle);

    startTransition(async () => {
      const newRecs = await fetchRecommendations(animeId);
      setRecommendations(newRecs);
    });
  };

  return (
    <div className="min-h-screen relative pb-10">
      <div className="absolute top-0 left-0 w-full z-50">
        <Navbar setSearch={setSearch} />
      </div>

      {/* Hero Section: Render real component or Skeleton */}
      {heroData ? (
        <DiscoverHero files={heroData} />
      ) : (
        <div className="w-full flex flex-col items-center gap-4 mb-10">
          <div className="relative w-full h-[90vh] overflow-hidden">
            <Skeleton className="absolute inset-0 w-full h-full" />
            <div className="relative z-10 w-full h-full flex flex-col justify-center px-4 md:px-12 pt-24 md:pt-40">
              <div className="max-w-3xl space-y-6">
                <Skeleton className="h-32 md:h-40 w-full max-w-[250px] mb-4" />
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-6 w-12 rounded" />
                  <Skeleton className="h-6 w-20 rounded" />
                </div>
                <div className="space-y-2 max-w-2xl">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
                  <Skeleton className="h-6 w-4/6" />
                </div>
                <div className="flex gap-4 pt-2">
                  <Skeleton className="h-12 w-40 rounded-lg" />
                  <Skeleton className="h-12 w-40 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lists Section: Render real lists or Skeletons */}
      <div className="flex flex-col gap-10 px-4 md:px-12 container mx-auto relative z-10">
        {/* Recommendations Logic - Wait for listsData */}
        {listsData ? (
          recommendations &&
          recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2">
                <Icon
                  icon="solar:stars-minimalistic-broken"
                  className="text-xl"
                />
                <h2 className="font-semibold uppercase whitespace-nowrap">
                  {t("becauseYouWatched")}:{"  "}
                  <span className="text-primary">{recommendedBasedOn}</span>
                </h2>
                {listsData.recentHistory &&
                  listsData.recentHistory.length > 0 && (
                    <Select
                      onValueChange={handleRecommendationChange}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-fit h-8 text-xs font-semibold uppercase tracking-wider border-none bg-secondary/50 hover:bg-secondary/80 transition-colors rounded-full px-4 ml-2">
                        <span>{t("change")}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {listsData.recentHistory.map((history: any) => {
                          const id = history.anime?.id || history.anime_id;
                          const title =
                            history.anime?.title?.english ||
                            history.anime?.title?.romaji ||
                            "Unknown";
                          return (
                            <SelectItem key={id} value={id.toString()}>
                              {title}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
              </div>
              <AnimeList animes={recommendations} title="" />
            </div>
          )
        ) : (
          <AnimeListSkeleton />
        )}

        {/* Global Lists - Wait for listsData OR render if heroData/partial data is somehow available? No, stick to listsData */}

        {/* Trending List (Reusing hero data if available? Or verify consistency with listsData? 
            Actually the original page rendered 'trending' list too.
            Wait, getHeroData returns "trendingWithLogos". 
            But getDiscoverLists returns... wait, I removed trending from getDiscoverLists return signature?
            Let's check actions.ts... I did!
            So the "Trending Now" list at the bottom should use 'heroData'!
        */}

        {heroData ? (
          <AnimeList
            title={t("trendingNow")}
            animes={heroData}
            icon="solar:graph-up-broken"
          />
        ) : (
          <AnimeListSkeleton />
        )}

        {listsData ? (
          <>
            <AnimeList
              title={t("popularSeason")}
              animes={listsData.season}
              icon="solar:calendar-broken"
            />
            <AnimeList
              title={t("allTimePopular")}
              animes={listsData.popular}
              icon="solar:fire-broken"
            />
            <AnimeList
              title={t("topRated")}
              animes={listsData.top}
              icon="solar:medal-ribbon-broken"
            />
          </>
        ) : (
          <>
            <AnimeListSkeleton />
            <AnimeListSkeleton />
            <AnimeListSkeleton />
          </>
        )}
      </div>
    </div>
  );
}
