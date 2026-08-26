import EpisodeList from "@/components/shared/episode-list";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";
import PlayerButton from "@/components/limeplay/player-button";
import { Icon } from "@iconify/react";

export default function EpisodesPlaylist({
  containerRef,
  episode,
  episodes,
  anime,
  backdrop_path,
  progress,
  onOpenChange,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  episode: any;
  episodes: any;
  anime: any;
  backdrop_path: string;
  progress: number;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Player");
  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <PlayerButton
          title={t("episodes")}
          className="hover:scale-110 transition-transform duration-200 flex items-center gap-1"
        >
          <Icon
            icon="solar:video-library-bold-duotone"
            className="h-4 w-4 sm:h-6 sm:w-6 text-white"
          />
          <span className="hidden sm:block">{t("episodes")}</span>
        </PlayerButton>
      </PopoverTrigger>
      <PopoverContent
        containerRef={containerRef}
        align="end"
        side="top"
        className="max-w-none w-[calc(100vw-2rem)] m-4 overflow-auto bg-background/95 backdrop-blur-md rounded-2xl border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        <EpisodeList
          episodeNumber={episode.episode_number}
          episodes={episodes}
          progress={progress}
          anime={anime}
          backdrop_path={backdrop_path}
          containerRef={containerRef}
        />
      </PopoverContent>
    </Popover>
  );
}
