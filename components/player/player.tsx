"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MediaProvider,
  useMediaStore,
} from "@/components/limeplay/media-provider";
import { MediaElement } from "@/components/limeplay/media-element";
import { PlayerHooks } from "@/components/limeplay/player-hooks";
import { RootContainer } from "@/components/limeplay/root-container";
import { Loader2, Maximize, Minimize } from "lucide-react";
import { Icon } from "@iconify/react";
import { useMediaState } from "@/hooks/limeplay/use-media-state";
import { useVolume } from "@/hooks/limeplay/use-volume";
import { useTimeline } from "@/hooks/limeplay/use-timeline";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Toaster } from "@/components/ui/sonner";
import BottomControls from "./bottom-controls";
import PlayerButton from "../limeplay/player-button";
import { IdleOverlay } from "./idle-overlay";
import { useAnilist } from "@/lib/hooks/use-anilist";
import { useSession } from "next-auth/react";
import { updateProgress, getUserProgress } from "@/components/shared/action";
import { useSettings } from "@/components/settings-context";
import { Link, useRouter } from "@/i18n/navigation";
import { ThumbnailScraper } from "./thumbnails-scraper";
import { useCaptions } from "@/hooks/limeplay/use-captions";
import { CaptionsContainer } from "../limeplay/captions";
import { providerNames, providersConfig } from "@/lib/providers/list";

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds)) return "00:00";
  const time = Math.floor(timeInSeconds);
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};

const getAdvancedString = (duration: number, currentTime: number, t: any) => {
  const timeLeft = duration - currentTime;
  const finishTime = new Date(Date.now() + timeLeft * 1000);
  const formattedFinishTime = finishTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return t("timeLeft", {
    time: formatTime(timeLeft),
    finishTime: formattedFinishTime,
  });
};

interface PlayerProps {
  isCommentsOpen?: boolean;
  isDesktop?: boolean;
  toggleComments: () => void;
  src: string | undefined;
  subtitles?: any[];
  setSrc: (src: string) => void;
  poster?: string;
  episode?: any;
  episodes?: any;
  animeDetails?: any;
  providerConfig?: {
    name: string | undefined;
    short: string | undefined;
    proxyRequired: boolean | undefined;
    ref?: string;
  };
  streams?: any;
  setStreams?: (streams: any) => void;
  setProviderConfig?: (providerConfig: any) => void;
  setSubtitles?: (subtitles: any[]) => void;
  commentsWidth?: number;
  logoUrl?: string | null;
}

function MediaPlayerInternal({
  src,
  setSrc,
  poster,
  episode,
  episodes,
  animeDetails,
  providerConfig,
  streams,
  setStreams,
  setProviderConfig,
  setSubtitles,
  toggleComments,
  isCommentsOpen,
  isDesktop,
  commentsWidth,
  subtitles,
  logoUrl,
}: PlayerProps) {
  const t = useTranslations("Player");
  const tWatch = useTranslations("Watch");
  const { settings, isLoading: settingsLoading } = useSettings();
  const [processedSrc, setProcessedSrc] = useState(src);

  useEffect(() => {
    if (settingsLoading) return; // Wait for settings to load

    if (providerConfig?.proxyRequired) {
      const encodedUrl = encodeURIComponent(src || "");
      const encodedRef = providerConfig?.ref
        ? encodeURIComponent(providerConfig.ref)
        : "";
      let newSrc = `${settings.proxyUrl}/fetch?url=${encodedUrl}`;
      if (encodedRef) {
        newSrc += `&ref=${encodedRef}`;
      }
      setProcessedSrc(newSrc);
    } else {
      setProcessedSrc(src);
    }
  }, [src, providerConfig, settings, settingsLoading]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [timeFormat, setTimeFormat] = useState("normal");
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [anilistMarked, setAnilistMarked] = useState(false);
  const [anilistProgress, setAnilistProgress] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [thumbnails, setThumbnails] = useState([]);
  const [generateThumbnails, setGenerateThumbnails] = useState(null);
  const [buffered, setBuffered] = useState(0);

  const [skipIndicator, setSkipIndicator] = useState({
    show: false,
    direction: "none",
  });
  const clickTimeoutRef = useRef(null);
  const hideIndicatorTimeoutRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const captionContainerRef = useRef<HTMLDivElement>(null);
  const lastDbUpdateRef = useRef(0);
  const skipTimesRef = useRef([]);
  const skippedIdRef = useRef(null); // Prevents spamming toast/skip
  const subtitleTrackAddedRef = useRef<string | null>(null);

  const [manualSkip, setManualSkip] = useState({
    show: false,
    label: "",
    endTime: 0,
  });

  const mediaRef = useMediaStore((state) => state.mediaRef);
  const status = useMediaStore((state) => state.status);
  const volume = useMediaStore((state) => state.volume);
  const currentTime = useMediaStore((state) => state.currentTime);
  const duration = useMediaStore((state) => state.duration);
  const isMuted = useMediaStore((state) => state.muted);
  const player = useMediaStore((state) => state.player);
  const router = useRouter();
  const setTextTrackContainerElement = useMediaStore(
    (state) => state.setTextTrackContainerElement,
  );

  const { toggleCaptionVisibility } = useCaptions();

  useEffect(() => {
    if (captionContainerRef.current) {
      setTextTrackContainerElement(captionContainerRef.current);
    }
  }, [captionContainerRef, setTextTrackContainerElement]);

  useEffect(() => {
    if (status === "ended") {
      try {
        const settings = JSON.parse(
          localStorage.getItem("realms-player") || "{}",
        );
        const autoNextEnabled =
          settings.autoNext !== undefined ? settings.autoNext : true;
        if (autoNextEnabled) {
          handleNextEpisode();
        }
      } catch (error) {
        console.error("Failed to parse settings from storage:", error);
        // Default to playing next episode if settings are corrupt
        handleNextEpisode();
      }
    }
  }, [status]);

  useEffect(() => {
    if (settingsLoading) return;

    if (player && subtitles && subtitles.length > 0) {
      const addTracks = async () => {
        // Prevent adding tracks if they are already added for this specific load
        // checking against a ref or similar if strictly necessary, but 'loaded' implies a fresh start.

        console.log("[ADDER] Starting to add tracks for:", processedSrc);

        const promises = subtitles
          .filter((subtitle) => subtitle.url)
          .map((subtitle) => {
            let subtitleUrl = subtitle.url;
            if (providerConfig?.proxyRequired && settings.proxyUrl) {
              subtitleUrl = `${
                settings.proxyUrl
              }/fetch/segment?url=${encodeURIComponent(subtitle.url)}&ref=${encodeURIComponent(subtitle.headers.Referer)}`;
            }

            let mimeType = "text/plain";
            if (subtitle.url.toLowerCase().includes(".vtt")) {
              mimeType = "text/vtt";
            } else if (subtitle.url.toLowerCase().includes(".srt")) {
              mimeType = "text/srt";
            } else if (subtitle.url.toLowerCase().includes(".ass")) {
              mimeType = "text/x-ssa";
            }

            return player
              .addTextTrackAsync(
                subtitleUrl,
                subtitle.label,
                "subtitles",
                mimeType,
              )
              .then(() => {
                console.log("[ADDER] Text track added: ", subtitle.url);
              })
              .catch((error: unknown) => {
                console.error("[ADDER] Error adding text track:", error);
              });
          });

        await Promise.all(promises);

        const tracks = player.getTextTracks();
        if (tracks.length > 0) {
          player.selectTextTrack(tracks[0]);
          player.setTextTrackVisibility(true);
        }
      };

      const onLoaded = () => {
        addTracks();
      };

      player.addEventListener("loaded", onLoaded);

      // If the player is already loaded with the current source, add tracks immediately.
      // We check getAssetUri() to ensure we are targeting the correct content.
      const currentUri = player.getAssetUri();
      if (currentUri === processedSrc) {
        addTracks();
      }

      return () => {
        player.removeEventListener("loaded", onLoaded);
      };
    }
  }, [
    player,
    subtitles,
    providerConfig,
    settings,
    settingsLoading,
    processedSrc,
  ]);

  useEffect(() => {
    const video = mediaRef.current;
    if (!video) return;

    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("progress", onProgress);
    };
  }, [mediaRef]);

  const { togglePaused } = useMediaState();
  const { setVolume, toggleMute } = useVolume();
  const { seek } = useTimeline();
  const { markProgress, getProgress } = useAnilist();
  const { data: session } = useSession();

  const updateWatchProgress = useCallback(
    async (force = false) => {
      if (
        !duration ||
        duration === 0 ||
        currentTime === 0 ||
        episode === undefined ||
        animeDetails?.title?.english === "Unknown Anime"
      ) {
        return;
      }

      const now = Date.now();
      if (!force && now - lastDbUpdateRef.current < 10000) {
        return; // Throttled
      }
      lastDbUpdateRef.current = now;

      if (session?.user?.name) {
        try {
          await updateProgress(
            session.user.name,
            animeDetails.id,
            episode.episode_number,
            currentTime,
            duration,
            animeDetails,
          );
          console.log(`DB progress saved at ${currentTime}s`);
        } catch (error) {
          console.error("Failed to save progress to DB:", error);
        }
      } else {
        try {
          const GUEST_PROGRESS_KEY = "anime-progress";
          const MAX_GUEST_ANIME = 15;

          const existingProgressString =
            localStorage.getItem(GUEST_PROGRESS_KEY);
          let progressMap;
          try {
            progressMap = new Map(JSON.parse(existingProgressString || "[]"));
          } catch (e) {
            console.warn("localStorage progress data corrupted, resetting.");
            progressMap = new Map();
          }

          const animeIdToDelete = animeDetails.id;
          for (const key of progressMap.keys()) {
            if (key.startsWith(`${animeIdToDelete}-`)) {
              progressMap.delete(key);
              break;
            }
          }

          const newEpisodeKey = `${animeDetails.id}-${episode.episode_number}`;
          progressMap.set(newEpisodeKey, {
            progress: currentTime,
            duration: duration,
            anime: animeDetails,
            episode_number: episode.episode_number,
          });

          while (progressMap.size > MAX_GUEST_ANIME) {
            const oldestKey = progressMap.keys().next().value;
            progressMap.delete(oldestKey);
          }

          localStorage.setItem(
            GUEST_PROGRESS_KEY,
            JSON.stringify(Array.from(progressMap.entries())),
          );
          console.log(
            `LocalStorage progress for ${newEpisodeKey} saved at ${currentTime}s`,
          );
        } catch (error) {
          console.error("Failed to save progress to LocalStorage:", error);
        }
      }
    },
    [
      session,
      animeDetails,
      episode,
      currentTime,
      duration,
      updateProgress,
      settings.autoTracking,
      settings.anilistTrackingThreshold,
    ],
  );

  const handleSeekCommit = (value: number[]) => {
    seek(value[0]);
    updateWatchProgress(true);
  };

  if (typeof window === "undefined") {
    return null;
  }

  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    const showControlsHandler = () => {
      setShowControls(true);
      clearTimeout(hideTimeout);
      if (processedSrc === undefined || processedSrc === null || isPopoverOpen)
        return;
      hideTimeout = setTimeout(() => setShowControls(false), 6000);
    };
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mousemove", showControlsHandler);
    container.addEventListener("mouseleave", () => clearTimeout(hideTimeout));
    showControlsHandler();
    return () => {
      container.removeEventListener("mousemove", showControlsHandler);
      container.removeEventListener("mouseleave", () =>
        clearTimeout(hideTimeout),
      );
      clearTimeout(hideTimeout);
    };
  }, [containerRef, status, isPopoverOpen]);

  const [showIdleOverlay, setShowIdleOverlay] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (status === "paused" && !showControls && isDesktop) {
      timeout = setTimeout(() => {
        setShowIdleOverlay(true);
      }, 2000);
    } else {
      setShowIdleOverlay(false);
    }

    return () => clearTimeout(timeout);
  }, [status, showControls, isDesktop]);

  useEffect(() => {
    // Don't run if duration isn't loaded or time is 0 or episode is undefined
    if (
      !duration ||
      duration === 0 ||
      currentTime === 0 ||
      episode === undefined ||
      mediaRef.current === undefined
    ) {
      return;
    }

    const currentState = {
      show: false,
      label: "",
      endTime: 0,
    };

    const currentVideoTime = mediaRef.current.currentTime;
    const skipTimes = skipTimesRef.current;

    for (const item of skipTimes) {
      const { startTime, endTime } = item.interval;
      const skipType = item.skipType;
      const skipId = item.skipId;

      // Check if the current time is within a skippable interval
      if (currentVideoTime >= startTime && currentVideoTime < endTime) {
        let label = "";
        let shouldAutoSkip = false;

        // Check for Intro/Opening (op or mixed-op)
        if (skipType === "op" || skipType === "mixed-op") {
          label = t("skipIntro");
          shouldAutoSkip = settings.skipIntro;
        }
        // Check for Recap
        else if (skipType === "recap") {
          label = t("skipRecap");
          shouldAutoSkip = settings.skipRecap;
        }
        // Check for Outro/Ending (ed or mixed-ed)
        else if (skipType === "ed" || skipType === "mixed-ed") {
          label = t("skipOutro");
          shouldAutoSkip = settings.skipOutro;
        }

        if (label) {
          // If auto-skip is enabled AND we haven't skipped this specific ID yet
          if (shouldAutoSkip && skippedIdRef.current !== skipId) {
            console.log(`Skipping: ${label} at ${currentVideoTime}s`);

            // Perform the skip
            mediaRef.current.currentTime = endTime;

            // Mark this segment as skipped to prevent loops/spam
            skippedIdRef.current = skipId;

            // Show toast and vote options (same as before)
            async function handleVote(voteType: string) {
              const url = `https://api.aniskip.com/v2/skip-times/vote/${skipId}`;
              try {
                const response = await fetch(url, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ voteType }),
                });

                if (response.ok) {
                  // Optional: Show a "Thanks" toast
                  toast.success(t("votedThanks", { voteType }), {
                    position: "top-center",
                    toasterId: "player-toaster",
                  });
                } else {
                  console.error("AniSkip vote failed:", response.statusText);
                }
              } catch (error) {
                console.error("Error submitting AniSkip vote:", error);
              }

              toast.dismiss(t);
            }

            toast(
              <div className="flex flex-row justify-between items-center gap-4 bg-popover border border-border rounded-lg px-4 py-3 min-w-80">
                <span className="flex-shrink-0 text-foreground">
                  {label} {t("skipped")}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote("upvote", skipId)}
                    title={t("goodSkipTime")}
                    className="h-8 w-8 p-0"
                  >
                    <Icon icon="flowbite:thumbs-up-solid" className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote("downvote", skipId)}
                    title={t("badSkipTime")}
                    className="h-8 w-8 p-0"
                  >
                    <Icon
                      icon="flowbite:thumbs-down-solid"
                      className="w-4 h-4"
                    />
                  </Button>
                </div>
              </div>,
              {
                position: "top-center",
                toasterId: "player-toaster",
                duration: 6000,
                style: {
                  background: "transparent",
                  border: "none",
                  padding: "0",
                  boxShadow: "none",
                },
              },
            );
            break; // Stop checking other intervals since we skipped
          } else {
            // Auto-skip is disabled OR we already skipped this segment (user seeked back)
            // Show the manual skip button
            currentState.show = true;
            currentState.label = label;
            currentState.endTime = endTime;
            // No break here, technically could overlap but simple first match is fine usually
          }
        }
      }
    }

    setManualSkip(currentState);

    if (!anilistMarked && session?.user && settings.autoTracking) {
      const progPercent = (currentTime / duration) * 100;
      if (progPercent >= settings.anilistTrackingThreshold) {
        toast.promise(markProgress(animeDetails.id, episode.episode_number), {
          loading: t("markingWatched", {
            episodeNumber: episode.episode_number,
          }),
          success: t("markedWatched", {
            episodeNumber: episode.episode_number,
          }),
          error: t("markWatchedError"),
          position: "top-center",
          toasterId: "player-toaster",
        });
        setAnilistMarked(true);
      }
    }

    updateWatchProgress();
  }, [
    currentTime,
    duration,
    anilistMarked,
    session,
    animeDetails,
    episode,
    setAnilistMarked,
    toast,
    markProgress,
    updateProgress,
    mediaRef,
    settings.autoTracking,
    settings.anilistTrackingThreshold,
    settings.skipIntro,
    settings.skipOutro,
    settings.skipRecap,
    updateWatchProgress,
    t,
  ]);

  // Insert manual button rendering near other controls or overlays
  // This will be returned in the main render block, but let's define the handler first
  const handleManualSkip = () => {
    if (manualSkip.show && mediaRef.current) {
      mediaRef.current.currentTime = manualSkip.endTime;
      setManualSkip({ ...manualSkip, show: false });
    }
  };

  const toggleTimeFormat = () => {
    const newFormat = timeFormat === "normal" ? "advanced" : "normal";
    setTimeFormat(newFormat);
    let savedSettings = localStorage.getItem("realms-player");
    let currentSettings = savedSettings ? JSON.parse(savedSettings) : {};
    currentSettings.timeFormat = newFormat;
    localStorage.setItem("realms-player", JSON.stringify(currentSettings));
  };

  const togglePlay = () => {
    console.log("[PLAYER] Toggling play/pause, current status:", status);
    togglePaused();
    console.log("[PLAYER] New status:", status);
  };
  const handleSeek = (value) => seek(value[0]);
  const handleVolumeChange = (value) => {
    if (isMuted) toggleMute();
    setVolume(value[0]);
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  document.addEventListener("fullscreenchange", handleFullscreenChange);

  const handlePrevEpisode = () => {
    if (!episodes || !episode || !animeDetails) return;

    const currentIndex = episodes.findIndex(
      (ep) => ep.episode_number === episode.episode_number,
    );

    if (currentIndex <= 0) {
      toast.error(t("firstEpisode"), {
        position: "top-center",
        toasterId: "player-toaster",
      });
      return;
    }

    const prevEpisode = episodes[currentIndex - 1];

    if (prevEpisode) {
      toast.loading(
        t("loadingEpisode", { episodeNumber: prevEpisode.episode_number }),
        {
          position: "top-center",
          toasterId: "player-toaster",
        },
      );
      const prevEpPath = `/watch/${animeDetails.id}/${prevEpisode.episode_number}`;
      router.push(prevEpPath);
    }
  };

  const handleNextEpisode = () => {
    if (!episodes || !episode || !animeDetails) return;

    const currentIndex = episodes.findIndex(
      (ep) => ep.episode_number === episode.episode_number,
    );

    if (currentIndex === -1 || currentIndex >= episodes.length - 1) {
      toast.error(t("lastEpisode"), {
        position: "top-center",
        toasterId: "player-toaster",
      });
      return;
    }

    const nextEpisode = episodes[currentIndex + 1];

    if (nextEpisode) {
      toast.loading(
        t("loadingEpisode", { episodeNumber: nextEpisode.episode_number }),
        {
          position: "top-center",
          toasterId: "player-toaster",
        },
      );
      const nextEpPath = `/watch/${animeDetails.id}/${nextEpisode.episode_number}`;
      router.push(nextEpPath);
    }
  };

  const handleScreenshot = () => {
    const videoElement = mediaRef.current;

    if (!videoElement) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.offsetWidth;
    canvas.height = videoElement.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        animeDetails.title.english || animeDetails.title.romaji
      } - Episode ${episode.episode_number}.png`;
      a.click();
      URL.revokeObjectURL(url);
      try {
        navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
      } catch (err) {
        console.error("Failed to copy screenshot to clipboard:", err);
      }
      toast.success(t("screenshotSuccess"), {
        position: "top-center",
        toasterId: "player-toaster",
      });
    });
  };

  const handleSkip85s = () => {
    skipTime(85);
    toast.success(t("skip85s"));
  };

  const handleOverlayClick = (e) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      const isDesktop = window.innerWidth >= 768;

      if (isDesktop) {
        toggleFullscreen();
      } else if (settings.doubleTapToSeek === true) {
        if (hideIndicatorTimeoutRef.current) {
          clearTimeout(hideIndicatorTimeoutRef.current);
        }

        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX;
        const midPoint = rect.left + rect.width / 2;

        if (clickX > midPoint) {
          seekForward();
          setSkipIndicator({ show: true, direction: "forward" });
        } else {
          seekBackward();
          setSkipIndicator({ show: true, direction: "backward" });
        }

        hideIndicatorTimeoutRef.current = setTimeout(() => {
          setSkipIndicator({ show: false, direction: "none" });
        }, 600);
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        const isDesktop = window.innerWidth >= 768;
        if (isDesktop) {
          togglePlay();
        } else {
          setShowMobileOverlay(true);
        }
        clickTimeoutRef.current = null;
      }, 300);
    }
  };

  const toggleFullscreen = () => {
    const isFullscreen = document.fullscreenElement;

    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (mediaRef.current && mediaRef.current.webkitEnterFullscreen) {
        mediaRef.current.webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const skipTime = (seconds) => {
    console.log(`[PLAYER] Skipping ${seconds} seconds...`);
    if (mediaRef.current) {
      console.log(
        `Calculated skiptime for ${seconds}: ${
          mediaRef.current.currentTime + seconds
        }`,
      );
      console.log(`Duration is: ${duration}`);
      seek(mediaRef.current.currentTime + seconds);
    } else {
      console.warn("[PLAYER] Media element not available for skipping time.");
    }
  };

  const seekForward = () => skipTime(settings.seekDuration);
  const seekBackward = () => skipTime(-settings.seekDuration);

  useEffect(() => {
    if (settingsLoading || !containerRef.current) return;

    const {
      backgroundOpacity,
      backgroundBlur,
      textSize,
      textStyle,
      boldText,
      color,
      verticalPosition,
      fontFamily,
      outlineWidth,
    } = settings.subtitleSettings;

    const container = containerRef.current;

    // Apply vertical position class
    container.classList.remove("normal-captions", "high-captions");
    container.classList.add(
      verticalPosition === "high" ? "high-captions" : "normal-captions",
    );

    // Theming via CSS variables
    const root = containerRef.current;
    if (!root) return;

    // Inject Font
    if (fontFamily) {
      const fontId = `subtitle-font-${fontFamily.replace(/\s+/g, "-")}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
          /\s+/g,
          "+",
        )}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }
      root.style.setProperty(
        "--subtitle-font-family",
        `"${fontFamily}", sans-serif`,
      );
    } else {
      root.style.setProperty("--subtitle-font-family", "sans-serif");
    }

    root.style.setProperty(
      "--subtitle-bg-color",
      `rgba(16, 16, 16, ${backgroundOpacity})`,
    );
    const blurValue = backgroundOpacity > 0 && backgroundBlur ? "4px" : "0px";
    root.style.setProperty("--subtitle-blur", blurValue);
    // Base font size is 1rem, we apply a multiplier.
    root.style.setProperty(
      "--subtitle-font-size",
      `${1 * (textSize / 100)}rem`,
    );
    root.style.setProperty("--subtitle-color", color);
    root.style.setProperty(
      "--subtitle-font-weight",
      boldText ? "bold" : "normal",
    );

    let textShadow = "none";

    // Helper to generate outline shadow
    const generateOutline = (width: number, color: string = "#000000") => {
      // Simple 8-point stroke simulation for better performance than many shadows
      // or using enough steps. For 1-3px, 8 steps is usually okay-ish.
      // But for cleaner thick borders, we might need more or use -webkit-text-stroke if available.
      // However, text-shadow is more universal.
      // Let's generate a "round" stroke effect.
      if (width === 0) return "none";

      const shadows = [];
      const steps = 8; // Number of angles
      for (let i = 0; i < steps; i++) {
        const angle = (i * 2 * Math.PI) / steps;
        const x = Math.round(Math.cos(angle) * width * 10) / 10;
        const y = Math.round(Math.sin(angle) * width * 10) / 10;
        shadows.push(`${x}px ${y}px 0 ${color}`);
      }
      // Add a generic drop shadow for depth? Maybe not if it's just outline.
      return shadows.join(", ");
    };

    switch (textStyle) {
      case "drop-shadow":
        textShadow = "rgba(0, 0, 0, 0.8) 2px 2px 3px";
        break;
      case "raised":
        textShadow =
          "rgba(0, 0, 0, 0.8) 1px 1px, rgba(0, 0, 0, 0.8) 2px 2px, rgba(0, 0, 0, 0.8) 3px 3px";
        break;
      case "depressed":
        textShadow =
          "rgb(0, 0, 0) -1px -1px 0px, rgb(255, 255, 255) 1px 1px 0px";
        break;
      case "border":
        // Use the custom outline width if provided, default to classic 2px style
        const width = outlineWidth !== undefined ? outlineWidth : 2;
        textShadow = generateOutline(width, "#000000");
        break;
      case "default":
      default:
        textShadow = "2px 2px 4px rgba(0, 0, 0, 0.7)";
        break;
    }
    root.style.setProperty("--subtitle-text-shadow", textShadow);
  }, [settings.subtitleSettings, settingsLoading]);

  useEffect(() => {
    if (settingsLoading) return;
    const actionMap = Object.entries(settings.shortcuts).reduce(
      (acc, [action, key]) => {
        if (key) {
          acc[key] = action;
        }
        return acc;
      },
      {},
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLIFrameElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable) ||
        (e.target instanceof Element &&
          e.target.closest("#anime-community-comment-section"))
      ) {
        return;
      }

      const { key, ctrlKey, shiftKey, altKey, metaKey } = e;

      const parts: string[] = [];
      if (ctrlKey) parts.push("Ctrl");
      if (altKey) parts.push("Alt");
      if (metaKey) parts.push("Meta");
      if (shiftKey) parts.push("Shift");

      let keyName = key;
      if (key === " ") {
        keyName = "Space";
      } else if (key.length > 1) {
        keyName = key.charAt(0).toUpperCase() + key.slice(1);
      }

      if (["Control", "Shift", "Alt", "Meta"].includes(keyName)) {
        return;
      }

      if (!parts.includes(keyName)) {
        parts.push(keyName);
      }

      const shortcut = parts.join("+");
      const action = actionMap[shortcut];

      if (!action) {
        return;
      }

      e.preventDefault();

      switch (action) {
        case "togglePlay":
          togglePlay();
          break;
        case "toggleMute":
          toggleMute();
          break;
        case "toggleFullscreen":
          toggleFullscreen();
          break;
        case "seekForward":
          seekForward();
          setSkipIndicator({ show: true, direction: "forward" });
          hideIndicatorTimeoutRef.current = setTimeout(() => {
            setSkipIndicator({ show: false, direction: "none" });
          }, 600);
          break;
        case "seekBackward":
          seekBackward();
          setSkipIndicator({ show: true, direction: "backward" });
          hideIndicatorTimeoutRef.current = setTimeout(() => {
            setSkipIndicator({ show: false, direction: "none" });
          }, 600);
          break;
        case "volumeUp":
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case "volumeDown":
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case "nextEpisode":
          handleNextEpisode();
          break;
        case "prevEpisode":
          handlePrevEpisode();
          break;
        case "screenshot":
          handleScreenshot();
          break;
        case "skip85s":
          handleSkip85s();
          break;
        case "toggleComments":
          toggleComments();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    settings.shortcuts,
    volume,
    isMuted,
    toggleMute,
    togglePaused,
    seek,
    settingsLoading,
    settings.seekDuration,
  ]);

  useEffect(() => {
    if (!mediaRef.current) return;

    const fetchSkipTimes = async (malId, episodeNumber) => {
      skipTimesRef.current = [];
      skippedIdRef.current = null;

      if (!settings.skipIntro && !settings.skipOutro && !settings.skipRecap) {
        return;
      }

      try {
        const episodeLength = mediaRef.current?.duration || 0;
        const url = `https://api.aniskip.com/v2/skip-times/${malId}/${episodeNumber}?types=op&types=ed&types=recap&episodeLength=${episodeLength}`;

        const resp = await fetch(url);

        if (resp.ok) {
          const aniskipData = await resp.json();
          if (aniskipData.found && aniskipData.results) {
            skipTimesRef.current = aniskipData.results;
            console.log("AniSkip: Found times:", aniskipData.results);
          } else {
            console.log("AniSkip: No skip times found.");
          }
        } else {
          console.error(`AniSkip API request failed: ${resp.status}`);
        }
      } catch (error) {
        console.error("Error fetching AniSkip data:", error);
      }
    };

    fetchSkipTimes(animeDetails.idMal, episode.episode_number);

    (async () => {
      let progress = null;
      const episodeKey = `${animeDetails.id}-${episode.episode_number}`;

      try {
        if (session?.user?.name) {
          progress = await getUserProgress(
            session.user.name,
            animeDetails.id,
            episode.episode_number,
          );
          if (progress) {
            console.log(`Found progress in DB for ${episodeKey}:`, progress);
          }
        } else {
          const GUEST_PROGRESS_KEY = "anime-progress";
          const existingProgressString =
            localStorage.getItem(GUEST_PROGRESS_KEY);

          if (existingProgressString) {
            const progressMap = new Map(JSON.parse(existingProgressString));
            progress = progressMap.get(episodeKey);
            progress = progress?.progress;
            if (progress) {
              console.log(
                `Found progress in LocalStorage for ${episodeKey}:`,
                progress,
              );
            }
          }
        }

        if (progress && mediaRef.current) {
          const numericProgress = Number(progress);
          if (!isNaN(numericProgress) && numericProgress > 0) {
            mediaRef.current.currentTime = numericProgress;
          }
        }
      } catch (error) {
        console.error(`Failed to get progress for ${episodeKey}:`, error);
      }
    })();

    (async () => {
      try {
        const aniProgress = await getProgress(animeDetails.id);
        if (aniProgress) {
          setAnilistProgress(aniProgress);
        }
      } catch (error) {
        console.error("Failed to get Anilist progress:", error);
      }
    })();

    let savedSettings = localStorage.getItem("realms-player");
    let currentSettings = savedSettings ? JSON.parse(savedSettings) : {};
    if (currentSettings.timeFormat) {
      setTimeFormat(currentSettings.timeFormat);
    }
    if (currentSettings.playbackRate) {
      mediaRef.current.playbackRate = currentSettings.playbackRate;
    }
    if (
      currentSettings.autoplay === true ||
      currentSettings.autoplay === undefined
    ) {
      togglePlay();
    }

    if (currentSettings.generateThumbnails !== undefined) {
      setGenerateThumbnails(currentSettings.generateThumbnails);
    } else {
      setGenerateThumbnails(true);
    }
  }, [
    mediaRef,
    session,
    animeDetails,
    episode,
    getUserProgress,
    setTimeFormat,
    src,
  ]);

  const isSwitchingProviderRef = useRef(false);

  const handleProviderSwitch = useCallback(async () => {
    if (isSwitchingProviderRef.current) return;
    isSwitchingProviderRef.current = true;

    const currentProviderKey = Object.keys(providersConfig).find(
      (key) => providersConfig[key].short === providerConfig?.short,
    );

    const providersList = settings.providerOrder || providerNames;
    const currentIndex = providersList.indexOf(currentProviderKey);

    // Find next available provider
    let nextIndex = currentIndex + 1;
    if (nextIndex >= providersList.length) {
      console.warn("[PLAYER] No more providers to switch to.");
      toast.error(t("playbackError"), {
        position: "top-center",
        toasterId: "player-toaster",
      });
      isSwitchingProviderRef.current = false;
      return;
    }

    const nextProviderKey = providersList[nextIndex];
    console.log(`[PLAYER] Switching to next provider: ${nextProviderKey}`);
    const toastId = toast.loading(
      t("errorSwitchingProvider", {
        provider: providersConfig[nextProviderKey].name,
      }),
      {
        position: "top-center",
        toasterId: "player-toaster",
      },
    );

    try {
      const anilistIdNum = parseInt(animeDetails.id);
      const episodeNumberNum = parseInt(episode.episode_number);
      const response = await fetch(`/api/watch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: nextProviderKey,
          anilistId: anilistIdNum,
          episodeNumber: episodeNumberNum,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.streams && result.streams.length > 0) {
        const newProviderConfig = {
          ...providersConfig[nextProviderKey],
          ref: result?.streams[0]?.headers?.Referer,
        };
        setProviderConfig(newProviderConfig);
        setStreams(result.streams);
        setSrc(result.streams[0].url);
        if (setSubtitles) {
          setSubtitles(result.subtitles || []);
        }
        toast.dismiss(toastId);
        toast.success(tWatch("streamSuccess"), {
          position: "top-center",
          toasterId: "player-toaster",
        });
      } else {
        toast.dismiss(toastId);
        toast.error(tWatch("streamNotFound"), {
          position: "top-center",
          toasterId: "player-toaster",
        });
        // doesn't have so go to next
        handleProviderSwitch();
      }
    } catch (error) {
      console.error("[PLAYER] Provider switch failed:", error);
      toast.dismiss(toastId);
      toast.error(
        t("streamError", {
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          position: "top-center",
          toasterId: "player-toaster",
        },
      );
    } finally {
      isSwitchingProviderRef.current = false;
    }
  }, [
    providerConfig,
    settings.providerOrder,
    animeDetails.id,
    episode.episode_number,
    setProviderConfig,
    setStreams,
    setSrc,
    setSubtitles,
    t,
  ]);

  const handlePlaybackError = useCallback(
    (error: unknown) => {
      if (streams && streams.length > 0) {
        const currentStreamIndex = streams.findIndex((s: any) => s.url === src);
        if (
          currentStreamIndex !== -1 &&
          currentStreamIndex < streams.length - 1
        ) {
          const nextStream = streams[currentStreamIndex + 1];
          console.log(
            `[PLAYER] Error occurred, switching to next source: ${nextStream.quality}`,
          );
          setSrc(nextStream.url);
          toast.error(
            t("errorSwitchingSource", { quality: nextStream.quality }),
            {
              position: "top-center",
              toasterId: "player-toaster",
            },
          );
          return;
        }
      }

      console.warn(
        "[PLAYER] Playback error and no alternative sources. Switching provider...",
      );
      handleProviderSwitch();
    },
    [streams, src, setSrc, t, handleProviderSwitch],
  );

  return (
    <div
      ref={containerRef}
      className={`normal-captions group overflow-hidden bg-black ${
        !showControls ? "cursor-none" : ""
      } transition-all duration-300 ease-in-out ${
        isDesktop && isCommentsOpen
          ? "fixed top-0 left-0 bottom-0"
          : "fixed inset-0"
      }`}
      style={{
        width:
          isDesktop && isCommentsOpen
            ? `calc(100% - ${commentsWidth}px)`
            : "100%",
      }}
    >
      <Toaster id="player-toaster" position="top-center" visibleToasts={1} />
      <ThumbnailScraper
        key={processedSrc}
        source={processedSrc}
        provider={providerConfig}
        generateThumbnails={generateThumbnails}
        onThumbnailUpdate={setThumbnails}
      />
      <div
        className={`absolute inset-0 flex items-center justify-between text-white z-20 pointer-events-none transition-opacity duration-300 ${
          skipIndicator.show ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`p-8 sm:p-20 transition-all duration-300 ease-out ${
            skipIndicator.direction === "backward"
              ? "scale-100"
              : "scale-50 opacity-0"
          }`}
        >
          <div className="bg-accent/50 p-2 rounded-full">
            <Icon
              icon="solar:rewind-10-seconds-back-bold"
              className="w-12 h-12"
            />
          </div>
        </div>
        <div
          className={`p-8 sm:p-20 transition-all duration-300 ease-out ${
            skipIndicator.direction === "forward"
              ? "scale-100"
              : "scale-50 opacity-0"
          }`}
        >
          <div className="bg-accent/50 p-2 rounded-full">
            <Icon
              icon="solar:rewind-10-seconds-forward-bold"
              className="w-12 h-12"
            />
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-0 ${
          showControls ? "cursor-pointer" : "cursor-none"
        } z-10 w-full h-full`}
        onClick={handleOverlayClick}
      />

      <div
        className={`absolute pb-32 bg-gradient-to-b from-black to-transparent transition-opacity duration-200 w-full z-12 ${
          !showControls
            ? "opacity-0 -translate-y-full pointer-events-none"
            : "opacity-100 translate-y-0"
        }
        `}
      >
        <div className="px-2 sm:px-4 py-2 sm:py-3 w-full grid grid-cols-2 sm:grid-cols-3 z-12">
          <div className="flex justify-start min-w-0">
            <Link href="/" className="min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/")}
                className="text-white/90 hover:text-white hover:bg-accent/30 text-xs font-medium transition-all duration-200 px-2 py-1 rounded-lg min-w-0"
              >
                <Icon
                  icon="solar:arrow-left-bold"
                  className="h-4 w-4 sm:h-6 sm:w-6 mr-1 flex-shrink-0"
                />
                <div className="truncate">
                  {t("back")} {" / "}{" "}
                  <span className="text-muted-foreground">
                    {(animeDetails.title.english || animeDetails.title.romaji)
                      .length > 50
                      ? (
                          animeDetails.title.english ||
                          animeDetails.title.romaji
                        ).slice(0, 50) + "..."
                      : animeDetails.title.english || animeDetails.title.romaji}
                  </span>
                </div>
              </Button>
            </Link>
          </div>

          <div className="hidden sm:flex flex-row gap-1 items-center justify-center text-center text-md line-clamp-1">
            <span>E{episode.episode_number}</span>
            <span className="text-muted-foreground line-clamp-1">
              {episode.name || episode.title}
            </span>
          </div>
          <Link href="/" className="flex justify-end w-full">
            <img
              src="/logo.jpg"
              alt={t("realmsLogo")}
              className="w-auto h-8 rounded-2xl opacity-50"
            />
          </Link>
        </div>
      </div>

      <div
        className={`sm:hidden absolute inset-0 flex items-center justify-center gap-2 bg-black/50 z-11 transition-opacity ease-in-out duration-200 ${
          !showControls ? "opacity-0" : "opacity-100"
        }`}
      >
        <PlayerButton
          onClick={seekBackward}
          className="hover:scale-110 transition-transform duration-200"
        >
          <svg
            className="h-8 w-8"
            viewBox="0 0 25 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.6667 12.3333L9 7.66667M9 7.66667L13.6667 3M9 7.66667H18.3333C19.571 7.66667 20.758 8.15833 21.6332 9.0335C22.5083 9.90867 23 11.0957 23 12.3333C23 13.571 22.5083 14.758 21.6332 15.6332C20.758 16.5083 19.571 17 18.3333 17H16"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.50426 14.2727V23H2.65909V16.0241H2.60795L0.609375 17.277V15.6406L2.76989 14.2727H4.50426ZM10.0004 23.1918C9.2674 23.1889 8.63672 23.0085 8.10831 22.6506C7.58274 22.2926 7.17791 21.7741 6.89382 21.0952C6.61257 20.4162 6.47337 19.5994 6.47621 18.6449C6.47621 17.6932 6.61683 16.8821 6.89808 16.2116C7.18217 15.5412 7.587 15.0312 8.11257 14.6818C8.64098 14.3295 9.27024 14.1534 10.0004 14.1534C10.7305 14.1534 11.3583 14.3295 11.8839 14.6818C12.4123 15.0341 12.8185 15.5455 13.1026 16.2159C13.3867 16.8835 13.5273 17.6932 13.5245 18.6449C13.5245 19.6023 13.3825 20.4205 13.0984 21.0994C12.8171 21.7784 12.4137 22.2969 11.8881 22.6548C11.3626 23.0128 10.7333 23.1918 10.0004 23.1918ZM10.0004 21.6619C10.5004 21.6619 10.8995 21.4105 11.1978 20.9077C11.4961 20.4048 11.6438 19.6506 11.641 18.6449C11.641 17.983 11.5728 17.4318 11.4364 16.9915C11.3029 16.5511 11.1126 16.2202 10.8654 15.9986C10.6211 15.777 10.3327 15.6662 10.0004 15.6662C9.5032 15.6662 9.10547 15.9148 8.80717 16.4119C8.50888 16.9091 8.35831 17.6534 8.35547 18.6449C8.35547 19.3153 8.42223 19.875 8.55575 20.3239C8.69212 20.7699 8.88388 21.1051 9.13104 21.3295C9.3782 21.5511 9.66797 21.6619 10.0004 21.6619Z"
              fill="currentColor"
            />
          </svg>
        </PlayerButton>
        <PlayerButton
          onClick={togglePlay}
          className="hover:scale-110 transition-transform duration-200"
        >
          <Icon
            icon={status === "playing" ? "solar:pause-bold" : "solar:play-bold"}
            className="h-12 w-12"
          />
        </PlayerButton>
        <PlayerButton
          onClick={seekForward}
          className="hover:scale-110 transition-transform duration-200"
        >
          <svg
            className="h-8 w-8"
            viewBox="0 0 26 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.3333 12.3333L16 7.66667M16 7.66667L11.3333 3M16 7.66667H6.66667C5.42899 7.66667 4.242 8.15833 3.36684 9.0335C2.49167 9.90867 2 11.0957 2 12.3333C2 13.571 2.49167 14.758 3.36684 15.6332C4.242 16.5083 5.42899 17 6.66667 17H9"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16.5043 14.2727V23H14.6591V16.0241H14.608L12.6094 17.277V15.6406L14.7699 14.2727H16.5043ZM22.0004 23.1918C21.2674 23.1889 20.6367 23.0085 20.1083 22.6506C19.5827 22.2926 19.1779 21.7741 18.8938 21.0952C18.6126 20.4162 18.4734 19.5994 18.4762 18.6449C18.4762 17.6932 18.6168 16.8821 18.8981 16.2116C19.1822 15.5412 19.587 15.0312 20.1126 14.6818C20.641 14.3295 21.2702 14.1534 22.0004 14.1534C22.7305 14.1534 23.3583 14.3295 23.8839 14.6818C24.4123 15.0341 24.8185 15.5455 25.1026 16.2159C25.3867 16.8835 25.5273 17.6932 25.5245 18.6449C25.5245 19.6023 25.3825 20.4205 25.0984 21.0994C24.8171 21.7784 24.4137 22.2969 23.8881 22.6548C23.3626 23.0128 22.7333 23.1918 22.0004 23.1918ZM22.0004 21.6619C22.5004 21.6619 22.8995 21.4105 23.1978 20.9077C23.4961 20.4048 23.6438 19.6506 23.641 18.6449C23.641 17.983 23.5728 17.4318 23.4364 16.9915C23.3029 16.5511 23.1126 16.2202 22.8654 15.9986C22.6211 15.777 22.3327 15.6662 22.0004 15.6662C21.5032 15.6662 21.1055 15.9148 20.8072 16.4119C20.5089 16.9091 20.3583 17.6534 20.3555 18.6449C20.3555 19.3153 20.4222 19.875 20.5558 20.3239C20.6921 20.7699 20.8839 21.1051 21.131 21.3295C21.3782 21.5511 21.668 21.6619 22.0004 21.6619Z"
              fill="currentColor"
            />
          </svg>
        </PlayerButton>
      </div>

      {status === "buffering" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}

      <div
        ref={captionContainerRef}
        className="absolute inset-0 z-10 pointer-events-none"
      />

      <MediaElement
        src={processedSrc}
        poster={poster || ""}
        onError={handlePlaybackError}
      />
      <PlayerHooks />
      <IdleOverlay
        visible={showIdleOverlay}
        logoUrl={logoUrl}
        animeDetails={animeDetails}
        episode={episode}
      />
      <div className={`absolute text-white inset-x-0 bottom-0 z-12`}>
        <div
          className={`absolute ${
            showControls ? "bottom-16 sm:bottom-20" : "bottom-10 sm:bottom-12"
          } right-4 transition-all duration-300 ease-in-out z-50 ${
            manualSkip.show
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <Button
            onClick={handleManualSkip}
            className="bg-white text-black hover:bg-white/90 font-semibold shadow-lg transition-all"
          >
            {manualSkip.label}
            <Icon icon="solar:skip-next-bold" className="ml-2 w-4 h-4" />
          </Button>
        </div>
        <CaptionsContainer className="bg-0" />
        <BottomControls
          containerRef={containerRef}
          currentTime={currentTime}
          duration={duration}
          status={status}
          togglePaused={togglePaused}
          togglePlay={togglePlay}
          seekForward={seekForward}
          seekBackward={seekBackward}
          handleSeek={handleSeek}
          handleSeekCommit={handleSeekCommit}
          formatTime={formatTime}
          timeFormat={timeFormat}
          toggleTimeFormat={toggleTimeFormat}
          isMuted={isMuted}
          volume={volume}
          handleVolumeChange={handleVolumeChange}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          handleScreenshot={handleScreenshot}
          getAdvancedString={(duration, currentTime) =>
            getAdvancedString(duration, currentTime, t)
          }
          providerConfig={providerConfig}
          src={processedSrc}
          setSrc={setSrc}
          streams={streams}
          setStreams={setStreams}
          episode={episode}
          episodes={episodes}
          animeDetails={animeDetails}
          poster={poster}
          setProviderConfig={setProviderConfig}
          setSubtitles={setSubtitles}
          skipTimes={skipTimesRef.current}
          handleNextEpisode={handleNextEpisode}
          showControls={showControls}
          anilistProgress={anilistProgress}
          onPopoverOpenChange={setIsPopoverOpen}
          thumbnails={thumbnails}
          buffered={buffered}
          toggleComments={toggleComments}
          toggleCaptionVisibility={toggleCaptionVisibility}
        />
      </div>
    </div>
  );
}

export function MediaPlayer(props: PlayerProps) {
  return (
    <MediaProvider>
      <RootContainer>
        <MediaPlayerInternal {...props} toggleComments={props.toggleComments} />
      </RootContainer>
    </MediaProvider>
  );
}
