"use client";

import { useParams, useSearchParams } from "next/navigation";
import {
  useEffect,
  useState,
  useRef,
  Suspense,
  useMemo, // Import useMemo
  useCallback,
} from "react";

import { providerNames, providersConfig } from "@/lib/providers/list";
import type {
  Stream,
  ScrapeResult as ScrapeResultType,
} from "@/lib/providers/types";
import { getCustomProviders, getLoadedCustomProvider } from "@/lib/providers/custom-manager";
import { scrapeLocalDownloadProvider } from "@/lib/providers/local-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";
import { MediaPlayer } from "@/components/player/player";
import {
  getEpisodesAnilist,
  getTitleLogoAnilist,
} from "@/components/shared/action";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { Icon } from "@iconify/react";
import { useSettings } from "@/components/settings-context";
import { useTranslations, useLocale } from "next-intl";
import { Comments } from "@/components/player/comments";
import { useMediaQuery } from "@/hooks/use-media-query";
import { OnboardingChecker } from "@/components/onboarding-checker";

interface ScrapeResult extends ScrapeResultType {
  provider: string;
  streams?: Stream[];
  notFound?: boolean;
  error?: boolean;
  message?: string;
  success: boolean;
  status: "pending" | "loading" | "success" | "error" | "notfound" | "skipped";
}

function WatchComponent() {
  const { anime, episode_number } = useParams();
  const searchParams = useSearchParams();
  const anilistId = anime as string;
  const episodeNumber = episode_number as string;

  const isOffline = searchParams?.get("offline") === "true";
  const localFilePath = searchParams?.get("file");
  const paramTitle = searchParams?.get("title");
  const paramCover = searchParams?.get("cover");

  const { settings, isLoading: isSettingsLoading } = useSettings();
  const t = useTranslations("Watch");

  const [customProvidersList, setCustomProvidersList] = useState<string[]>([]);

  useEffect(() => {
    getCustomProviders().then((customs) => {
      const activeCustomIds = customs.filter((c) => c.enabled).map((c) => c.id);
      setCustomProvidersList(activeCustomIds);
    });
  }, []);

  const providersToUse = useMemo(() => {
    if (isSettingsLoading) {
      return null;
    }
    const baseNames = Array.from(new Set([...providerNames, ...customProvidersList]));
    let orderedProviders = settings.providerOrder || baseNames;

    // Ensure all registered providers exist in the order list
    for (const p of baseNames) {
      if (!orderedProviders.includes(p)) {
        orderedProviders = [...orderedProviders, p];
      }
    }

    if (settings.prioritiseLastUsedSource) {
      try {
        const lastUsedProviders = JSON.parse(
          localStorage.getItem("last-used-providers") || "{}",
        );
        const lastUsed = lastUsedProviders[anilistId];

        if (lastUsed && orderedProviders.includes(lastUsed)) {
          const reordered = [
            lastUsed,
            ...orderedProviders.filter((p) => p !== lastUsed),
          ];
          return reordered;
        }
      } catch (e) {
        console.error("Failed to read last used providers:", e);
      }
    }
    return orderedProviders;
  }, [
    isSettingsLoading,
    settings.providerOrder,
    settings.prioritiseLastUsedSource,
    anilistId,
    customProvidersList,
  ]);


  const [results, setResults] = useState<ScrapeResult[]>([]);

  const [streams, setStreams] = useState<Stream[]>([]);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [src, setSrc] = useState<string | undefined>(undefined);
  const [providerConfig, setProviderConfig] = useState<{
    name: string | undefined;
    short: string | undefined;
    proxyRequired: boolean | undefined;
    ref?: string;
  }>({ name: undefined, short: undefined, proxyRequired: undefined });

  const [episodes, setEpisodes] = useState<any[]>([]);
  const [episode, setEpisode] = useState<any>(null);
  const [found, setFound] = useState(false);
  const [animeDetails, setAnimeDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const providerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const router = useRouter();
  const locale = useLocale();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (anilistId && !isNaN(Number(anilistId))) {
      getTitleLogoAnilist(Number(anilistId), locale).then((res) => {
        if (res?.logo) setLogoUrl(res.logo);
      });
    }
  }, [anilistId, locale]);

  const fetchAnimeDetails = async (id: number) => {
    try {
      const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title { english romaji native }
          description
          bannerImage
          coverImage { extraLarge large color }
          nextAiringEpisode { airingAt timeUntilAiring episode }
          genres
          episodes
          duration
          status
          seasonYear
          isAdult
          averageScore
          popularity
          trailer { id site thumbnail }
          format
          studios { nodes { name } }
        }
      }
    `;
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables: { id } }),
      });
      const data = await response.json();
      setAnimeDetails(data.data.Media);
    } catch (error) {
      console.error("Error fetching anime details:", error);
      setAnimeDetails({
        id: id,
        title: { english: "Unknown Anime", romaji: "Unknown Anime", native: "" },
        description: "Anilist API is currently experiencing issues. The description and details could not be loaded.",
        bannerImage: null,
        coverImage: { extraLarge: "", large: "", color: null },
        genres: [],
        episodes: null,
        duration: null,
        status: "UNKNOWN",
        seasonYear: null,
        averageScore: null,
        popularity: 0,
        format: "UNKNOWN",
        studios: { nodes: [] },
      });
    }
  };

  const scrapeProviders = async () => {
    if (!providersToUse) return;

    const anilistIdNum = Number.parseInt(anilistId, 10);
    const episodeNumberNum = Number.parseInt(episodeNumber, 10);

    setLoading(true);
    let streamFound = false;

    for (const provider of providersToUse) {
      if (streamFound) {
        setResults((prev) =>
          prev.map((r) =>
            r.provider === provider
              ? { ...r, status: "skipped" as const, message: "Skipped" }
              : r,
          ),
        );
        continue;
      }

      // Check Session Storage for cached result
      const cacheKey = `watch-cache:${anilistId}:${episodeNumber}:${provider}`;
      let cachedResult = null;
      try {
        const cachedStr = sessionStorage.getItem(cacheKey);
        if (cachedStr) {
          cachedResult = JSON.parse(cachedStr);
        }
      } catch (e) {
        console.error("Failed to read from session storage", e);
      }

      if (cachedResult && cachedResult.success) {
        setResults((prev) =>
          prev.map((r) =>
            r.provider === provider
              ? {
                  ...r,
                  ...cachedResult,
                  status: "success" as const,
                }
              : r,
          ),
        );
        streamFound = true;
        setFound(true);
        setStreams(cachedResult.streams);
        if (cachedResult.subtitles) {
          setSubtitles(cachedResult.subtitles);
        }
        setSrc(cachedResult.streams[0].url);
        console.log(
          `[WATCH] Used Cached Result for provider ${provider}:`,
          cachedResult,
        );
        setProviderConfig({
          ...providersConfig[provider],
          ref: cachedResult?.streams[0]?.headers?.Referer,
        });

        if (settings.prioritiseLastUsedSource) {
          try {
            const lastUsedProviders = JSON.parse(
              localStorage.getItem("last-used-providers") || "{}",
            );
            lastUsedProviders[anilistId] = provider;
            localStorage.setItem(
              "last-used-providers",
              JSON.stringify(lastUsedProviders),
            );
          } catch (e) {
            console.error("Failed to save last used provider:", e);
          }
        }
        continue;
      }

      setResults((prev) =>
        prev.map((r) =>
          r.provider === provider
            ? { ...r, status: "loading" as const, message: "Searching..." }
            : r,
        ),
      );

      setTimeout(() => {
        providerRefs.current[provider]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);

      try {
        let result: any = null;

        if (provider === "local-download") {
          const titles = [
            animeDetails?.title?.english,
            animeDetails?.title?.romaji,
            animeDetails?.title?.native,
            typeof anime === "string" ? anime.replace(/-/g, " ") : "",
            paramTitle,
          ].filter(Boolean) as string[];

          result = await scrapeLocalDownloadProvider(titles, episodeNumberNum);
        } else if (provider.startsWith("custom-")) {
          const customMod = await getLoadedCustomProvider(provider);
          if (!customMod) {
            result = { notFound: true, message: "Custom provider not loaded" };
          } else {
            let mappedId = "";
            if (typeof customMod.map === "function") {
              mappedId = await customMod.map(anilistIdNum);
            } else {
              mappedId = String(anilistIdNum);
            }

            if (!mappedId) {
              result = { notFound: true, message: "Anime not found on custom provider" };
            } else {
              let epId = mappedId;
              if (typeof customMod.getEpisodes === "function") {
                const eps = await customMod.getEpisodes(mappedId);
                const matchEp = eps?.find(
                  (e: any) =>
                    Number(e.episode_number) === episodeNumberNum ||
                    e.id === episodeNumberNum
                );
                epId = matchEp?.id || mappedId;
              }
              result = await customMod.scrape(epId);
            }
          }
        } else {
          const response = await fetch(`/api/watch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: provider,
              anilistId: anilistIdNum,
              episodeNumber: episodeNumberNum,
              config:
                provider === "febbox"
                  ? { cookie: settings.febboxUiToken }
                  : undefined,
            }),
          });

          if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
          }

          result = await response.json();
        }

        const success = result?.streams && result.streams.length > 0;


        setResults((prev) =>
          prev.map((r) =>
            r.provider === provider
              ? {
                  ...r,
                  ...result,
                  success,
                  status: success
                    ? ("success" as const)
                    : result.error
                      ? ("error" as const)
                      : ("notfound" as const),
                }
              : r,
          ),
        );

        if (success) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {
            console.error("Failed to save to session storage", e);
          }

          streamFound = true;
          setFound(true);
          setStreams(result.streams);
          if (result.subtitles) {
            setSubtitles(result.subtitles);
          }
          setSrc(result.streams[0].url);
          console.log(`[WATCH] Final Result for provider ${provider}:`, result);
          setProviderConfig({
            ...providersConfig[provider],
            ref: result?.streams[0]?.headers?.Referer,
          });

          if (settings.prioritiseLastUsedSource) {
            try {
              const lastUsedProviders = JSON.parse(
                localStorage.getItem("last-used-providers") || "{}",
              );
              lastUsedProviders[anilistId] = provider;
              localStorage.setItem(
                "last-used-providers",
                JSON.stringify(lastUsedProviders),
              );
            } catch (e) {
              console.error("Failed to save last used provider:", e);
            }
          }
        }
      } catch (error) {
        setResults((prev) =>
          prev.map((r) =>
            r.provider === provider
              ? {
                  ...r,
                  error: true,
                  message: (error as Error).message,
                  success: false,
                  status: "error" as const,
                }
              : r,
          ),
        );
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    // Offline Mode Handling
    if (isOffline && localFilePath) {
      const localStreamUrl = `http://127.0.0.1:39282/local_file?path=${encodeURIComponent(
        localFilePath
      )}`;
      const streamItem: Stream = {
        url: localStreamUrl,
        quality: "Offline (1080p)",
        type: "mp4",
      };



      setStreams([streamItem]);
      setSrc(localStreamUrl);
      setFound(true);
      setLoading(false);

      const titleStr = paramTitle || decodeURIComponent(anilistId || "Anime");
      const epNumber = Number.parseInt(episodeNumber, 10) || 1;

      setAnimeDetails({
        id: !isNaN(Number(anilistId)) ? Number(anilistId) : 1,
        title: {
          english: titleStr,
          romaji: titleStr,
          native: "",
        },
        description: "Offline episode playback.",
        bannerImage: paramCover || null,
        coverImage: {
          extraLarge: paramCover || "",
          large: paramCover || "",
          color: null,
        },
        genres: ["Offline"],
        episodes: epNumber,
        duration: 24,
        status: "COMPLETED",
        seasonYear: 2026,
        averageScore: 100,
        popularity: 1,
        format: "TV",
        studios: { nodes: [] },
      });

      setEpisode({
        episode_number: epNumber,
        name: `Episode ${epNumber}`,
        still_path: paramCover || null,
        overview: "Offline downloaded episode.",
      });

      setEpisodes([
        {
          episode_number: epNumber,
          name: `Episode ${epNumber}`,
          still_path: paramCover || null,
        },
      ]);
      return;
    }

    if (!anilistId || !episodeNumber) {
      setLoading(false);
      return;
    }

    if (isSettingsLoading || !providersToUse) {
      setLoading(true);
      return;
    }

    const anilistIdNum = Number.parseInt(anilistId, 10);
    const episodeNumberNum = Number.parseInt(episodeNumber, 10);

    if (isNaN(anilistIdNum) || isNaN(episodeNumberNum)) {
      setLoading(false);
      return;
    }

    setResults(
      providersToUse.map((provider) => ({
        provider,
        success: false,
        status: "pending" as const,
      })),
    );

    const fetchEpisodes = async () => {
      const eps = await getEpisodesAnilist(anilistIdNum);
      setEpisodes(eps || []);

      let ep = eps?.find(
        (e) =>
          e.episode_number === episodeNumberNum || e.id === episodeNumberNum,
      );

      if (!ep) {
        ep = {
          episode_number: episodeNumberNum,
          name: `Episode ${episodeNumberNum}`,
          still_path: null,
          overview: "Details unavailable due to AniList API issues.",
        };
      }
      setEpisode(ep);
    };

    fetchEpisodes();
    fetchAnimeDetails(anilistIdNum);
    scrapeProviders();
  }, [anilistId, episodeNumber, providersToUse, isSettingsLoading, isOffline, localFilePath]);

  useEffect(() => {
    if (streams.length > 0) {
      setSrc(streams[0].url);
    }
  }, [streams]);

  // Loading guard for settings
  if (isSettingsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (
    !isOffline &&
    (!anilistId ||
      !episodeNumber ||
      isNaN(Number.parseInt(anilistId)) ||
      isNaN(Number.parseInt(episodeNumber)))
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Invalid or missing Anime ID or Episode Number in the URL.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsWidth, setCommentsWidth] = useState(500);
  const isDesktop = useMediaQuery("(min-width: 1024px)"); // lg breakpoint

  const toggleComments = () => {
    setIsCommentsOpen((prev) => !prev);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      // Set constraints for resizing
      if (newWidth > 300 && newWidth < window.innerWidth / 2) {
        setCommentsWidth(newWidth);
      }
    },
    [setCommentsWidth],
  );

  const handleMouseUp = useCallback(() => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp],
  );

  const getStatusIcon = (status: ScrapeResult["status"]) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "success":
        return (
          <Icon
            icon="solar:check-circle-bold"
            className="h-5 w-5 text-green-500"
          />
        );
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "notfound":
        return (
          <Icon
            icon="solar:minus-circle-bold"
            className="h-5 w-5 text-muted-foreground"
          />
        );
      case "skipped":
        return <Circle className="h-5 w-5 text-gray-300" />;
      case "pending":
        return <Circle className="h-5 w-5 text-gray-200" />;
    }
  };

  const getStatusText = (result: ScrapeResult, t: any) => {
    switch (result.status) {
      case "loading":
        return t("streamLoading");
      case "success":
        return t("streamSuccess");
      case "error":
        return t("streamError", { message: result.message });
      case "notfound":
        return t("streamNotFound");
      case "skipped":
        return t("streamSkipped");
      case "pending":
        return "";
    }
  };

  if (isSettingsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="watch-page-container flex w-screen h-screen overflow-hidden bg-black">
        <div className="relative flex-1 h-screen">

          {animeDetails && episode && (
            <MediaPlayer
              episode={episode}
              episodes={episodes}
              src={src}
              subtitles={subtitles}
              setSubtitles={setSubtitles}
              setSrc={setSrc}
              streams={streams}
              setStreams={setStreams}
              setProviderConfig={setProviderConfig}
              providerConfig={providerConfig}
              animeDetails={animeDetails}
              poster={episode?.still_path || animeDetails?.coverImage?.extraLarge || animeDetails?.bannerImage || ""}
              toggleComments={toggleComments}
              isCommentsOpen={isCommentsOpen}
              isDesktop={isDesktop}
              commentsWidth={commentsWidth}
              logoUrl={logoUrl}
              isOffline={isOffline}
            />
          )}

          {!found && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-10 p-4">
              <div className="w-full max-w-2xl space-y-6 p-6">
                <div className="text-center flex flex-col gap-1">
                  <h1 className="text-2xl mb-2">{t("findingStream")}</h1>
                  <p className="text-muted-foreground text-sm">
                    {t("findingDescription")}
                  </p>
                </div>

                <div className="space-y-1 max-h-[200px] overflow-y-auto px-4 no-scrollbar">
                  {results.map((result) => (
                    <div
                      key={result.provider}
                      ref={(el) => {
                        providerRefs.current[result.provider] = el;
                      }}
                      className="flex items-center justify-between px-4 py-2 transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {getStatusIcon(result.status)}
                        <div>
                          <p
                            className={`font-medium ${
                              result.status === "loading"
                                ? "text-white"
                                : "text-muted-foreground"
                            }`}
                          >
                            {result.provider}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getStatusText(result, t)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!loading && !found && (
                  <Alert className="mt-6">
                    <AlertTitle>No Streams Found :(</AlertTitle>
                    <AlertDescription>
                      We couldn't find a stream from any of our providers for
                      this episode.
                    </AlertDescription>
                  </Alert>
                )}

                <p className="text-center text-sm text-muted-foreground">
                  Tip: Press "F" for fullscreen mode in the player.
                </p>

                <div className="flex flex-row gap-3 items-center justify-center w-full">
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/");
                    }}
                  >
                    Back Home
                  </Button>
                  <Button
                    onClick={() => {
                      if (providersToUse) {
                        setResults(
                          providersToUse.map((provider) => ({
                            provider,
                            success: false,
                            status: "pending" as const,
                          })),
                        );
                        setFound(false);
                        setLoading(true);
                        scrapeProviders();
                      }
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        {isDesktop && isCommentsOpen && (
          <div
            onMouseDown={handleMouseDown}
            className="w-2 cursor-col-resize flex-shrink-0 group flex items-center justify-center bg-transparent hover:bg-white/10 transition-colors duration-200 z-[100]"
          >
            <div className="w-0.5 h-8 bg-border rounded-full group-hover:bg-primary transition-colors duration-200" />
          </div>
        )}
        {isDesktop && (
          <div
            className={`overflow-hidden flex-shrink-0 transition-all duration-300 ease-in-out ${
              isCommentsOpen ? "" : "w-0"
            }`}
            style={{ width: isCommentsOpen ? `${commentsWidth}px` : "0px" }}
          >
            <Comments
              onClose={toggleComments}
              animeDetails={animeDetails}
              episode={episode}
              isDesktop
            />
          </div>
        )}
      </div>
      {!isDesktop && (
        <Comments
          isOpen={isCommentsOpen}
          animeDetails={animeDetails}
          episode={episode}
          onClose={toggleComments}
        />
      )}
    </>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <OnboardingChecker>
        <WatchComponent />
      </OnboardingChecker>
    </Suspense>
  );
}
