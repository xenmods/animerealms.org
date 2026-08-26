"use client";

import React, { useRef } from "react";
import "mux.js";

import { useMediaStore } from "@/components/limeplay/media-provider";

declare global {
  interface HTMLMediaElement {
    player: shaka.Player | null;
  }
  interface Window {
    shaka: {
      Player: typeof shaka.Player;
    };
  }
}

export function useShakaPlayer() {
  const setPlayer = useMediaStore((state) => state.setPlayer);
  const mediaRef = useMediaStore((state) => state.mediaRef);
  const debug = useMediaStore((state) => state.debug);
  const isServer = typeof window === "undefined";
  const playerInstance = useRef<shaka.Player | null>(null);

  React.useEffect(() => {
    if (isServer) {
      console.warn("skipping shaka load on server");
      return;
    }

    const mediaElement = mediaRef.current;

    async function loadPlayer() {
      const shakaLib = debug
        ? await import("shaka-player/dist/shaka-player.compiled.debug")
        : await import("shaka-player");

      if (!mediaElement) {
        return;
      }
      shakaLib.polyfill.installAll();
      playerInstance.current = new shakaLib.Player();

      // handle segments disguised as images/html/css
      const networkingEngine = playerInstance.current.getNetworkingEngine();

      networkingEngine?.registerResponseFilter((type, response) => {
        // Only apply this to segments (audio/video chunks)
        if (type === shakaLib.net.NetworkingEngine.RequestType.SEGMENT) {
          const contentType = response.headers["content-type"]?.toLowerCase();

          if (
            contentType &&
            (contentType.includes("image/") ||
              contentType.includes("text/") ||
              contentType.includes("application/javascript") ||
              contentType.includes("text/html"))
          ) {
            response.headers["content-type"] = "application/octet-stream";
          }
        }
      });

      setPlayer(playerInstance.current);

      await playerInstance.current.attach(mediaElement);

      mediaElement.player = playerInstance.current;
      window.shaka = shakaLib;
    }

    void loadPlayer();

    return () => {
      if (playerInstance.current) {
        if (mediaElement) {
          mediaElement.pause();
        }
        void playerInstance.current.destroy();
      }
    };
  }, [isServer, mediaRef, debug, setPlayer]);

  return playerInstance.current;
}
