"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi, // Import CarouselApi type
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EpisodeCard } from "@/components/shared/episode-card";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";

interface EpisodeListProps {
  episodes: any[];
  anime: any | null;
  backdrop_path?: string;
  episodeNumber?: number;
  progress?: number;
  containerRef?: any;
}

const EPISODE_RANGE_SIZE = 50;

const timeLeft = (time: number) => {
  const now = Date.now();
  const airingTime = time * 1000;
  const diff = airingTime - now;

  if (diff <= 0) {
    return "Already aired";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const formattedTime = `${days > 0 ? days + "d " : ""}${
    hours > 0 ? hours + "h " : ""
  }${minutes > 0 ? minutes + "m" : ""}`.trim();

  return formattedTime;
};

const EpisodeList: React.FC<EpisodeListProps> = ({
  episodes,
  anime,
  backdrop_path,
  episodeNumber = -1,
  progress = -1,
  containerRef = null,
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("AnimeDialog");
  const router = useRouter();

  const initialRangeIndex = useMemo(() => {
    if (episodeNumber <= 0 || episodes.length === 0) return 0;
    const index = Math.floor((episodeNumber - 1) / EPISODE_RANGE_SIZE);
    const maxIndex = Math.floor((episodes.length - 1) / EPISODE_RANGE_SIZE);
    return Math.min(index, maxIndex);
  }, [episodeNumber, episodes.length]);

  const [selectedRange, setSelectedRange] = useState(initialRangeIndex);

  const episodeRanges = useMemo(() => {
    const ranges = [];
    for (let i = 0; i < episodes.length; i += EPISODE_RANGE_SIZE) {
      const start = i + 1;
      const end = Math.min(i + EPISODE_RANGE_SIZE, episodes.length);
      ranges.push({
        label: `${start}-${end}`,
        start: i,
        end,
      });
    }
    return ranges;
  }, [episodes]);

  const filteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return episodes.filter((episode, index) => {
      const episodeNum = index + 1;
      const episodeTitle = episode.name?.toLowerCase() || "";

      return (
        episodeNum.toString().includes(query) || episodeTitle.includes(query)
      );
    });
  }, [episodes, searchQuery]);

  const handleRangeChange = (index: number) => {
    setSelectedRange(index);
    setHasScrolled(false);
  };

  const handleEpisodeSelect = (episodeIndex: number) => {
    const rangeIndex = Math.floor(episodeIndex / EPISODE_RANGE_SIZE);
    setSelectedRange(rangeIndex);
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/watch/${anime.id}/${episodeIndex + 1}`);
  };

  const currentEpisodes = useMemo(() => {
    if (episodeRanges.length === 0) {
      return [];
    }
    const range = episodeRanges[selectedRange];
    if (!range) return episodes.slice(0, EPISODE_RANGE_SIZE);
    return episodes.slice(range.start, range.end);
  }, [episodes, selectedRange, episodeRanges]);

  useEffect(() => {
    if (episodeNumber > 0 && episodes.length > 0) {
      const targetRangeIndex = Math.floor(
        (episodeNumber - 1) / EPISODE_RANGE_SIZE
      );
      const maxIndex = Math.floor((episodes.length - 1) / EPISODE_RANGE_SIZE);
      const validIndex = Math.min(targetRangeIndex, maxIndex);

      if (validIndex !== selectedRange) {
        setSelectedRange(validIndex);
        setHasScrolled(false);
      }
    }
  }, [episodeNumber, episodes.length, selectedRange]);

  useEffect(() => {
    if (
      !api ||
      hasScrolled ||
      episodeNumber <= 0 ||
      episodeRanges.length === 0
    ) {
      return;
    }

    const targetRangeIndex = Math.floor(
      (episodeNumber - 1) / EPISODE_RANGE_SIZE
    );

    if (selectedRange === targetRangeIndex) {
      const range = episodeRanges[targetRangeIndex];
      if (range) {
        const targetSlideIndex = episodeNumber - 1 - range.start;

        if (
          targetSlideIndex >= 0 &&
          targetSlideIndex < currentEpisodes.length
        ) {
          const timer = setTimeout(() => {
            if (api.scrollSnapList().length > targetSlideIndex) {
              api.scrollTo(targetSlideIndex, false);
              setHasScrolled(true);
            }
          }, 100);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [
    api,
    hasScrolled,
    episodeNumber,
    episodeRanges,
    selectedRange,
    currentEpisodes.length,
  ]);

  return (
    <div className="flex w-full flex-col mt-4">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: false,
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 pb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {t("episodes")}
            </h3>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 bg-transparent"
                >
                  <Icon icon="solar:magnifer-linear" className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" containerRef={containerRef}>
                <div className="space-y-3">
                  <Input
                    placeholder="Search by number or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery.trim() && (
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {filteredEpisodes.length > 0 ? (
                        filteredEpisodes.map((episode, index) => {
                          const episodeNum = episodes.indexOf(episode) + 1;
                          return (
                            <button
                              key={`${episode.id}-${index}`}
                              onClick={() =>
                                handleEpisodeSelect(episodes.indexOf(episode))
                              }
                              className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm transition-colors"
                            >
                              <div className="font-medium">
                                Ep. {episodeNum}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {episode.name || "No title"}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          No episodes found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-center items-center gap-2 mt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="static top-1/2 -translate-y-1/2 h-[32px] bg-card shadow-l flex flex-row gap-1"
                  variant="outline"
                >
                  <span>
                    {episodeRanges[selectedRange]?.label || "Episodes"}
                  </span>
                  <Icon icon="solar:sort-vertical-linear" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {episodeRanges.map((range, index) => (
                  <DropdownMenuItem
                    key={range.label}
                    onSelect={() => handleRangeChange(index)}
                  >
                    {range.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <CarouselPrevious className="static border-border bg-background/80 backdrop-blur-sm hover:bg-accent shadow-l" />
            <CarouselNext className="static border-border bg-background/80 backdrop-blur-sm hover:bg-accent shadow-l" />
          </div>
        </div>

        <CarouselContent>
          {currentEpisodes.map((episode, index) => {
            // We need the *overall* episode number, not the index of the current page
            const overallEpisodeNumber =
              (episodeRanges[selectedRange]?.start || 0) + index + 1;
            return (
              <CarouselItem
                key={`${episode.id}-${index}`}
                className="basis-full pl-2 md:basis-1/4"
              >
                <EpisodeCard
                  anime={anime}
                  episode={episode}
                  progress={progress}
                  backdrop_path={backdrop_path}
                />
              </CarouselItem>
            );
          })}
          {/* if anime AND nextairing then add a card showing when it will come */}
          {anime?.nextAiringEpisode && (
            <CarouselItem className="basis-full pl-2 md:basis-1/4">
              <motion.div
                variants={{
                  hidden: { scale: 0.8, opacity: 0 },
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
                className="group relative flex cursor-pointer flex-col gap-2 rounded-xl p-2 transition-all duration-300 hover:scale-95 hover:bg-accent"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg transition-transform duration-300 ease-out group-hover:shadow-2xl">
                  {/* instead of image, a div with accent bg */}
                  <img
                    src={`${backdrop_path || anime.coverImage.extraLarge}`}
                    alt={anime.title.romaji}
                    className="h-full w-full object-cover opacity-30 blur-[2px]"
                  />
                  {/* show as if it is unlocking in sometime */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute right-2 top-2 rounded bg-background/60 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                    {`E${anime.nextAiringEpisode?.episode}`}
                  </div>
                  <div className="absolute bottom-2 left-2 rounded bg-background/60 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                    {t("airs-in", {
                      time: timeLeft(anime.nextAiringEpisode?.airingAt),
                    })}
                  </div>
                  {/* lock icon center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      icon="solar:lock-keyhole-minimalistic-bold"
                      className="text-4xl rounded-full p-2 bg-accent/70"
                    />
                  </div>
                </div>
                {/* <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
                      {t("nextEpisode")}
                    </h3>
                  </div>
      *         </div> */}
              </motion.div>
            </CarouselItem>
          )}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default EpisodeList;
