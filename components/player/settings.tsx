"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import PlayerButton from "@/components/limeplay/player-button";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { cn, getDeviceLanguage } from "@/lib/utils";
import { providerNames, providersConfig } from "@/lib/providers/list";
import { CheckIcon, Loader2 } from "lucide-react"; // Added Loader2
import { LayoutGroup, AnimatePresence, motion } from "framer-motion";
import {
  useMediaStore,
  useGetStore,
} from "@/components/limeplay/media-provider";
import { useParams } from "next/navigation";
import { Badge } from "../ui/badge";
import { useSettings } from "@/components/settings-context";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCaptions } from "@/hooks/limeplay/use-captions";
import { useQuality } from "@/hooks/limeplay/use-quality";
import { fetchCommunitySubtitles } from "./actions/subtitles";
import {
  SettingItem,
  SettingSliderItem,
  SettingSelectItem,
  SettingColorPicker,
  SettingToggleGroup,
} from "../settings/setting-helpers";

// Define a type for the provider status
type ProviderStatus = {
  status: "idle" | "loading" | "success" | "error" | "notFound";
  message?: string;
};

// Define a type for the provider status state object
type ProviderStatusState = {
  [key: string]: ProviderStatus;
};

export default function Settings({
  containerRef,
  providerConfig,
  src,
  setSrc,
  streams,
  setStreams,
  setProviderConfig,
  setSubtitles,
  onOpenChange,
  animeDetails,
  episode,
}) {
  const t = useTranslations("Player");
  const [stream, setStream] = useState(streams[0]);
  const [view, setView] = useState<
    | "main"
    | "playback"
    | "providers"
    | "quality"
    | "subtitles"
    | "subtitlesCustomize"
    | "playbackQuality"
  >("main");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [autoplay, setAutoplay] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [generateThumbnails, setGenerateThumbnails] = useState(true);

  // State to track status for each provider
  const [providerStatus, setProviderStatus] = useState<ProviderStatusState>({});

  // Subtitles
  const [communitySubs, setCommunitySubs] = useState<any[]>([]);
  const [isSubsLoading, setIsSubsLoading] = useState(false);
  const store = useGetStore();

  const { anime, episode_number } = useParams();

  const mediaRef = useMediaStore((state) => state.mediaRef);
  const {
    settings,
    updateSetting,
    save,
    isLoading: isSettingsLoading,
  } = useSettings();
  const { toggleCaptionVisibility, selectTrack, textTracks, activeTextTrack } =
    useCaptions();
  const { isAuto, levels, activeLevel, selectLevel } = useQuality();
  const isTextTrackVisible = useMediaStore((s) => s.textTrackVisible);
  const player = useMediaStore((s) => s.player);
  useEffect(() => {
    if (!mediaRef.current) return;

    let savedSettings = localStorage.getItem("realms-player");
    let currentSettings = savedSettings ? JSON.parse(savedSettings) : {};
    console.log(`CURRENT SETTINGS: ${JSON.stringify(currentSettings)}`);
    if (currentSettings.playbackRate !== undefined) {
      console.log(`PLAYBACK RATE: ${currentSettings.playbackRate}`);
      setPlaybackSpeed(currentSettings.playbackRate);
    }
    if (currentSettings.autoplay !== undefined) {
      console.log(`AUTOPLAY: ${currentSettings.autoplay}`);
      setAutoplay(currentSettings.autoplay === true);
    } else {
      console.log(`NO AUTOPLAY FOUND`);
    }
    if (currentSettings.generateThumbnails !== undefined) {
      console.log(`GENERATE THUMBNAILS: ${currentSettings.generateThumbnails}`);
      setGenerateThumbnails(currentSettings.generateThumbnails === true);
    } else {
      console.log(`NO GEN THUMB FOUND`);
    }
    if (currentSettings.autoNext !== undefined) {
      setAutoNext(currentSettings.autoNext === true);
    }
    if (player && currentSettings.subtitles !== undefined) {
      if (player.isTextTrackVisible() !== currentSettings.subtitles) {
        player.setTextTrackVisibility(currentSettings.subtitles);
      }
    }
  }, [mediaRef, player]);

  useEffect(() => {
    if (!mediaRef.current || !streams.length) return;
    // set stream by matching the src
    if (streams.length > 0) {
      console.log(`STREAMS: ${JSON.stringify(streams)}`);
      console.log(`SRC: ${src}`);
      let currentStream = streams.find((s) => s.url === src);
      if (currentStream) {
        console.log(`CURRENT STREAM: ${JSON.stringify(currentStream)}`);
        setStream(currentStream);
      }
    } else {
      console.log("No streams found");
    }
  }, [mediaRef, streams, src]);

  // Auto-save subtitle settings changes
  useEffect(() => {
    if (view === "subtitlesCustomize" && settings.hasUnsavedChanges) {
      const timer = setTimeout(() => {
        save();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [settings.subtitleSettings, view, settings.hasUnsavedChanges, save]);

  const handlePlaybackRateSelect = (rate) => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = rate;
      setPlaybackSpeed(rate); // Read, update, and write the settings object

      try {
        const storedSettings = localStorage.getItem("realms-player");
        const currentSettings = storedSettings
          ? JSON.parse(storedSettings)
          : {};
        const updatedSettings = { ...currentSettings, playbackRate: rate };
        localStorage.setItem("realms-player", JSON.stringify(updatedSettings));
      } catch (error) {
        console.error("Failed to save playback rate setting", error);
      }
    }
  };

  const toggleAutoNext = () => {
    setAutoNext(!autoNext);
    try {
      const storedSettings = localStorage.getItem("realms-player")
        ? JSON.parse(localStorage.getItem("realms-player"))
        : {};
      const updatedSettings = { ...storedSettings, autoNext: !autoNext };
      localStorage.setItem("realms-player", JSON.stringify(updatedSettings));
    } catch (error) {
      console.error("Failed to save autoNext setting", error);
    }
  };

  const toggleAutoPlay = () => {
    setAutoplay(!autoplay);
    try {
      const storedSettings = localStorage.getItem("realms-player")
        ? JSON.parse(localStorage.getItem("realms-player"))
        : {};
      const updatedSettings = { ...storedSettings, autoplay: !autoplay };
      localStorage.setItem("realms-player", JSON.stringify(updatedSettings));
    } catch (error) {
      console.error("Failed to save autoplay setting", error);
    }
  };

  const toggleSubtitles = () => {
    toggleCaptionVisibility();

    try {
      const storedSettings = localStorage.getItem("realms-player")
        ? JSON.parse(localStorage.getItem("realms-player"))
        : {};
      const updatedSettings = {
        ...storedSettings,
        subtitles: !isTextTrackVisible,
      };
      localStorage.setItem("realms-player", JSON.stringify(updatedSettings));
    } catch (error) {
      console.error("Failed to save subtitles setting", error);
    }
  };

  const toggleGenerateThumbnails = () => {
    setGenerateThumbnails(!generateThumbnails);
    try {
      const storedSettings = localStorage.getItem("realms-player")
        ? JSON.parse(localStorage.getItem("realms-player"))
        : {};
      const updatedSettings = {
        ...storedSettings,
        generateThumbnails: !generateThumbnails,
      };
      localStorage.setItem("realms-player", JSON.stringify(updatedSettings));
    } catch (error) {
      console.error("Failed to save autoplay setting", error);
    }
  };

  const handleProviderSelect = async (providerKey) => {
    // Set status to loading for the clicked provider
    setProviderStatus((prev) => ({
      ...prev,
      [providerKey]: { status: "loading" },
    }));

    const cacheKey = `watch-cache:${anime}:${episode_number}:${providerKey}`;
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
      console.log(`[SETTINGS] Used Cached Result for provider ${providerKey}`);
      // Set status to success
      setProviderStatus((prev) => ({
        ...prev,
        [providerKey]: { status: "success" },
      }));
      // Update streams and provider condig
      const newProviderConfig = {
        ...providersConfig[providerKey],
        ref: cachedResult?.streams[0]?.headers?.Referer,
      };
      setProviderConfig(newProviderConfig);
      setStreams(cachedResult.streams);
      setSrc(cachedResult.streams[0].url);
      if (setSubtitles) {
        if (cachedResult.subtitles) {
          setSubtitles(cachedResult.subtitles);
        } else {
          setSubtitles([]);
        }
      } else {
        console.warn("setSubtitles function not passed to Settings component.");
      }

      if (settings.prioritiseLastUsedSource) {
        try {
          const anilistId = anime as string;
          const lastUsedProviders = JSON.parse(
            localStorage.getItem("last-used-providers") || "{}"
          );
          lastUsedProviders[anilistId] = providerKey;
          localStorage.setItem(
            "last-used-providers",
            JSON.stringify(lastUsedProviders)
          );
        } catch (e) {
          console.error("Failed to save last used provider:", e);
        }
      }
      return;
    }

    try {
      const anilistIdNum = parseInt(anime as string);
      const episodeNumberNum = parseInt(episode_number as string);
      const response = await fetch(`/api/watch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerKey,
          anilistId: anilistIdNum,
          episodeNumber: episodeNumberNum,
          config:
            providerKey === "febbox"
              ? { cookie: settings.febboxUiToken }
              : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      const success = result.streams && result.streams.length > 0;
      console.log(`PROVIDER CHANGE RESULT: ${JSON.stringify(result)}`);

      if (success) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(result));
        } catch (e) {
          console.error("Failed to save to session storage", e);
        }

        // Set status to success
        setProviderStatus((prev) => ({
          ...prev,
          [providerKey]: { status: "success" },
        }));
        // Update streams and provider condig
        const newProviderConfig = {
          ...providersConfig[providerKey],
          ref: result?.streams[0]?.headers?.Referer,
        };
        setProviderConfig(newProviderConfig);
        setStreams(result.streams);
        setSrc(result.streams[0].url);
        if (setSubtitles) {
          if (result.subtitles) {
            setSubtitles(result.subtitles);
          } else {
            setSubtitles([]);
          }
        } else {
          console.warn(
            "setSubtitles function not passed to Settings component."
          );
        }

        if (settings.prioritiseLastUsedSource) {
          try {
            const anilistId = anime as string;
            const lastUsedProviders = JSON.parse(
              localStorage.getItem("last-used-providers") || "{}"
            );
            lastUsedProviders[anilistId] = providerKey;
            localStorage.setItem(
              "last-used-providers",
              JSON.stringify(lastUsedProviders)
            );
          } catch (e) {
            console.error("Failed to save last used provider:", e);
          }
        }
      } else if (result.notFound) {
        // Set status to notFound
        setProviderStatus((prev) => ({
          ...prev,
          [providerKey]: { status: "notFound", message: t("notFound") },
        }));
      } else if (result.error) {
        // Set status to error with message
        setProviderStatus((prev) => ({
          ...prev,
          [providerKey]: { status: "error", message: result.error },
        }));
      } else {
        // Generic failure if no streams but no specific error/notFound flag
        setProviderStatus((prev) => ({
          ...prev,
          [providerKey]: { status: "error", message: t("noStreams") },
        }));
      }
    } catch (err) {
      console.error("Provider change error:", err);
      // Set status to error
      setProviderStatus((prev) => ({
        ...prev,
        [providerKey]: {
          status: "error",
          message: err.message || t("unknownError"),
        },
      }));
    }
  };

  const providersToUse = useMemo(() => {
    if (isSettingsLoading) {
      return null; // Return null (or default) while loading
    }
    return settings.providerOrder || providerNames;
  }, [isSettingsLoading, settings.providerOrder]);

  const speedOptions = [0.25, 0.5, 1, 1.5, 2];
  const renderContent = () => {
    switch (view) {
      case "main":
        return (
          <motion.div layout="position" className="py-4 space-y-4">
            {/* Grid of setting cards */}
            <div className="grid grid-cols-2 gap-3 px-4">
              <button
                className="bg-muted/50 hover:bg-muted/70 transition-colors rounded-xl p-4 text-left"
                onClick={() => setView("quality")}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {t("quality")}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {stream?.quality || t("auto")}
                </div>
              </button>
              <button
                className="bg-muted/50 hover:bg-muted/70 transition-colors rounded-xl p-4 text-left"
                onClick={() => setView("providers")}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {t("provider")}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {providerConfig.name}
                </div>
              </button>
              <button
                className="bg-muted/50 hover:bg-muted/70 transition-colors rounded-xl p-4 text-left"
                onClick={() => setView("subtitles")}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {t("subtitles")}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {isTextTrackVisible
                    ? activeTextTrack?.label || t("on")
                    : t("off")}
                </div>
              </button>
              <button className="bg-muted/50 hover:bg-muted/70 transition-colors rounded-xl p-4 text-left">
                <div className="text-sm text-muted-foreground mb-1">
                  {t("audio")}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {providerConfig
                    ? providerConfig?.name?.includes("Dub")
                      ? t("dub")
                      : t("sub")
                    : t("sub")}
                </div>
              </button>
            </div>

            {/* Download option */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (stream?.downloadLink) {
                      window.open(stream.downloadLink, "_blank");
                    } else {
                      const titleRaw =
                        animeDetails.title.english ||
                        animeDetails.title.romaji ||
                        "Unknown Anime";
                      const safeTitle = titleRaw
                        .replace(/[\/\\?%*:|"<>]/g, "")
                        .trim();

                      const totalEps = animeDetails.episodes;
                      const padLength = totalEps ? String(totalEps).length : 2;

                      const epNum = String(episode.episode_number).padStart(
                        padLength,
                        "0"
                      );

                      const fileName = `[${providerConfig.name}] ${safeTitle} - ${epNum}`;

                      const customUrl = `https://download.animerealms.org/?url=${encodeURIComponent(
                        src
                      )}&filename=${encodeURIComponent(fileName)}`;

                      window.open(customUrl, "_blank");
                    }
                  }}
                  className="w-full flex items-center justify-between py-3 hover:bg-muted/30 rounded-lg transition-colors px-4"
                >
                  <span className="text-sm text-muted-foreground">
                    {t("download")}
                  </span>
                  <Icon
                    icon="solar:download-linear"
                    className="h-5 w-5 text-muted-foreground"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent className={`bg-muted text-white`}>
                {stream?.downloadLink
                  ? t("downloadAvailable")
                  : "Custom Download (beta)"}
              </TooltipContent>
            </Tooltip>

            {/* Watch Party option */}
            <button className="w-full flex items-center justify-between py-3 px-1 hover:bg-muted/30 rounded-lg transition-colors px-4">
              <span className="text-sm text-muted-foreground">
                {t("watchParty")}
              </span>
              <Icon
                icon="solar:podcast-linear"
                className="h-5 w-5 text-muted-foreground"
              />
            </button>

            <div className="border-t border-border/50 pt-4 space-y-4">
              {/* Playback settings navigation */}
              <button
                onClick={() => setView("playback")}
                className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted/30 rounded-lg transition-colors"
              >
                <span className="text-sm text-muted-foreground">
                  {t("playbackSettings")}
                </span>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="h-5 w-5 text-muted-foreground"
                />
              </button>
            </div>
          </motion.div>
        );

      case "subtitles":
        return (
          <motion.div layout="position" className="p-4 space-y-6">
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView("main")}
                  className="hover:bg-muted/50 rounded-lg p-1 transition-colors"
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="h-5 w-5 text-muted-foreground"
                  />
                </button>
                <h3 className="text-base font-medium text-muted-foreground">
                  {t("subtitles")}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/90 p-0 h-auto"
                onClick={() => setView("subtitlesCustomize")}
              >
                Customize
              </Button>
            </div>

            {/* Subtitles toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("subtitles")}
              </span>
              <Switch
                checked={isTextTrackVisible}
                onCheckedChange={toggleSubtitles}
              />
            </div>

            {/* Upload Custom Subtitle */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="sub-upload"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer text-sm font-medium text-foreground border border-dashed border-border/50"
              >
                <Icon icon="solar:upload-linear" className="h-5 w-5" />
                Upload Custom Subtitles
              </label>
              <input
                id="sub-upload"
                type="file"
                accept=".srt,.vtt,.ass"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    const label = file.name;
                    // Add to player
                    if (mediaRef.current) {
                      const playerInstance = store.getState().player;
                      if (playerInstance) {
                        let mime = "text/plain";
                        if (file.name.endsWith(".vtt")) mime = "text/vtt";
                        if (file.name.endsWith(".srt")) mime = "text/srt";

                        playerInstance
                          .addTextTrackAsync(url, label, "subtitle", mime)
                          .then((track) => {
                            playerInstance.selectTextTrack(track);
                            playerInstance.setTextTrackVisibility(true);
                          });
                      }
                    }
                  }
                }}
              />
            </div>

            {/* Fetch Community Subtitles */}
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  setIsSubsLoading(true);
                  try {
                    // Extract anilist ID and episode number from params or props
                    // We have `anime` (string id) and `episode_number` from params
                    // We need season number. Currently we might default to 1 or try to parse.
                    // The action accepts (anilistId, episodeNumber, seasonNumber)
                    // We'll guess season 1 for now or use logic if available.
                    const aid = Number(anime);
                    const ep = Number(episode_number);
                    const res = await fetchCommunitySubtitles(aid, ep, 1);
                    if (res.success && res.subtitles) {
                      setCommunitySubs(res.subtitles);
                    } else {
                      console.error(res.error);
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSubsLoading(false);
                  }
                }}
                disabled={isSubsLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors text-sm font-medium text-foreground"
              >
                {isSubsLoading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <Icon
                    icon="solar:cloud-download-linear"
                    className="h-5 w-5"
                  />
                )}
                Fetch Community Subtitles
              </button>
            </div>

            {/* Community Subs List */}
            {communitySubs.length > 0 && (
              <div className="border-t border-border/50 pt-4 space-y-2 max-h-[200px] overflow-y-scroll no-scrollbar">
                <div className="text-sm text-muted-foreground mb-2">
                  Community
                </div>
                {communitySubs.map((sub, idx) => (
                  <button
                    key={sub.id + idx}
                    onClick={() => {
                      const playerInstance = store.getState().player;
                      if (playerInstance) {
                        // wyzie-lib subtitles are usually URLs.
                        // We might need to proxy them if CORS is an issue?
                        // The URL might be already proxied or direct.
                        playerInstance
                          .addTextTrackAsync(
                            sub.url,
                            sub.label,
                            "subtitles",
                            "text/srt"
                          )
                          .then((track) => {
                            playerInstance.selectTextTrack(track);
                            playerInstance.setTextTrackVisibility(true);
                          });
                      }
                    }}
                    className="w-full flex items-center justify-between py-2 hover:bg-muted/30 rounded-lg transition-colors text-muted-foreground text-left px-2"
                  >
                    <span className="line-clamp-1 text-sm">{sub.label}</span>
                    <Icon icon="solar:add-circle-linear" className="h-4 w-4" />
                  </button>
                ))}
              </div>
            )}

            {isTextTrackVisible && textTracks && textTracks.length > 0 && (
              <div className="border-t border-border/50 pt-4 space-y-2 max-h-[400px] overflow-y-scroll no-scrollbar">
                <div className="text-sm text-muted-foreground mb-2">Track</div>
                {textTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => selectTrack(track)}
                    className={cn(
                      "w-full flex items-center justify-between py-2 hover:bg-muted/30 rounded-lg transition-colors",
                      activeTextTrack?.id === track.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <span className="flex items-center justify-between w-full text-left line-clamp-2">
                      <span>{track.label || track.language}</span>
                    </span>
                    <span>
                      {activeTextTrack?.id === track.id && (
                        <CheckIcon className="size-4" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        );
      case "playback":
        return (
          <motion.div layout="position" className="p-4 space-y-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("main")}
                className="hover:bg-muted/50 rounded-lg p-1 transition-colors"
              >
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="h-5 w-5 text-muted-foreground"
                />
              </button>
              <h3 className="text-base font-medium text-muted-foreground">
                {t("playbackSettings")}
              </h3>
            </div>

            {/* Playback speed */}
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {t("playbackSpeed")}
              </div>
              <div className="flex gap-2">
                {speedOptions.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handlePlaybackRateSelect(speed)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                      playbackSpeed === speed
                        ? "bg-muted text-foreground"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Autoplay toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("autoplay")}
              </span>
              <Switch checked={autoplay} onCheckedChange={toggleAutoPlay} />
            </div>

            {/* AutoNext toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("autoNext")}
              </span>
              <Switch checked={autoNext} onCheckedChange={toggleAutoNext} />
            </div>

            {/* Generate thumbnails toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("generateThumbnails")}
              </span>
              <Switch
                checked={generateThumbnails}
                onCheckedChange={toggleGenerateThumbnails}
              />
            </div>
          </motion.div>
        );

      case "subtitlesCustomize":
        return (
          <motion.div layout="position" className="p-4 space-y-6 ">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("subtitles")}
                className="hover:bg-muted/50 rounded-lg p-1 transition-colors"
              >
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="h-5 w-5 text-muted-foreground"
                />
              </button>
              <h3 className="text-base font-medium text-muted-foreground">
                Customize Subtitles
              </h3>
            </div>

            <div className="max-h-[400px]">
              <SettingSliderItem
                title="Background Opacity"
                description="Adjust opacity of subtitle background"
                value={settings.subtitleSettings.backgroundOpacity * 100}
                onValueChange={(value) =>
                  updateSetting("subtitleSettings", {
                    ...settings.subtitleSettings,
                    backgroundOpacity: value[0] / 100,
                  })
                }
                min={0}
                max={100}
                step={1}
                unit="%"
              />

              <SettingItem
                title="Background Blur"
                description="Add blur effect to background"
                checked={settings.subtitleSettings.backgroundBlur}
                onCheckedChange={(checked) =>
                  updateSetting("subtitleSettings", {
                    ...settings.subtitleSettings,
                    backgroundBlur: checked,
                  })
                }
              />

              <SettingSliderItem
                title="Text Size"
                description="Adjust subtitle text size"
                value={settings.subtitleSettings.textSize}
                onValueChange={(value) =>
                  updateSetting("subtitleSettings", {
                    ...settings.subtitleSettings,
                    textSize: value[0],
                  })
                }
                min={50}
                max={200}
                step={1}
                unit="%"
              />

              <SettingSelectItem
                title="Font Family"
                description="Select font family"
                value={settings.subtitleSettings.fontFamily || "Rubik"}
                onValueChange={(value) =>
                  updateSetting("subtitleSettings", {
                    ...settings.subtitleSettings,
                    fontFamily: value,
                  })
                }
                options={[
                  { value: "Rubik", label: "Rubik" },
                  { value: "Roboto", label: "Roboto" },
                  { value: "Open Sans", label: "Open Sans" },
                  { value: "Poppins", label: "Poppins" },
                  { value: "Montserrat", label: "Montserrat" },
                  { value: "Nunito", label: "Nunito" },
                  { value: "Comic Neue", label: "Comic Neue" },
                ]}
              />

              <SettingSliderItem
                title="Outline Width"
                description="Adjust text outline thickness"
                value={
                  settings.subtitleSettings.outlineWidth !== undefined
                    ? settings.subtitleSettings.outlineWidth
                    : 2
                }
                onValueChange={(value) =>
                  updateSetting("subtitleSettings", {
                    ...settings.subtitleSettings,
                    outlineWidth: value[0],
                  })
                }
                min={0}
                max={5}
                step={0.5}
                unit="px"
              />

              <SettingSelectItem
                title="Text Style"
                description="Select text effect style"
                value={settings.subtitleSettings.textStyle}
                onValueChange={(value) =>
                  updateSetting("subtitleSettings", {
                    ...settings.subtitleSettings,
                    textStyle: value as any,
                  })
                }
                options={[
                  { value: "default", label: "Default" },
                  { value: "raised", label: "Raised" },
                  { value: "border", label: "Border" },
                  { value: "depressed", label: "Depressed" },
                  { value: "drop-shadow", label: "Drop Shadow" },
                ]}
              />

              <SettingItem
                title="Bold Text"
                description="Make subtitles bold"
                checked={settings.subtitleSettings.boldText}
                onCheckedChange={(checked) =>
                  updateSetting("subtitleSettings", {
                    ...settings.subtitleSettings,
                    boldText: checked,
                  })
                }
              />

              <SettingColorPicker
                title="Text Color"
                description="Choose subtitle text color"
                value={settings.subtitleSettings.color}
                onChange={(color) =>
                  updateSetting("subtitleSettings", {
                    ...settings.subtitleSettings,
                    color: color,
                  })
                }
                colors={["#FFFFFF", "#0000FF", "#FFFF00", "#00FF00"]}
              />

              <SettingToggleGroup
                title="Vertical Position"
                description="Adjust subtitle vertical position"
                value={settings.subtitleSettings.verticalPosition}
                onValueChange={(value) =>
                  updateSetting("subtitleSettings", {
                    ...settings.subtitleSettings,
                    verticalPosition: value as any,
                  })
                }
                options={[
                  { value: "default", label: "Default" },
                  { value: "high", label: "High" },
                ]}
              />
            </div>
          </motion.div>
        );

      case "playbackQuality":
        return (
          <motion.div layout="position" className="p-4 space-y-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("quality")}
                className="hover:bg-muted/50 rounded-lg p-1 transition-colors"
              >
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="h-5 w-5 text-muted-foreground"
                />
              </button>
              <h3 className="text-base font-medium text-muted-foreground">
                {t("quality")}
              </h3>
            </div>
            <div className="space-y-2">
              <button
                key="auto"
                onClick={() => {
                  selectLevel("auto");
                  setView("quality");
                }}
                className={cn(
                  "w-full flex items-center justify-between py-2 px-2 hover:bg-muted/30 rounded-lg transition-colors",
                  isAuto ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className="flex items-center justify-between w-full">
                  <span>{t("auto")}</span>
                </span>
                <span>{isAuto && <CheckIcon className="size-4" />}</span>
              </button>
              {levels
                .slice()
                .reverse()
                .map((level) => {
                  const isSelected = !isAuto && activeLevel?.id === level.id;
                  return (
                    <div key={level.id}>
                      <button
                        onClick={() => {
                          selectLevel(level);
                          setView("quality");
                        }}
                        className={cn(
                          "w-full flex items-center justify-between py-2 px-2 hover:bg-muted/30 rounded-lg transition-colors",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        <span className="flex items-center justify-between w-full">
                          <span>{level.height}p</span>
                        </span>
                        <span>
                          {isSelected && <CheckIcon className="size-4" />}
                        </span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        );

      case "providers":
        return (
          <motion.div layout="position" className="p-4 space-y-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView("main")}
                  className="hover:bg-muted/50 rounded-lg p-1 transition-colors"
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="h-5 w-5 text-muted-foreground"
                  />
                </button>
                <h3 className="text-base font-medium text-muted-foreground">
                  {t("providers")}
                </h3>
              </div>
              <Link
                href="/settings"
                className="text-xs hover:text-muted-foreground ease-in-out transition-all duration-200"
              >
                {t("reorder")}
              </Link>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
              {providersToUse &&
                providersToUse.map((providerKey) => {
                  const provider = providersConfig[providerKey];
                  const status = providerStatus[providerKey] || {
                    status: "idle",
                  };
                  const isSelected = provider.short === providerConfig.short;
                  const pname = provider.name.replace(" Dub", "");
                  const isDub = provider.name.includes("Dub");

                  return (
                    <div key={provider.name}>
                      <button
                        onClick={() => handleProviderSelect(providerKey)}
                        // Disable button while this provider is loading
                        disabled={status.status === "loading"}
                        className={cn(
                          "w-full flex items-center justify-between py-2 px-2 hover:bg-muted/30 rounded-lg transition-colors",
                          isSelected ? "text-primary" : "text-muted-foreground",
                          status.status === "loading" && "cursor-not-allowed"
                        )}
                      >
                        <span className="flex items-center justify-between w-full">
                          <span>
                            {pname}{" "}
                            {isDub && (
                              <Badge variant="default" className="text-[8px]">
                                <Icon icon="solar:translation-2-bold" />{" "}
                                {t("dub")}
                              </Badge>
                            )}
                          </span>
                          {status.status === "loading" && (
                            <Loader2 className="size-4 animate-spin" />
                          )}
                          {(status.status === "error" ||
                            status.status === "notFound") &&
                            status.message && (
                              <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="px-2 text-xs text-red-500"
                              >
                                {status.message}
                              </motion.div>
                            )}
                        </span>
                        <span>
                          {isSelected && status.status !== "loading" && (
                            <CheckIcon className="size-4" />
                          )}
                        </span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        );
      case "quality":
        return (
          <motion.div layout="position" className="p-4 space-y-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("main")}
                className="hover:bg-muted/50 rounded-lg p-1 transition-colors"
              >
                <Icon
                  icon="solar:alt-arrow-left-linear"
                  className="h-5 w-5 text-muted-foreground"
                />
              </button>
              <h3 className="text-base font-medium text-muted-foreground">
                {t("quality")}
              </h3>
            </div>
            <div className="space-y-2">
              {streams.map((strm) => {
                const isSelected = strm == stream;
                return (
                  <div key={strm.url}>
                    <button
                      onClick={() => {
                        setStream(strm);
                        setSrc(strm.url);
                      }}
                      // Disable button while this provider is loading
                      className={cn(
                        "w-full flex items-center justify-between py-2 px-2 hover:bg-muted/30 rounded-lg transition-colors",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <span className="flex items-center justify-between w-full">
                        <span>
                          {strm.quality.replace("BD", "")}{" "}
                          {/* if strm.quality has "BD" then remove it and add a badge of it */}
                          {strm.quality.includes("BD") && (
                            <Badge variant="default" className="text-[8px]">
                              <Icon icon="ion:disc-sharp" />
                              {t("bluRay")}
                            </Badge>
                          )}
                        </span>
                      </span>
                      <span>
                        {isSelected && <CheckIcon className="size-4" />}
                      </span>
                    </button>
                  </div>
                );
              })}
              {/* Quality toggle */}
              {levels && levels.length > 0 && (
                <div className="flex items-center justify-between py-2 px-2">
                  <span className="text-sm text-muted-foreground">
                    {t("quality")}
                  </span>
                  <button
                    onClick={() => setView("playbackQuality")}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {isAuto
                        ? `${t("auto")}${
                            activeLevel ? ` (${activeLevel?.height}p)` : ""
                          }`
                        : activeLevel
                        ? `${activeLevel.height}p`
                        : t("auto")}
                    </span>
                    <Icon
                      icon="solar:alt-arrow-right-linear"
                      className="h-5 w-5 text-muted-foreground"
                    />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <PlayerButton
          title={t("settings")}
          className="hover:scale-110 transition-transform duration-200"
        >
          <Icon
            icon="solar:settings-bold"
            className="h-4 w-4 sm:h-6 sm:w-6 text-white"
          />
        </PlayerButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-80 p-0 bg-background/95 backdrop-blur-md mb-3 rounded-2xl overflow-hidden border-border/50 max-h-[calc(100vh-10rem)] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
        containerRef={containerRef}
      >
        <LayoutGroup>{renderContent()}</LayoutGroup>
      </PopoverContent>
    </Popover>
  );
}
