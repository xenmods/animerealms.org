"use client";

import { useMediaStore } from "@/components/limeplay/media-provider";
import { useCallback, useEffect, useState } from "react";
import shaka from "shaka-player";

export interface QualityLevel {
  id: number;
  width: number;
  height: number;
  bitrate: number;
}

export function useQuality() {
  const player = useMediaStore((state) => state.player);
  const [isAuto, setIsAuto] = useState(true);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [activeLevel, setActiveLevel] = useState<QualityLevel | null>(null);

  useEffect(() => {
    if (!player) return;

    const onVariantChanged = () => {
      const currentTrack = player.getVariantTracks().find((t) => t.active);
      if (currentTrack) {
        setActiveLevel({
          id: currentTrack.id,
          width: currentTrack.width || 0,
          height: currentTrack.height || 0,
          bitrate: currentTrack.bandwidth,
        });
      }
    };

    const onTracksChanged = () => {
      const tracks = player.getVariantTracks();
      const newLevels = tracks.map((track) => ({
        id: track.id,
        width: track.width || 0,
        height: track.height || 0,
        bitrate: track.bandwidth,
      }));
      setLevels(newLevels);
      onVariantChanged();
    };

    player.addEventListener("trackschanged", onTracksChanged);
    player.addEventListener("variantchanged", onVariantChanged);

    onTracksChanged();

    return () => {
      player.removeEventListener("trackschanged", onTracksChanged);
      player.removeEventListener("variantchanged", onVariantChanged);
    };
  }, [player]);

  const selectLevel = useCallback(
    (level: QualityLevel | "auto") => {
      if (!player) return;

      if (level === "auto") {
        player.configure({ abr: { enabled: true } });
        setIsAuto(true);
      } else {
        player.configure({ abr: { enabled: false } });
        player.selectVariantTrack(
          player.getVariantTracks().find((t) => t.id === level.id),
          true
        );
        setActiveLevel(level);
        setIsAuto(false);
      }
    },
    [player]
  );

  return {
    isAuto,
    levels,
    activeLevel,
    selectLevel,
  };
}
