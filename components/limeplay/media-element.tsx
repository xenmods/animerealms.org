"use client";

import { useEffect, useRef } from "react";

import { Media } from "@/components/limeplay/media";
import { useMediaStore } from "@/components/limeplay/media-provider";

import { logInfo, logWarn, logError } from "@/lib/logger";

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
      logInfo("PLAYER", "Attempting to load source:", src);

      try {
        const parsedUrl = new URL(src);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid URL protocol");
        }
      } catch (error) {
        logError(
          "PLAYER",
          "Invalid playback URL:",
          error instanceof Error ? error.message : "Unknown error"
        );
        return;
      }

      const onTimeUpdate = () => {
        // Track timeupdate
      };

      const onLoaded = () => {
        logInfo("PLAYER", "Source loaded successfully:", src);
        loadedSrcRef.current = src;
      };

      player.addEventListener("loaded", onLoaded);
      player.addEventListener("timeupdate", onTimeUpdate);

      const lowerSrc = src.toLowerCase();
      let mimeType: string | undefined = undefined;

      const loadSource = async () => {
        let targetUrl = src;

        if (lowerSrc.includes("/local_file")) {
          // Probe HEAD to determine exact content type from proxy
          try {
            const headRes = await fetch(src, { method: "HEAD" });
            const ct = headRes.headers.get("content-type");
            if (ct) {
              mimeType = ct;
              logInfo("PLAYER", `Detected local file content-type from proxy: ${ct}`);
            }
          } catch (e) {
            logWarn("PLAYER", "HEAD check failed, defaulting to extension detection:", e);
          }

          // If proxy detected MPEG-TS (or not clean mp4), load through virtual HLS manifest for 100% Shaka mux.js support
          if (mimeType === "video/mp2t") {
            targetUrl = src.replace("/local_file", "/local_playlist.m3u8");
            mimeType = "application/x-mpegURL";
            logInfo("PLAYER", `Using synthetic HLS manifest for local MPEG-TS: ${targetUrl}`);
          }
        }

        if (!mimeType) {
          if (lowerSrc.includes("/local_file") || lowerSrc.endsWith(".mp4") || lowerSrc.includes("video.mp4")) {
            mimeType = "video/mp4";
          } else if (lowerSrc.includes(".m3u8") || lowerSrc.includes("/hls/")) {
            mimeType = "application/x-mpegURL";
          } else if (lowerSrc.includes(".mpd") || lowerSrc.includes("/dash/")) {
            mimeType = "application/dash+xml";
          }
        }

        logInfo("PLAYER", `Calling player.load(${targetUrl}) with mimeType=${mimeType}`);

        try {
          await player.load(targetUrl, null, mimeType);
          logInfo("PLAYER", "player.load promise resolved successfully for:", targetUrl);
          loadedSrcRef.current = src;
        } catch (error: any) {
          if (error?.code === 7000) {
            logInfo("PLAYER", "Load interrupted (harmless):", error);
            return;
          }
          logError("PLAYER", "Shaka load error with " + mimeType + ":", error);

          // If failed on a local file, retry with synthetic HLS manifest
          if (targetUrl === src && lowerSrc.includes("/local_file")) {
            const hlsUrl = src.replace("/local_file", "/local_playlist.m3u8");
            logInfo("PLAYER", "Retrying with synthetic HLS manifest:", hlsUrl);
            try {
              await player.load(hlsUrl, null, "application/x-mpegURL");
              logInfo("PLAYER", "player.load resolved with synthetic HLS manifest for:", hlsUrl);
              loadedSrcRef.current = src;
              return;
            } catch (hlsErr: any) {
              logError("PLAYER", "Retry with synthetic HLS manifest failed:", hlsErr);
            }
          }

          onError?.(error);
        }
      };

      loadSource();


      return () => {
        player.removeEventListener("loaded", onLoaded);
        player.removeEventListener("timeupdate", onTimeUpdate);
      };
    }
  }, [player, src, mediaRef, onError]);



 // mediaRef is stable, but including it is fine.

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
