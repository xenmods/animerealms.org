"use client";

import React from "react";
import { Icon } from "@iconify/react";
import PlayerButton from "@/components/limeplay/player-button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Settings from "./settings";
import EpisodesPlaylist from "./episodes-playlist";
import { useMediaStore } from "@/components/limeplay/media-provider";
import { XIcon } from "lucide-react";

// [NEW] Define the new props you'll need to pass down
interface BottomControlsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  currentTime: number;
  duration: number;
  status: string;
  togglePaused: () => void;
  togglePlay: () => void;
  seekForward: () => void;
  seekBackward: () => void;
  handleSeek: (value: number[]) => void;
  handleSeekCommit: (value: number[]) => void;
  formatTime: (time: number) => string;
  timeFormat: string;
  toggleTimeFormat: () => void;
  isMuted: boolean;
  volume: number;
  handleVolumeChange: (value: number[]) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  handleScreenshot: () => void;
  getAdvancedString: (duration: number, currentTime: number) => string;
  providerConfig?: any;
  src: string | undefined;
  setSrc: (src: string) => void;
  streams?: any;
  setStreams?: (streams: any) => void;
  episode?: any;
  episodes?: any;
  animeDetails?: any;
  poster?: string;
  setProviderConfig?: (config: any) => void;
  setSubtitles?: (subtitles: any[]) => void;
  skipTimes: any[]; // <-- ADD THIS PROP
  handleNextEpisode: () => void;
  showControls: boolean;
  anilistProgress: number;
  onPopoverOpenChange: (isOpen: boolean) => void;
  thumbnails: any;
  buffered: number;
  toggleComments: () => void;
}

export default function BottomControls({
  containerRef,
  currentTime,
  duration,
  status,
  togglePaused,
  togglePlay,
  seekForward,
  seekBackward,
  handleSeek,
  handleSeekCommit,
  formatTime,
  timeFormat,
  toggleTimeFormat,
  isMuted,
  volume,
  handleVolumeChange,
  isFullscreen,
  toggleFullscreen,
  handleScreenshot,
  getAdvancedString,
  providerConfig,
  src,
  setSrc,
  streams,
  setStreams,
  episode,
  episodes,
  animeDetails,
  poster,
  setProviderConfig,
  setSubtitles,
  skipTimes, // <-- NEW
  handleNextEpisode,
  showControls,
  anilistProgress,
  onPopoverOpenChange,
  thumbnails,
  buffered,
  toggleComments,
}: BottomControlsProps) {
  const t = useTranslations("Player");
  // [NEW] Internal state to manage the notification
  const [shouldShowNextEpNotif, setShouldShowNextEpNotif] =
    React.useState(false);
  const [isNextEpisodePopupDismissed, setIsNextEpisodePopupDismissed] =
    React.useState(false);
  const [openPopovers, setOpenPopovers] = React.useState<string[]>([]);

  const handleOpenChange = (popoverId: string, open: boolean) => {
    setOpenPopovers((prev) => {
      const newOpenPopovers = open
        ? [...prev, popoverId]
        : prev.filter((id) => id !== popoverId);

      onPopoverOpenChange(newOpenPopovers.length > 0);
      return newOpenPopovers;
    });
  };

  // [NEW] Effect to show the notification
  React.useEffect(() => {
    // Don't run if already shown, or if data is missing
    if (
      !duration ||
      duration === 0 ||
      !episodes ||
      !episode ||
      isNextEpisodePopupDismissed
    ) {
      return;
    }

    const progPercent = (currentTime / duration) * 100;

    // Find the 'ed' or 'mixed-ed' start time
    const edSkipTime = skipTimes?.find(
      (item) => item.skipType === "ed" || item.skipType === "mixed-ed"
    );
    const edStartTime = edSkipTime?.interval.startTime;

    // Check if this is the last episode
    const currentIndex = episodes.findIndex(
      (ep) => ep.episode_number === episode.episode_number
    );
    const isLastEpisode =
      currentIndex === -1 || currentIndex === episodes.length - 1;

    // Trigger if 90% OR past 'ed' start time, and NOT the last episode
    if (
      !isLastEpisode &&
      (progPercent >= 90 || (edStartTime && currentTime >= edStartTime))
    ) {
      setShouldShowNextEpNotif(true);
    } else {
      setShouldShowNextEpNotif(false);
    }
  }, [
    currentTime,
    duration,
    episode,
    episodes,
    skipTimes,
    isNextEpisodePopupDismissed,
  ]);

  // [NEW] Effect to reset the notification when episode changes
  React.useEffect(() => {
    setShouldShowNextEpNotif(false);
    setIsNextEpisodePopupDismissed(false);
  }, [episode.episode_number]);

  // [NEW] Helper to get the next episode number for the message
  const getNextEpisodeNumber = () => {
    if (!episodes || !episode) return null;
    const currentIndex = episodes.findIndex(
      (ep) => ep.episode_number === episode.episode_number
    );
    if (currentIndex === -1 || currentIndex >= episodes.length - 1) {
      return null;
    }
    return episodes[currentIndex + 1].episode_number;
  };
  const nextEpisodeNumber = getNextEpisodeNumber();

  return (
    // [NEW] Added 'relative' class to the root div
    <>
      {/* --- [NEW] Next Episode Notification --- */}
      <div
        className={`absolute ${
          showControls ? "bottom-16 sm:bottom-20" : "bottom-2"
        } right-4 transition-all duration-300 ease-in-out z-12 ${
          shouldShowNextEpNotif && !isNextEpisodePopupDismissed
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-popover/90 backdrop-blur-md border border-border rounded-lg shadow-lg p-3 max-w-xs text-popover-foreground">
          <Button
            variant="link"
            size="icon-sm"
            onClick={() => setIsNextEpisodePopupDismissed(true)}
            className="fixed right-0 top-0"
          >
            <XIcon />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {nextEpisodeNumber
                  ? t("upNext", { nextEpisodeNumber })
                  : t("episodeFinished")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("almostFinished")}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {nextEpisodeNumber && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNextEpisode}
                  className="mx-2 mt-1 flex-shrink-0"
                >
                  <Icon icon="solar:play-bold" className="w-4 h-4" />
                  {t("nextEpisode")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className={`pt-32 bg-gradient-to-t from-black to-transparent w-full group/controls transition-all duration-500 ease-out ${
          showControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-full pointer-events-none"
        }`}
      >
        {/* --- [END NEW] --- */}

        <div className="px-2 pt-2 sm:px-4 sm:pt-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            onValueCommit={handleSeekCommit}
            timeString={formatTime(currentTime)}
            timeClass="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 text-xs text-white group-hover/controls:opacity-100 opacity-0 transition-opacity duration-300 z-100"
            duration={duration}
            thumbnails={thumbnails}
            buffered={buffered}
            skipTimes={skipTimes}
            className="w-full [&_[role=slider]]:opacity-0 group-hover/controls:[&_[role=slider]]:opacity-100 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-lg [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_.slider-track]:bg-white/20 [&_.slider-range]:bg-primary [&_.slider-track]:h-1 [&_.slider-range]:h-1 transition-all duration-200"
          />
        </div>

        <div className="px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between space-x-4">
            {/* Left side controls */}
            <div className="flex items-center space-x-3">
              <PlayerButton
                title={status === "playing" ? t("pause") : t("play")}
                onClick={togglePlay}
                className="hover:scale-110 transition-transform duration-200"
              >
                {status === "playing" ? (
                  <Icon
                    icon="solar:pause-bold"
                    className="h-4 w-4 sm:h-6 sm:w-6"
                  />
                ) : (
                  <Icon
                    icon="solar:play-bold"
                    className="h-4 w-4 sm:h-6 sm:w-6"
                  />
                )}
              </PlayerButton>

              {/* skip buttons +10 -10 */}
              <PlayerButton
                title={t("rewind")}
                onClick={seekBackward}
                className="hidden sm:block hover:scale-110 transition-transform duration-200"
              >
                <svg
                  className="h-4 w-4 sm:h-6 sm:w-6"
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
                title={t("forward")}
                onClick={seekForward}
                className="hidden sm:block hover:scale-110 transition-transform duration-200"
              >
                <svg
                  className="h-4 w-4 sm:h-6 sm:w-6"
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

              <Popover
                onOpenChange={(open) => handleOpenChange("volume", open)}
              >
                <PopoverTrigger asChild>
                  <PlayerButton
                    title={t("volume")}
                    className="hover:scale-110 transition-transform duration-200"
                  >
                    {isMuted || volume === 0 ? (
                      <Icon
                        icon="solar:volume-cross-bold"
                        className="h-4 w-4 sm:h-6 sm:w-6"
                      />
                    ) : volume < 0.5 ? (
                      <Icon
                        icon="solar:volume-small-bold"
                        className="h-4 w-4 sm:h-6 sm:w-6"
                      />
                    ) : (
                      <Icon
                        icon="solar:volume-loud-bold"
                        className="h-4 w-4 sm:h-6 sm:w-6"
                      />
                    )}
                  </PlayerButton>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[50px] p-2 bg-background/90 backdrop-blur-md border-white/20 flex items-center justify-center"
                  containerRef={containerRef}
                >
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.05}
                    onValueChange={handleVolumeChange}
                    orientation="vertical"
                    className="[&_[role=slider]]:bg-white [&_.slider-range]:bg-white"
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTimeFormat}
                className="text-white/90 hover:text-white hover:bg-white/10 text-xs font-medium transition-all duration-200 px-2 py-1 rounded-lg"
              >
                {timeFormat === "normal"
                  ? `${formatTime(currentTime)} / ${formatTime(duration)}`
                  : getAdvancedString(duration, currentTime)}
              </Button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block"></div>

              <EpisodesPlaylist
                containerRef={containerRef}
                episodes={episodes}
                anime={animeDetails}
                episode={episode}
                backdrop_path={poster}
                progress={anilistProgress}
                onOpenChange={(open) => handleOpenChange("episodes", open)}
              />

              <PlayerButton
                title="Comments"
                onClick={toggleComments}
                className="hover:scale-110 transition-transform duration-200 hidden sm:block"
              >
                <Icon
                  icon="solar:chat-round-dots-bold"
                  className="h-4 w-4 sm:h-6 sm:w-6 text-white"
                />
              </PlayerButton>

              <PlayerButton
                title={t("screenshot")}
                onClick={handleScreenshot}
                className="hover:scale-110 transition-transform duration-200 hidden sm:block"
              >
                <Icon
                  icon="solar:camera-bold"
                  className="h-4 w-4 sm:h-6 sm:w-6 text-white"
                />
              </PlayerButton>
              {/* <span>Settings Button</span> */}
              {/* for now settings cog */}
              <Settings
                containerRef={containerRef}
                providerConfig={providerConfig}
                src={src}
                setSrc={setSrc}
                streams={streams}
                setStreams={setStreams}
                setProviderConfig={setProviderConfig}
                setSubtitles={setSubtitles}
                onOpenChange={(open) => handleOpenChange("settings", open)}
                animeDetails={animeDetails}
                episode={episode}
              />
              <PlayerButton
                title={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
                onClick={toggleFullscreen}
                className="hover:scale-110 transition-transform duration-200"
              >
                {isFullscreen ? (
                  <Icon
                    icon="solar:quit-full-screen-bold"
                    className="h-4 w-4 sm:h-6 sm:w-6 text-white"
                  />
                ) : (
                  <Icon
                    icon="solar:full-screen-bold"
                    className="h-4 w-4 sm:h-6 sm:w-6 text-white"
                  />
                )}
              </PlayerButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
