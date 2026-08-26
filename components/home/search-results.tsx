"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { AnimeCard } from "../shared/anime-card";
import { useTranslations } from "next-intl";
import { useSettings } from "@/components/settings-context";

import { AdvancedFilters, hasActiveFilters } from "@/components/home/search-filters";

interface SearchResultsProps {
  search: string;
  filters?: AdvancedFilters;
}

const QUERY = `
query ($search: String, $page: Int, $perPage: Int, $genres: [String], $yearGreater: FuzzyDateInt, $yearLesser: FuzzyDateInt, $status: MediaStatus, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
    }
    media(search: $search, type: ANIME, sort: $sort, genre_in: $genres, startDate_greater: $yearGreater, startDate_lesser: $yearLesser, status: $status, isAdult: {ISADULT}) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        extraLarge
      }
      bannerImage
      averageScore
      popularity
      format
      startDate {
        year
      }
      episodes
      season
      seasonYear
      isAdult
    }
  }
}
`;

const PER_PAGE = 50;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const SearchResults: React.FC<SearchResultsProps> = ({ search, filters }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [isAdult, setIsAdult] = useState<boolean>(false);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [error, setError] = useState<boolean>(false);

  const t = useTranslations("Home");
  const { settings } = useSettings();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "0px 0px 500px 0px",
  });

  const fetchAnime = async (pageNum: number, isNewSearch: boolean) => {
    if (loading) return;
    setLoading(true);
    if (isNewSearch) setInitialLoading(true);

    try {
      const variables: any = {
        page: pageNum,
        perPage: PER_PAGE,
      };

      if (debouncedSearch && debouncedSearch.trim() !== "") {
        variables.search = debouncedSearch;
      }

      const activeFilter = filters ? hasActiveFilters(filters) : false;

      if (filters) {
        if (filters.genres && filters.genres.length > 0) {
          variables.genres = filters.genres;
        }
        if (filters.yearRange) {
          variables.yearGreater = filters.yearRange[0] * 10000;
          variables.yearLesser = (filters.yearRange[1] + 1) * 10000;
        }
        if (filters.status) {
          variables.status = filters.status;
        }
        
        let sortMode = filters.sort;
        if (sortMode === "SEARCH_MATCH" && !variables.search) {
          sortMode = "POPULARITY_DESC";
        }
        variables.sort = [sortMode];
      } else {
        variables.sort = variables.search ? ["SEARCH_MATCH"] : ["POPULARITY_DESC"];
      }

      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: QUERY.replace("{ISADULT}", isAdult ? "true" : "false"),
          variables,
        }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const pageData = data.data.Page;

      setResults((prevResults) =>
        isNewSearch ? pageData.media : [...prevResults, ...pageData.media],
      );
      setHasNextPage(pageData.pageInfo.hasNextPage);
    } catch (error) {
      console.error("Error fetching anime:", error);
      setError(true);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (inView && hasNextPage && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [inView, hasNextPage, loading]);

  useEffect(() => {
    if (!debouncedSearch && (!filters || !hasActiveFilters(filters))) {
      setResults([]);
      setPage(1);
      setHasNextPage(false);
      return;
    }

    setPage(1);
    setError(false);
    fetchAnime(1, true);
  }, [debouncedSearch, isAdult, filters]);

  useEffect(() => {
    if (page > 1 && (debouncedSearch || (filters && hasActiveFilters(filters)))) {
      fetchAnime(page, false);
    }
  }, [page]);

  const getMediaInfo = (anime: any) => {
    const format =
      anime.format === "TV"
        ? "Show"
        : anime.format === "MOVIE"
          ? "Movie"
          : anime.format;
    const year = anime.startDate?.year || anime.seasonYear || "N/A";
    return `${format} • ${year}`;
  };

  if (initialLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Icon icon="svg-spinners:ring-resize" className="text-2xl" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!search && (!filters || !hasActiveFilters(filters))) return null;

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-8 sm:px-12">
      <div className="w-full flex items-center justify-between">
        <h2 className="flex flex-row items-center gap-2 text-sm font-semibold tracking-wider">
          <Icon icon="solar:minimalistic-magnifer-linear" className="text-xl" />
          <span>{t("search")}</span>
        </h2>
        {/* adult mode toggle ONLY if nsfwmode is on*/}
        {settings.nsfwMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdult(!isAdult)}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={isAdult ? "Hide Adult" : "Show Adult"}
            >
              <Icon icon="uil:18-plus" className="text-xl" />

              <span className="hidden text-sm font-medium sm:inline">
                {isAdult ? "Hide Adult" : "Adult"}
              </span>
            </button>
          </div>
        )}
      </div>

      {error ? (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-4 text-center">
          <Icon icon="solar:sad-circle-broken" className="text-6xl text-destructive" />
          <div>
            <p className="text-xl font-semibold">Search Unavailable</p>
            <p className="text-muted-foreground">
              The AniList search API is currently turned down or rate limited. Please try again later.
            </p>
          </div>
        </div>
      ) : !results.length && (debouncedSearch || (filters && hasActiveFilters(filters))) && !initialLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <p className="text-lg text-gray-400">
            {debouncedSearch ? `No results found for "${debouncedSearch}".` : "No results found."}
          </p>
        </div>
      ) : (
        <>
          {/* 10. Framer Motion container */}
          <motion.div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {results.map((anime) => (
              // 11. Framer Motion item
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </motion.div>

          {/* 12. Sentinel and loading spinner for infinite scroll */}
          {hasNextPage && (
            <div
              ref={ref}
              className="flex w-full items-center justify-center py-10"
            >
              {loading && (
                <div className="flex items-center gap-3 text-gray-400">
                  <Icon icon="svg-spinners:ring-resize" className="text-2xl" />
                  <p className="text-lg">Loading more...</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
