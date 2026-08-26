"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimeCard } from "@/components/shared/anime-card";

interface ReelActivity {
  user: {
    name: string;
    avatar: string;
  };
  status: string;
  progress: string;
  id: number;
}

interface ReelOverlayProps {
  animeId: number;
  title: string;
  description: string;
  genres: string[];
  friendActivity?: ReelActivity;
  onDetailsOpen?: () => void;
}

export function ReelOverlay({
  animeId,
  title,
  description,
  genres,
  friendActivity,
  onDetailsOpen,
}: ReelOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Strip HTML from description (AniList returns HTML sometimes)
  const cleanDesc = description?.replace(/<[^>]*>?/gm, "") || "";

  // Mock a partial anime object for AnimeCard
  const animeMock = {
    id: animeId,
    title: { english: title, romaji: title },
    coverImage: { extraLarge: "", large: "" }, // Not needed for the trigger content
    format: "TV",
    seasonYear: 0,
  };

  return (
    <div className="flex flex-col gap-3 max-w-[85%]">
      {/* User/Author area - CLICK TO OPEN INFO */}
      <AnimeCard anime={animeMock}>
        <div
          onClick={() => onDetailsOpen?.()}
          className="flex items-center gap-2 group cursor-pointer w-fit"
        >
          {friendActivity ? (
            <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-pink-500/50 flex items-center gap-2 text-sm font-bold text-white group-hover:bg-black/60 transition-colors">
              <img
                src={friendActivity.user.avatar}
                className="w-6 h-6 rounded-full border border-pink-500"
              />
              <span>{friendActivity.user.name}</span>
              <span className="text-pink-300 text-xs font-normal">
                • {friendActivity.status}{" "}
                {friendActivity.progress && `ep ${friendActivity.progress}`}
              </span>
              <ChevronRight
                size={14}
                className="text-pink-500 group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          ) : (
            <div className="bg-primary/20 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/30 flex items-center gap-1 text-sm font-bold text-white group-hover:bg-primary/40 transition-colors">
              <span className="line-clamp-1 text-xs">{title}</span>
              <ChevronRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          )}
        </div>
      </AnimeCard>

      {/* Description */}
      <div
        className="text-white/90 text-sm md:text-base leading-relaxed cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <p className={cn("transition-all", isExpanded ? "" : "line-clamp-2")}>
          {friendActivity && !isExpanded ? (
            <span className="italic text-white/70">Watching {title}... </span>
          ) : (
            cleanDesc
          )}
        </p>
        {!isExpanded && cleanDesc.length > 100 && (
          <span className="text-white/60 text-xs font-semibold mt-1">
            See more
          </span>
        )}
      </div>

      {/* Genres */}
      <div className="flex flex-wrap gap-2 mt-1">
        {genres?.slice(0, 3).map((g) => (
          <span
            key={g}
            className="text-xs text-white/80 bg-black/30 px-2 py-0.5 rounded-md backdrop-blur-sm"
          >
            #{g}
          </span>
        ))}
      </div>
    </div>
  );
}
