"use client";

import { useEffect, useRef } from "react";

import { Media } from "@/components/limeplay/media";
import { useMediaStore } from "@/components/limeplay/media-provider";

export function MediaElement({
  src,
  poster,
  children,
  onError,
  props,
}: {
  src: string;
  poster: string;
  children?: React.ReactNode;
  onError?: (error: unknown) => void;
  props?: any;
}) {
  const player = useMediaStore((state) => state.player);
  const mediaRef = useMediaStore((state) => state.mediaRef);

  // Use a ref to track if the source has already been loaded.
  const loadedSrcRef = useRef<string | null>(null);

  useEffect(() => {
    const mediaElement = mediaRef.current;

    // Ensure player exists and the source hasn't been loaded already.
    if (player && mediaElement && src && loadedSrcRef.current !== src) {
      try {
        const parsedUrl = new URL(src);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid URL protocol");
        }
      } catch (error) {
        console.error(
          "Invalid playback URL:",
          error instanceof Error ? error.message : "Unknown error"
        );
        // Don't attempt to load an invalid URL.
        return;
      }

      const onTimeUpdate = () => {
        console.log(`New time: ${mediaElement.currentTime}`);
      };

      const onLoaded = () => {
        loadedSrcRef.current = src;
      };

      player.addEventListener("loaded", onLoaded);
      player.addEventListener("timeupdate", onTimeUpdate);
      player.load(src).catch((error: any) => {
        // Shaka Player error code 7000 is LOAD_INTERRUPTED.
        // This happens when a new load() is called before the previous one finishes.
        // We should ignore this error to prevent infinite loops.
        if (error?.code === 7000) {
          console.log("[limeplay] Load interrupted (harmless):", error);
          return;
        }
        console.error("[limeplay] error loading media:", error);
        onError?.(error);
      });
      return () => {
        player.removeEventListener("loaded", onLoaded);
        player.removeEventListener("timeupdate", onTimeUpdate);
      };
    }
  }, [player, src, mediaRef, onError]); // mediaRef is stable, but including it is fine.

  return (
    <Media
      as="video"
      className="size-full bg-black object-contain"
      crossOrigin="anonymous"
      playsInline
      poster={poster}
      {...props}
    >
      {children}
    </Media>
  );
}
