"use client";

import Hero from "@/components/home/hero";
import Navbar from "@/components/shared/navbar";
import SearchResults from "@/components/home/search-results";
import { useState, useEffect } from "react";
import AnimeList from "@/components/shared/anime-list";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useSettings } from "@/components/settings-context";
import ScheduleSection from "./schedule-section";
import UserAnimeList from "@/components/home/user-anime-list";
import {
  AdvancedFilters,
  defaultFilters,
  hasActiveFilters,
} from "@/components/home/search-filters";

export default function HomePage({
  trendingAnime,
  popularAnime,
  thisSeasonAnime,
  topAnime,
  watched,
  todaySchedule,
}: {
  trendingAnime: any;
  popularAnime: any;
  thisSeasonAnime: any;
  topAnime: any;
  watched: any;
  todaySchedule?: any;
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdvancedFilters>(defaultFilters);
  const [greeting, setGreeting] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [isWobbling, setIsWobbling] = useState(false);

  const t = useTranslations("Home");
  const { data: session, status } = useSession();
  const { settings } = useSettings();
  const tShared = useTranslations("Shared");

  useEffect(() => {
    const time = new Date().getHours();
    let timeString = "";

    if (time < 12) {
      timeString = t("morning");
    } else if (time < 18) {
      timeString = t("afternoon");
    } else {
      timeString = t("tonight");
    }
    setGreeting(timeString);

    const placeholders = [t("placeholder"), t("placeholder2"), "67"];
    const randomPlaceholder =
      placeholders[Math.floor(Math.random() * placeholders.length)];
    setPlaceholder(randomPlaceholder);
  }, [t]);

  useEffect(() => {
    if (search === "67") {
      setIsWobbling(true);
      const timer = setTimeout(() => setIsWobbling(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setIsWobbling(false);
    }
  }, [search]);

  return (
    <>
      {isWobbling && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes wobble67 {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-4deg); }
            75% { transform: rotate(4deg); }
          }
          .wobble-active {
            animation: wobble67 0.4s ease-in-out infinite;
            transform-origin: 50% 50vh;
          }
        ` }} />
      )}
      <main
        className={`relative min-h-screen bg-background overflow-x-hidden ${isWobbling ? "wobble-active" : ""}`}
      >
      <div className="before:border-border after:border-border relative z-10 min-h-screen snap-start before:absolute before:top-0 before:left-0 before:h-full before:w-5 before:border-r before:bg-[linear-gradient(-135deg,var(--color-border)_25%,transparent_25%,transparent_50%,var(--color-border)_50%,var(--color-border)_75%,transparent_75%,transparent)] before:bg-size-[5px_5px] after:absolute after:top-0 after:right-0 after:h-full after:w-5 after:border-l after:bg-[linear-gradient(135deg,var(--color-border)_25%,transparent_25%,transparent_50%,var(--color-border)_50%,var(--color-border)_75%,transparent_75%,transparent)] after:bg-size-[5px_5px] max-md:before:hidden max-md:after:hidden md:px-8 flex flex-col items-center gap-8 overflow-hidden">
        <div className="relative w-full max-w-full overflow-hidden">
          <div className="absolute top-0 left-0 w-full z-110">
            <Navbar setSearch={setSearch} />
          </div>
          <Hero
            search={search}
            setSearch={setSearch}
            filters={filters}
            setFilters={setFilters}
            greeting={greeting || t("viva")}
            placeholder={placeholder}
          />
        </div>
        {/* if search or active filters then show search results component, or else show other */}
        {search || hasActiveFilters(filters) ? (
          <SearchResults search={search} filters={filters} />
        ) : (
          <div className="flex flex-col gap-5 w-full max-w-[1600px] min-[1921px]:max-w-full pb-10 px-4 sm:px-12">
            {settings.homepageLayout.map((section) => {
              switch (section) {
                case "watched":
                  return (
                    <AnimeList
                      key={section}
                      title={t("watched")}
                      animes={watched || []}
                      icon="solar:clock-circle-broken"
                      watched={true}
                    />
                  );
                case "schedule":
                  return (
                    todaySchedule &&
                    todaySchedule.length > 0 && (
                      <ScheduleSection key={section} schedule={todaySchedule} />
                    )
                  );
                case "trending":
                  return (
                    <AnimeList
                      key={section}
                      title={t("trending")}
                      animes={trendingAnime}
                      icon="solar:graph-up-broken"
                    />
                  );
                case "popular":
                  return (
                    <AnimeList
                      key={section}
                      title={t("popular")}
                      animes={popularAnime}
                      icon="solar:fire-broken"
                    />
                  );
                case "season":
                  return (
                    <AnimeList
                      key={section}
                      title={t("season")}
                      animes={thisSeasonAnime}
                      icon="solar:calendar-broken"
                    />
                  );
                case "top":
                  return (
                    <AnimeList
                      key={section}
                      title={t("top")}
                      animes={topAnime}
                      icon="solar:medal-ribbon-broken"
                    />
                  );
                case "PLANNING":
                case "COMPLETED":
                case "DROPPED":
                case "PAUSED":
                case "REPEATING":
                case "CURRENT":
                  return (
                    <UserAnimeList
                      key={section}
                      status={section as any}
                      title={tShared(section.toLowerCase())}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>
        )}
      </div>
    </main>
    </>
  );
}
