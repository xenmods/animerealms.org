"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX } from "lucide-react";

interface ReelPlayerProps {
  videoId: string; // YouTube ID
  thumbnail: string;
  isActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  shouldPlay: boolean; // Controls Play/Pause
  onVideoEnd: () => void; // Trigger for auto-scroll
}

export function ReelPlayer({
  videoId,
  thumbnail,
  isActive,
  isMuted,
  toggleMute,
  shouldPlay,
  onVideoEnd,
}: ReelPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // When isActive becomes true, we mount the iframe.
  // When shouldPlay changes, we send postMessage.

  useEffect(() => {
    if (!iframeRef.current || !isLoaded) return;

    const command = shouldPlay ? "playVideo" : "pauseVideo";
    const message = JSON.stringify({
      event: "command",
      func: command,
      args: [],
    });

    // YouTube IFrame API requires postMessage to contentWindow
    iframeRef.current.contentWindow?.postMessage(message, "*");
  }, [shouldPlay, isLoaded]);

  // Handle Mute changes
  useEffect(() => {
    if (!iframeRef.current || !isLoaded) return;
    const command = isMuted ? "mute" : "unMute";
    const message = JSON.stringify({
      event: "command",
      func: command,
      args: [],
    });
    iframeRef.current.contentWindow?.postMessage(message, "*");
  }, [isMuted, isLoaded]);

  // Listen for Player State Changes (Video Ended)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Filter messages from YouTube
      if (event.origin !== "https://www.youtube.com") return;

      try {
        const data = JSON.parse(event.data);
        // YouTube sends infoDelivery events with playerState
        if (
          data.event === "infoDelivery" &&
          data.info &&
          data.info.playerState === 0
        ) {
          // State 0 = ENDED
          onVideoEnd();
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onVideoEnd]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      {/* Blurred Background for desktop fill */}
      <div className="absolute inset-0 z-0">
        {/* <Image
          src={thumbnail}
          alt="Background"
          fill
          className="object-cover opacity-60 blur-3xl scale-125"
        /> */}
        <div className="absolute inset-0 bg-background" />
      </div>

      {/* Video Container - Centered and Aspect Ratio Constraint on Desktop */}
      <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none md:py-8">
        {/* On desktop, we constrain this to 9:16 approx (max-width) */}
        <div className="w-full h-full md:max-w-[calc((100vh-4rem)*(9/16))] relative aspect-[9/16] bg-black shadow-2xl md:rounded-xl overflow-hidden">
          {isActive ? (
            <iframe
              ref={iframeRef}
              className={cn(
                "w-full h-full pointer-events-none",
                "transition-opacity duration-700",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
              // enablejsapi=1 is Critical for postMessage
              // controls=0 & disablekb=1 to hide UI
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=${
                isMuted ? 1 : 0
              }&controls=0&loop=0&playlist=${videoId}&playsinline=1&rel=0&showinfo=0&modestbranding=1&cc_load_policy=1&cc_lang_pref=en`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onLoad={() => setIsLoaded(true)}
              title="Anime Trailer"
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <Image
                src={thumbnail}
                alt="Thumbnail"
                fill
                className="object-cover opacity-80"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mute Toggle Overlay moved to Feed */}

      {/* Loading Placeholders */}
      {!isLoaded && isActive && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
