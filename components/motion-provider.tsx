"use client";

import { useSettings } from "@/components/settings-context";
import { MotionConfig, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import React, { createContext, useContext, useMemo } from "react";

const MotionContext = createContext({ isReducedMotion: false });

export const useMotionContext = () => useContext(MotionContext);

const randomStrings = [
  "Importing Libraries...",
  "Fetching Settings...",
  "Preparing Motion...",
  "Almost there...",
  "Just a moment...",
  "Loading components...",
  "Setting things up...",
  "Getting ready...",
  "Hang tight...",
  "Loading your experience...",
  "Optimizing performance...",
  "Finalizing setup...",
  "Compiling binaries...",
  "Cleaning up...",
  "Installing security patches...",
  "Updating...",
  "Pretend this is cool...",
];

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useSettings();
  const prefersReducedMotion = useReducedMotion();

  const randomLoadingText = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * randomStrings.length);
    return randomStrings[randomIndex];
  }, []);

  if (isLoading) {
    return (
      <div className="inset-0 w-screen h-screen bg-background/70 flex flex-col items-center justify-center z-50 gap-3">
        <Loader2 className="animate-spin w-7 h-7" />
        <p suppressHydrationWarning className="text-sm text-muted-foreground">
          {randomLoadingText}
        </p>
      </div>
    );
  }


  const isReduced = prefersReducedMotion || settings.lowPerformanceMode;

  return (
    <MotionContext.Provider value={{ isReducedMotion: isReduced }}>
      <MotionConfig transition={isReduced ? { duration: 0 } : undefined}>
        {children}
      </MotionConfig>
    </MotionContext.Provider>
  );
}
