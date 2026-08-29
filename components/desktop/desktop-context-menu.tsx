"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  isTauri,
  toggleFullscreenWindow,
  openInBrowser,
} from "@/lib/tauri";
import { toast } from "sonner";

interface ContextMenuPosition {
  x: number;
  y: number;
}

export function DesktopContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isTauri()) return;

    const handleContextMenu = (e: MouseEvent) => {
      // Allow default context menu on text inputs if needed, otherwise intercept everywhere
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      e.preventDefault();

      // Calculate position so menu never goes off-screen
      const menuWidth = 220;
      const menuHeight = 340;
      const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
      const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

      setPosition({ x, y });
      setIsOpen(true);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div
      ref={menuRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-[10000] min-w-[210px] bg-card/95 backdrop-blur-xl border border-border/70 shadow-2xl rounded-2xl p-1.5 select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Navigation Controls */}
      <div className="flex items-center gap-1 px-1 py-1 border-b border-border/40 mb-1">
        <button
          type="button"
          onClick={() => handleAction(() => window.history.back())}
          title="Back"
          className="flex-1 flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-95"
        >
          <Icon icon="solar:alt-arrow-left-linear" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleAction(() => window.history.forward())}
          title="Forward"
          className="flex-1 flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-95"
        >
          <Icon icon="solar:alt-arrow-right-linear" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleAction(() => window.location.reload())}
          title="Reload"
          className="flex-1 flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-95"
        >
          <Icon icon="solar:restart-linear" className="w-4 h-4" />
        </button>
      </div>

      {/* Main Pages */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => handleAction(() => router.push("/"))}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-foreground/90 hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer group"
        >
          <Icon icon="solar:home-2-linear" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(() => router.push("/discover"))}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-foreground/90 hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer group"
        >
          <Icon icon="solar:star-fall-minimalistic-2-bold" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>Discover</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(() => router.push("/downloads"))}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-foreground/90 hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer group"
        >
          <Icon icon="solar:download-minimalistic-bold" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>Downloads</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(() => router.push("/settings"))}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-foreground/90 hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer group"
        >
          <Icon icon="solar:settings-linear" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>Settings</span>
        </button>
      </div>

      <div className="my-1.5 border-t border-border/40" />

      {/* Utility Actions */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => handleAction(() => toggleFullscreenWindow())}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-foreground/90 hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Icon icon="solar:maximize-square-2-linear" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span>Toggle Fullscreen</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">F11 / F</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleAction(() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Page link copied to clipboard");
              }
            })
          }
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-foreground/90 hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer group"
        >
          <Icon icon="solar:copy-linear" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>Copy Page Link</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleAction(() => {
              if (typeof window !== "undefined") {
                const logs = (window as any).__getLogs ? (window as any).__getLogs() : "No logs available";
                navigator.clipboard.writeText(logs);
                toast.success("Debug logs copied to clipboard!");
              }
            })
          }
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-foreground/90 hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer group"
        >
          <Icon icon="solar:document-text-linear" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>Copy Debug Logs</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleAction(() => openInBrowser("https://github.com/xenmods/animerealms.org"))
          }
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-foreground/90 hover:bg-muted/70 hover:text-foreground transition-colors cursor-pointer group"
        >
          <Icon icon="solar:link-circle-linear" className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span>GitHub Repository</span>
        </button>
      </div>


    </div>
  );
}