"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Icon } from "@iconify/react";
import { XIcon } from "lucide-react";

declare global {
  interface Window {
    theAnimeCommunityConfig: any;
    theAnimeCommunity: any;
  }
}

interface CommentsProps {
  onClose: () => void;
  isOpen?: boolean;
  isDesktop?: boolean;
  animeDetails: any;
  episode: any;
}

export function Comments({
  onClose,
  isOpen,
  isDesktop,
  animeDetails,
  episode,
}: CommentsProps) {
  React.useEffect(() => {
    if (!animeDetails || !episode) {
      console.log("Anime details or episode data is missing.");
      return;
    }
    const rootStyles = getComputedStyle(document.documentElement);

    // Get the value of the '--primary' CSS variable
    const primaryColor = rootStyles.getPropertyValue("--primary");
    const backgroundColor = rootStyles.getPropertyValue("--background");
    const accentColor = rootStyles.getPropertyValue("--accent");

    const config = {
      AniList_ID: animeDetails.id.toString(),
      episodeChapterNumber: episode.episode_number.toString(),
      mediaType: "anime",
      removeBorderStyling: true,
      colorScheme: {
        primaryColor,
        backgroundColor,
        accentColor,
      },
    };

    window.theAnimeCommunityConfig = config;

    if (window.theAnimeCommunity) {
      // Clear previous comments before reloading
      const container = document.getElementById(
        "anime-community-comment-section"
      );
      if (container) {
        container.innerHTML = "";
      }
      window.theAnimeCommunity.reload();
    } else {
      const script = document.createElement("script");
      script.src = `https://theanimecommunity.com/embed.js`;
      script.id = "anime-community-script";
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        // When the script loads for the first time, it might need a manual trigger.
        if (window.theAnimeCommunity) {
          window.theAnimeCommunity.reload();
        }
      };
    }
  }, [animeDetails, episode]);

  const commentSection = (
    <div id="anime-community-comment-section" className="h-full w-full" />
  );

  if (isDesktop) {
    return (
      <div className="h-full bg-background border-l border-border w-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex flex-col items-start">
            <h2 className="text-xl font-semibold">
              Comments{" "}
              <span className="top-0 right-2 text-muted-foreground text-[10px]">
                BETA
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">The Anime Community</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">{commentSection}</div>
      </div>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Comments{" "}
            <span className="top-2 right-2 text-muted-foreground text-xs">
              BETA
            </span>
          </DrawerTitle>
        </DrawerHeader>
        <div className="p-4 min-h-[300px]">{commentSection}</div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
