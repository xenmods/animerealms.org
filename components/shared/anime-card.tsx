"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, XIcon } from "lucide-react";
import {
  getEpisodesAnilist,
  getTitleLogoAnilist,
} from "@/components/shared/action";
import EpisodeList from "@/components/shared/episode-list";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAnilist } from "@/lib/hooks/use-anilist";
import { Link } from "@/i18n/navigation";
import { ListEditor } from "./list-editor";
import { useSettings } from "@/components/settings-context";

interface AnimeDetails {
  id: number;
  title: {
    english: string | null;
    romaji: string;
    native: string;
  };
  description: string;
  bannerImage: string | null;
  coverImage: {
    extraLarge: string;
    large: string;
    color: string | null;
  };
  genres: string[];
  episodes: number | null;
  duration: number | null;
  status: string;
  seasonYear: number | null;
  averageScore: number | null;
  format: string;
  studios: {
    nodes: Array<{ name: string }>;
  };
}

export function AnimeCard({
  index = null,
  anime,
  children,
}: {
  index?: number | null;
  anime: any;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [animeDetails, setAnimeDetails] = useState<AnimeDetails | null>(null);
  const [episodes, setEpisodes] = useState([]);
  const [titleLogo, setTitleLogo] = useState("");
  const [banner, setBanner] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("NONE");

  const locale = useLocale();
  const t = useTranslations("AnimeDialog");
  const { data: session } = useSession();
  const { getProgress } = useAnilist();
  const { settings } = useSettings();
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 640;

  if (!settings.nsfwMode && anime?.isAdult) {
    return null;
  }

  const fetchAnimeDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const query = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            title {
              english
              romaji
              native
            }
            description
            bannerImage
            coverImage {
              extraLarge
              large
              color
            }
            nextAiringEpisode { airingAt timeUntilAiring episode }
            genres
            episodes
            duration
            status
            seasonYear
            averageScore
            popularity
            trailer { id site thumbnail }
            format
            studios {
              nodes {
                name
              }
            }
          }
        }
      `;

      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { id },
        }),
      });

      const data = await response.json();
      setAnimeDetails(data.data.Media);
      document.title =
        data.data.Media.title.english || data.data.Media.title.romaji;
    } catch (error) {
      console.error("[v0] Error fetching anime details:", error);
      setAnimeDetails({
        id: anime.id,
        title: anime.title,
        description:
          anime.description ||
          "AniList API is currently experiencing issues. Full description and details cannot be loaded.",
        bannerImage: anime.bannerImage || null,
        coverImage: anime.coverImage,
        genres: anime.genres || [],
        episodes: anime.episodes || null,
        duration: anime.duration || null,
        status: anime.status || "UNKNOWN",
        seasonYear: anime.seasonYear || null,
        averageScore: anime.averageScore || null,
        popularity: anime.popularity || 0,
        trailer: anime.trailer || null,
        format: anime.format || "UNKNOWN",
        studios: anime.studios || { nodes: [] },
      });
      document.title = anime.title.english || anime.title.romaji;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEpisodes = async (id: number) => {
    setEpisodesLoading(true);
    const eps = await getEpisodesAnilist(id);
    setEpisodes(eps);
    setEpisodesLoading(false);
  };

  const fetchTitleLogo = async (title: string) => {
    const { logo, backdrop } = await getTitleLogoAnilist(title, locale);
    setTitleLogo(logo);
    setBanner(backdrop);
  };

  const fetchProgress = async (id: number) => {
    if (!session) return;
    const { progress, status } = await getProgress(id);
    setProgress(progress);
    setStatus(status);
  };

  const handleCardClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsOpen(true);
    fetchAnimeDetails(anime.id);
    fetchTitleLogo(anime.id);
    fetchEpisodes(anime.id);
    fetchProgress(anime.id);
  };

  return (
    <>
      {children ? (
        <div onClick={handleCardClick} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <motion.div
          variants={{
            // on desktop if index is < 7 dont keep it hidden, on mobile if index is < 3 dont keep it hidden
            hidden: ({ index, isDesktop }) => {
              if (index == null) return { scale: 0.8, opacity: 0 };

              const shouldStartVisible =
                (isDesktop && index < 7) || (!isDesktop && index < 3);

              if (shouldStartVisible) {
                // If it should start visible, its "hidden" state is the
                // same as the "visible" state, so it won't animate.
                return { scale: 1, opacity: 1 };
              }

              // Otherwise, use the normal "hidden" state for animating in.
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
          onClick={handleCardClick}
          custom={{ index, isDesktop }}
          className="group relative flex cursor-pointer flex-col gap-2 rounded-xl p-2 transition-all duration-300 hover:scale-95 hover:bg-accent"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg transition-transform duration-300 ease-out group-hover:shadow-2xl">
            <img
              src={anime.coverImage.extraLarge || anime.coverImage.large}
              alt={anime.title.english || anime.title.romaji}
              className="h-full w-full object-cover"
            />
            <ListEditor
              mediaId={anime.id}
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
            {anime.format === "TV" && anime.episodes && (
              <div className="absolute right-2 top-2 rounded bg-background/60 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                {`E${anime.episodes}`}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
                {anime.title.english || anime.title.romaji}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {anime.format} • {anime.seasonYear || "N/A"}
            </p>
          </div>
        </motion.div>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            document.title = "Anime Realms";
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          id="anime-dialog"
          className="min-w-[95vw] min-h-[95vh] sm:min-w-[90vw] sm:min-h-[95vh] sm:max-h-[95vh] p-0 overflow-hidden bg-background border-border rounded-2xl my-2 focus:outline-none focus-visible:outline-none"
        >
          <DialogTitle className="sr-only">
            {animeDetails?.title.english ||
              animeDetails?.title.romaji ||
              "Anime Details"}
          </DialogTitle>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-[80vh]"
              >
                <div className="flex flex-col items-center gap-4">
                  <Icon
                    icon="svg-spinners:ring-resize"
                    className="text-5xl text-primary"
                  />
                  <p className="text-muted-foreground">{t("loadinganime")}</p>
                </div>
              </motion.div>
            ) : animeDetails ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="overflow-auto max-h-[90vh] no-scrollbar"
              >
                {/* Banner Section */}
                <div className="relative h-[50vh] min-h-[400px] sm:min-h-[500px]">
                  {animeDetails ? (
                    banner ? (
                      <img
                        src={banner}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={
                          animeDetails.bannerImage ||
                          // Use optional chaining here
                          animeDetails.coverImage?.extraLarge ||
                          "/placeholder.svg"
                        }
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    // Removed the extra } here
                    <div className="w-full h-full bg-accent" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>

                {/* Content Section */}
                <div className="px-4 sm:px-8 pb-8 -mt-32 sm:-mt-50 relative z-10 w-full">
                  <div className="flex gap-6 flex-col md:flex-row items-center sm:items-start w-full">
                    {/* Info Section */}
                    <div className="flex-1 flex flex-col gap-4 items-start min-w-0 w-full">
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {titleLogo !== null ? (
                          <img
                            src={titleLogo || null}
                            className="max-w-[16rem] md:max-w-[20rem] lg:max-w-[30rem] max-h-[12rem] object-contain drop-shadow-xl bg-transparent"
                          />
                        ) : (
                          <div className="flex flex-row gap-4 items-end">
                            <div>
                              <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-2 text-left line-clamp-2">
                                {animeDetails.title.english ||
                                  animeDetails.title.romaji}
                              </h2>
                              {animeDetails.title.native && (
                                <p className="text-lg sm:text-xl text-muted-foreground mb-4 text-left line-clamp-2">
                                  {animeDetails.title.romaji}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                      {/* Stats */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-2 text-sm items-center justify-start"
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <svg
                            className="w-6 h-auto"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            preserveAspectRatio="xMidYMid"
                            viewBox="0 0 172 172"
                          >
                            <defs>
                              <style
                                dangerouslySetInnerHTML={{
                                  __html:
                                    "\n      .cls-1 {\n        fill: #02a9ff;\n      }\n\n      .cls-1, .cls-2 {\n        fill-rule: evenodd;\n      }\n\n      .cls-2 {\n        fill: #fefefe;\n      }\n    ",
                                }}
                              />
                            </defs>
                            <g>
                              <path
                                d="M111.322,111.157 L111.322,41.029 C111.322,37.010 109.105,34.792 105.086,34.792 L91.365,34.792 C87.346,34.792 85.128,37.010 85.128,41.029 C85.128,41.029 85.128,56.337 85.128,74.333 C85.128,75.271 94.165,79.626 94.401,80.547 C101.286,107.449 95.897,128.980 89.370,129.985 C100.042,130.513 101.216,135.644 93.267,132.138 C94.483,117.784 99.228,117.812 112.869,131.610 C112.986,131.729 115.666,137.351 115.833,137.351 C131.170,137.351 148.050,137.351 148.050,137.351 C152.069,137.351 154.286,135.134 154.286,131.115 L154.286,117.394 C154.286,113.375 152.069,111.157 148.050,111.157 L111.322,111.157 Z"
                                className="cls-1"
                              />
                              <path
                                d="M54.365,34.792 L18.331,137.351 L46.327,137.351 L52.425,119.611 L82.915,119.611 L88.875,137.351 L116.732,137.351 L80.836,34.792 L54.365,34.792 ZM58.800,96.882 L67.531,68.470 L77.094,96.882 L58.800,96.882 Z"
                                className="cls-2"
                              />
                            </g>
                          </svg>
                          <p className="text-muted-foreground font-semibold">
                            {animeDetails.averageScore
                              ? (animeDetails?.averageScore / 10).toFixed(1)
                              : "N/A"}{" "}
                            ({animeDetails.popularity.toLocaleString()})
                          </p>
                        </div>

                        <p className="text-muted-foreground font-semibold">•</p>

                        <p className="text-muted-foreground font-semibold">
                          {animeDetails.seasonYear}
                        </p>

                        <p className="text-muted-foreground font-semibold">•</p>

                        <p className="text-muted-foreground font-semibold">
                          {animeDetails.format}
                        </p>
                      </motion.div>
                      {/* play button */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-row items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-4">
                          <Link
                            href={`/watch/${animeDetails.id}/${
                              status != "COMPLETED" ? progress + 1 : 1
                            }`}
                          >
                            <Button className="flex flex-row gap-2 px-3 py-1.5 sm:px-8 sm:py-4 text-lg hover:scale-95 transition-all duration-200 cursor-pointer ring-3 ring-accent">
                              <Icon icon="solar:play-bold" />
                              <span>{t(status)}</span>
                            </Button>
                          </Link>
                          {/* trailer button if it exists AND is youtube, if yes, a dialog that opens iframe  */}
                          {animeDetails.trailer?.site === "youtube" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  className="text-lg rounded-full p-1 bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-95 transition-all duration-200 cursor-pointer"
                                  variant={"ghost"}
                                >
                                  <Icon icon="solar:videocamera-linear" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent
                                showCloseButton={false}
                                className="aspect-video min-w-[90vw] sm:min-w-[85vw] sm:max-h-[90vh] p-0 overflow-hidden bg-background border-border rounded-2xl my-2"
                              >
                                <iframe
                                  className="w-full aspect-video rounded-2xl"
                                  src={`https://www.youtube.com/embed/${animeDetails.trailer.id}`}
                                  title="YouTube video player"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media;
                                  gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                                <DialogClose asChild>
                                  <button className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground opacity-100 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-accent cursor-pointer z-[100]">
                                    <XIcon className="h-6 w-6" />
                                  </button>
                                </DialogClose>
                              </DialogContent>
                            </Dialog>
                          )}
                          {/* share button */}
                          <Button
                            className="text-lg rounded-full p-1 bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-95 transition-all duration-200 cursor-pointer"
                            variant={"ghost"}
                          >
                            <Icon icon="solar:square-share-line-linear" />
                          </Button>
                        </div>
                        <ListEditor
                          mediaId={animeDetails.id}
                          onSaveSuccess={() => {
                            console.log("Data saved!");
                          }}
                        >
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 text-muted-foreground"
                          >
                            <span className="hidden sm:block">
                              {t(`${status}_LIST`)}
                            </span>
                            {status == "NONE" ? (
                              <Plus className="w-3 h-3" />
                            ) : (
                              <Icon icon="solar:pen-bold" className="w-3 h-3" />
                            )}
                          </Button>
                        </ListEditor>
                      </motion.div>

                      {/* Description */}
                      {animeDetails.description && (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="mt-4 w-full"
                        >
                          <h3 className="text-lg font-semibold mb-2 text-foreground">
                            {t("synopsis")}
                          </h3>
                          <div
                            className="text-sm text-muted-foreground leading-relaxed break-words"
                            dangerouslySetInnerHTML={{
                              __html: animeDetails.description.replace(
                                /<br>/g,
                                "<br />",
                              ),
                            }}
                          />
                        </motion.div>
                      )}
                      {/* Genres */}
                      {animeDetails.genres.length > 0 && (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex flex-wrap gap-2 items-center justify-start"
                        >
                          {animeDetails.genres.map((genre) => (
                            <span
                              key={genre}
                              className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium"
                            >
                              {genre}
                            </span>
                          ))}
                        </motion.div>
                      )}
                      {/* episodes carousel */}
                      {episodesLoading ? (
                        <div className="flex flex-col items-center gap-4 w-full">
                          <Icon
                            icon="svg-spinners:ring-resize"
                            className="text-5xl text-primary"
                          />
                          <p className="text-muted-foreground">
                            {t("loadingepisodes")}
                          </p>
                        </div>
                      ) : episodes?.length > 0 ? (
                        <EpisodeList
                          episodes={episodes}
                          anime={animeDetails}
                          backdrop_path={banner}
                          progress={progress}
                        />
                      ) : (
                        <div>{t("noepisodes")}</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
            {/* close button */}
            <button
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground opacity-100 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-accent cursor-pointer z-[100]"
              aria-label="Close"
              onClick={() => setIsOpen(false)}
            >
              <XIcon className="h-6 w-6" />
            </button>
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
