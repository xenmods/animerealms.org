"use client";

import React, { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";

declare global {
  interface Window {
    theAnimeCommunityConfig: any;
    theAnimeCommunity: any;
  }
}

interface CommentDrawerProps {
  animeId: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function CommentDrawer({
  animeId,
  isOpen,
  onClose,
  title,
}: CommentDrawerProps) {
  // We re-use logic from components/player/comments.tsx
  useEffect(() => {
    if (!isOpen || !animeId) return;

    // Use a small timeout to let the drawer DOM render
    const timeout = setTimeout(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      const primaryColor = rootStyles.getPropertyValue("--primary");
      const backgroundColor = rootStyles.getPropertyValue("--card"); // Use card color for contrast
      const accentColor = rootStyles.getPropertyValue("--accent");

      const config = {
        AniList_ID: animeId,
        episodeChapterNumber: "0", // 0 or "Trailer"
        mediaType: "anime",
        removeBorderStyling: true,
        colorScheme: {
          primaryColor,
          backgroundColor: "#18181b", // Forced dark bg for drawer
          accentColor,
        },
      };

      window.theAnimeCommunityConfig = config;

      const container = document.getElementById(
        "anime-community-comment-section"
      );

      if (window.theAnimeCommunity) {
        if (container) container.innerHTML = "";
        window.theAnimeCommunity.reload();
      } else {
        const script = document.createElement("script");
        script.src = `https://theanimecommunity.com/embed.js`;
        script.id = "anime-community-script-drawer";
        script.defer = true;
        document.body.appendChild(script);
        script.onload = () => {
          if (window.theAnimeCommunity) {
            window.theAnimeCommunity.reload();
          }
        };
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [isOpen, animeId]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Drawer.Content className="bg-zinc-900 flex flex-col rounded-t-[10px] h-[80vh] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 focus:outline-none">
          {/* Handle */}
          <div className="p-4 bg-zinc-900 rounded-t-[10px] flex-none border-b border-zinc-800">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-700 mb-4" />
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-bold text-white">
                Comments on {title}
              </span>
              <button
                onClick={onClose}
                className="p-1 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
              >
                <X size={16} className="text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Comments Embed Container */}
          <div className="flex-1 overflow-y-auto p-0 bg-[#18181b]">
            <div
              id="anime-community-comment-section"
              className="w-full min-h-full"
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
