"use client";

import { Icon } from "@iconify/react";
import type React from "react";
// Import useEffect and useCallback
import { useState, useEffect, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useSession } from "next-auth/react";
import { AnimeCard } from "@/components/shared/anime-card";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XIcon } from "lucide-react";
import { getAllProgress, removeProgressEntry } from "./action";
import { ListEditor } from "./list-editor";
import { cn } from "@/lib/utils";
import { AnimeListSkeleton } from "./anime-list-skeleton";

interface AnimeListProps {
  title: string;
  icon?: string;
  animes: any[];
  watched?: boolean;
  className?: string;
}

const AnimeList: React.FC<AnimeListProps> = ({
  animes,
  title,
  icon,
  watched = false,
  className,
}) => {
  // If watched={true}, start with an empty array. We will fetch data.
  // Otherwise, use the 'animes' prop.
  const [watchedAnime, setWatchedAnime] = useState<any[]>(
    watched ? (animes && animes.length > 0 ? animes : []) : animes,
  );
  const [currentFilter, setCurrentFilter] = useState("realms");
  const [isEditMode, setIsEditMode] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 640;

  const [hasRealmsHistory, setHasRealmsHistory] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(
    watched && animes && animes.length > 0,
  );

  // Wrap fetchWatchedAnime in useCallback
  const fetchWatchedAnime = useCallback(
    async (filter: string) => {
      console.log(`Fetching watched anime for ${filter}`);
      setCurrentFilter(filter);
      setIsEditMode(false);

      if (filter === "realms") {
        if (session?.user?.name) {
          const progress = await getAllProgress(session.user.name);
          setWatchedAnime(progress.reverse());
        } else {
          let progressData = localStorage.getItem("anime-progress");
          if (progressData) {
            let progress = JSON.parse(progressData);
            const transformedData = progress.map(([key, value]) => {
              const [anime_id, episode_id] = key.split("-").map(Number);
              return {
                anime_id: anime_id,
                episode_id: episode_id,
                progress: value.progress,
                duration: value.duration,
                anime: value.anime,
                timestamp: { $date: "1970-01-01T00:00:00.000Z" },
              };
            });
            setWatchedAnime(transformedData);
          } else {
            setWatchedAnime([]);
          }
        }
      } else if (filter === "anilist") {
        const userName = session?.user?.name;
        console.log(`Fetching watched anime for ${userName}`);
        if (!userName) {
          setWatchedAnime([]); // Set to empty if no user
          return;
        }
        const resp = await fetch("https://graphql.anilist.co/", {
          next: { revalidate: 0 },
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            query: `
             query ($username: String) {
               MediaListCollection(userName: $username, type: ANIME, status: CURRENT, sort: UPDATED_TIME_DESC) {
                 lists {
                   entries {
                     id
                     mediaId
                     progress
                     media {
                       id
                       title {
                         english
                         romaji
                       }
                       duration
                       episodes
                       coverImage {
                         extraLarge
                         large
                       }
                       format
                       seasonYear
                       isAdult
                     }
                   }
                 }
               }
             }
           `,
            variables: {
              username: userName,
            },
          }),
        });
        const data = await resp.json();
        const lists = data?.data?.MediaListCollection?.lists;
        let animeList = lists?.[0]?.entries || [];
        // match structure of ours
        animeList = animeList.map((anime) => ({
          id: anime.id,
          anime_id: anime.mediaId,
          progress: 0, // progress here is time, which we dont have
          duration: 0,
          episode_id: anime.progress + 1,
          anime: anime.media,
        }));
        setWatchedAnime(animeList);
      }
    },
    [session],
  );

  useEffect(() => {
    if (!watched || status === "loading" || initialCheckDone) {
      return;
    }

    const checkAndFetch = async () => {
      let hasHistory = false;
      if (session?.user?.name) {
        // Logged in: Check DB
        const progress = await getAllProgress(session.user.name);
        hasHistory = progress.length > 0;
      } else {
        // Logged out: Check localStorage
        const progressData = localStorage.getItem("anime-progress");
        if (progressData) {
          const progress = JSON.parse(progressData);
          hasHistory = progress.length > 0;
        }
      }

      // Update state to show/hide the "Realms" option
      setHasRealmsHistory(hasHistory);

      if (hasHistory) {
        // Has Realms/local history, load it as default
        fetchWatchedAnime("realms");
      } else if (session?.user?.name) {
        // No Realms history, but IS logged in. Default to AniList.
        fetchWatchedAnime("anilist"); // This function also sets currentFilter
      } else {
        // No Realms history, NOT logged in. Load "realms" (which will be empty)
        fetchWatchedAnime("realms");
      }

      // Mark the initial check as complete so it doesn't run again
      setInitialCheckDone(true);
    };

    checkAndFetch();
  }, [watched, status, session, initialCheckDone, fetchWatchedAnime]);

  // Wrap handleRemoveAnime in useCallback
  const handleRemoveAnime = useCallback(
    async (anime: any) => {
      console.log("removing anime object:", anime);
      if (session?.user?.name) {
        await removeProgressEntry(
          session.user.name,
          anime.anime_id,
          anime.episode_id,
        );
        const newProgress = await getAllProgress(session.user.name);
        setWatchedAnime(newProgress.reverse());
      } else {
        let currentHistory = localStorage.getItem("anime-progress");
        let currentHistoryParsed = currentHistory
          ? JSON.parse(currentHistory)
          : [];
        let filteredHistory = currentHistoryParsed.map(([key, value]) => {
          const [anime_id, episode_id] = key.split("-").map(Number);

          if (anime_id !== anime.anime_id || episode_id !== anime.episode_id) {
            return [key, value];
          } else {
            return null;
          }
        });
        filteredHistory = filteredHistory.filter((item) => item !== null);
        localStorage.setItem("anime-progress", JSON.stringify(filteredHistory));
        let progress = filteredHistory;
        const transformedData = progress.map(([key, value]) => {
          const [anime_id, episode_id] = key.split("-").map(Number);

          return {
            anime_id: anime_id,
            episode_id: episode_id,
            progress: value.progress,
            duration: value.duration,
            anime: value.anime,
            timestamp: { $date: "1970-01-01T00:00:00.000Z" },
          };
        });
        setWatchedAnime(transformedData);
      }
    },
    [session],
  );

  if (watched && (status === "loading" || !initialCheckDone)) {
    return <AnimeListSkeleton className={className} />;
  }

  if (
    (watched && watchedAnime.length === 0) ||
    (!watched && animes.length === 0)
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full min-w-[90vw] max-w-[90vw] min-[1921px]:min-w-full min-[1921px]:max-w-full flex-col gap-6 py-0",
        className,
      )}
    >
      <h2 className="flex w-full flex-row items-center justify-between gap-2 text-sm tracking-wider">
        <div className="flex flex-row items-center gap-2">
          {icon && <Icon icon={icon} className="text-xl" />}
          {title && <span className="font-semibold uppercase">{title}</span>}
          {watched && session?.user && (
            <Select
              onValueChange={fetchWatchedAnime}
              // Set value to make it a controlled component
              value={currentFilter}
            >
              <SelectTrigger className="bg-popover">
                <SelectValue
                  className="bg-popover focus:outline-none"
                  placeholder="Realms"
                />
              </SelectTrigger>
              <SelectContent>
                {/* Conditionally render the "Realms" option */}
                {hasRealmsHistory && (
                  <SelectItem className="focus:outline-none" value="realms">
                    Realms
                  </SelectItem>
                )}
                <SelectItem className="focus:outline-none" value="anilist">
                  AniList
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {watched && currentFilter === "realms" && (
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={isEditMode ? "Done editing" : "Edit list"}
          >
            <Icon
              icon={isEditMode ? "solar:check-circle-bold" : "solar:pen-bold"}
              className="text-xl"
            />
            {isEditMode && (
              <span className="hidden text-sm font-medium sm:inline">
                Done Editing
              </span>
            )}
          </button>
        )}
      </h2>

      <Carousel
        opts={{
          align: "start",
          loop: false,
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {watched
            ? watchedAnime.map((anime, index) => (
                <CarouselItem
                  key={`${anime.id || anime.anime_id}-${index}`} // Use a more stable key
                  className={`basis-[45%] sm:basis-[30%] md:basis-[23%] lg:basis-[18%] xl:basis-[15%] min-[1921px]:basis-[12.5%] rounded-xl pl-2 ${
                    isEditMode
                      ? "cursor-default animate-wiggle"
                      : "cursor-pointer"
                  }`}
                >
                  <motion.div
                    variants={{
                      hidden: ({ index, isDesktop }) => {
                        if (index == null) return { scale: 0.8, opacity: 0 };
                        const shouldStartVisible =
                          (isDesktop && index < 7) || (!isDesktop && index < 3);
                        if (shouldStartVisible) {
                          return { scale: 1, opacity: 1 };
                        }
                        return { scale: 0.8, opacity: 0 };
                      },
                      visible: {
                        scale: 1,
                        opacity: 1,
                        transition: {
                          type: "easeOut",
                          stiffness: 100,
                          damping: 15,
                          duration: 0.3,
                        },
                      },
                    }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    onClick={() =>
                      !isEditMode &&
                      router.push(
                        `/watch/${anime.anime_id}/${anime.episode_id}`,
                      )
                    }
                    custom={{ index, isDesktop }}
                    className={`group relative flex flex-col gap-2 rounded-xl p-2 transition-all duration-300 hover:scale-95 hover:bg-accent`}
                  >
                    <div className="relative aspect-[2/3] overflow-hidden rounded-lg transition-transform duration-300 ease-out group-hover:shadow-2xl">
                      <img
                        src={
                          anime.anime.coverImage.extraLarge ||
                          anime.anime.coverImage.large ||
                          "/placeholder.svg"
                        }
                        alt={
                          anime.anime.title.english || anime.anime.title.romaji
                        }
                        className={`h-full w-full object-cover ${
                          isEditMode ? "opacity-30" : "opacity-100"
                        }`}
                      />
                      <ListEditor
                        mediaId={anime.anime.id}
                        onSaveSuccess={() => {
                          console.log("Data saved!");
                        }}
                      >
                        <button
                          className="absolute left-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground opacity-0 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-accent group-hover:opacity-100 z-10"
                          aria-label="Editor"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon icon="solar:pen-bold" className="text-xl" />
                        </button>
                      </ListEditor>
                      <div className="absolute right-2 top-2 rounded bg-background/60 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                        {currentFilter === "anilist" && anime.anime.episodes
                          ? `E${anime.episode_id - 1}/${anime.anime.episodes}`
                          : `E${anime.episode_id}`}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent z-[5]" />
                      {/* Only show progress bar for Realms data */}
                      {currentFilter === "realms" && (
                        <Progress
                          value={(anime.progress / anime.duration) * 100}
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] z-10 h-1"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      {isEditMode && currentFilter === "realms" && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAnime(anime);
                            }}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-foreground shadow-lg transition-transform hover:scale-110"
                            aria-label="Remove anime"
                          >
                            <XIcon className="text-2xl" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
                          {anime.anime.title.english ||
                            anime.anime.title.romaji}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {anime.anime.format} • {anime.anime.seasonYear || "N/A"}
                      </p>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))
            : animes.map((anime, index) => (
                <CarouselItem
                  key={`${anime.id}-${index}`}
                  className="basis-[45%] pl-2 sm:basis-[30%] md:basis-[23%] lg:basis-[18%] xl:basis-[15%] min-[1921px]:basis-[12.5%]"
                >
                  <AnimeCard index={index} anime={anime} />
                </CarouselItem>
              ))}
        </CarouselContent>

        <CarouselPrevious className="-left-4 size-10 border-border bg-background/80 backdrop-blur-sm hover:bg-accent sm:-left-6" />
        <CarouselNext className="-right-4 size-10 border-border bg-background/80 backdrop-blur-sm hover:bg-accent sm:-right-6" />
      </Carousel>
    </div>
  );
};

export default AnimeList;
