"use client";

import React, { useEffect, useState } from "react";
import {
  isTauri,
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow,
  isWindowFullscreen,
} from "@/lib/tauri";
import { Minus, Square, Copy, X, ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function DesktopHeader() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rawPathname = usePathname();
  const pathname = rawPathname || "";
  const router = useRouter();

  const isHome =
    pathname === "" ||
    pathname === "/" ||
    pathname.endsWith("/en") ||
    pathname.endsWith("/uwu") ||
    pathname.endsWith("/hi") ||
    pathname.endsWith("/es") ||
    pathname.endsWith("/fr") ||
    pathname.endsWith("/ru") ||
    pathname.endsWith("/ja") ||
    pathname.endsWith("/de") ||
    pathname.endsWith("/ar") ||
    pathname.endsWith("/zh");

  useEffect(() => {
    const desktop = isTauri();
    setIsDesktop(desktop);
    if (desktop) {
      document.documentElement.classList.add("desktop-app-active");
    }

    const checkFullscreen = async () => {
      const fs = await isWindowFullscreen();
      setIsFullscreen(fs);
    };

    checkFullscreen();

    const handleFsChange = () => {
      checkFullscreen();
    };

    window.addEventListener("resize", handleFsChange);
    document.addEventListener("fullscreenchange", handleFsChange);

    return () => {
      window.removeEventListener("resize", handleFsChange);
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  if (!isDesktop || isFullscreen) return null;

  return (
    <header
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-9 z-[9999] flex items-center justify-between px-3 select-none pointer-events-auto bg-background/85 backdrop-blur-md border-b border-border/40 transition-colors shadow-xs"
    >
      {/* Draggable Title Area & Dynamic Browser Back Button */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 h-full flex-1 cursor-default select-none"
      >
        {!isHome && (
          <button
            type="button"
            onClick={() => router.back()}
            title="Go Back"
            aria-label="Go Back"
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-all active:scale-90"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <span
          data-tauri-drag-region
          className="text-[11px] font-semibold text-muted-foreground/90 tracking-wider uppercase pl-0.5"
        >
          Anime Realms
        </span>
      </div>

      {/* Modern Fluent Window Controls */}
      <div className="flex items-center space-x-1 h-full -mr-1">
        <button
          type="button"
          onClick={minimizeWindow}
          title="Minimize"
          aria-label="Minimize"
          className="w-9 h-7 flex items-center justify-center text-muted-foreground/80 hover:text-foreground hover:bg-muted/80 rounded-md transition-colors active:scale-95"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={async () => {
            await toggleMaximizeWindow();
            setIsMaximized(!isMaximized);
          }}
          title={isMaximized ? "Restore" : "Maximize"}
          aria-label={isMaximized ? "Restore" : "Maximize"}
          className="w-9 h-7 flex items-center justify-center text-muted-foreground/80 hover:text-foreground hover:bg-muted/80 rounded-md transition-colors active:scale-95"
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>
        <button
          type="button"
          onClick={closeWindow}
          title="Close"
          aria-label="Close"
          className="w-9 h-7 flex items-center justify-center text-muted-foreground/80 hover:text-white hover:bg-red-500/90 rounded-md transition-colors active:scale-95"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}





