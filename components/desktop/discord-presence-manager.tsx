"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isTauri, setDiscordPresence } from "@/lib/tauri";

export function DiscordPresenceManager() {
  const pathname = usePathname() || "";

  useEffect(() => {
    if (!isTauri()) return;

    // Skip general route presence if currently on the watch page (managed by player.tsx)
    if (pathname.includes("/watch/") || pathname.includes("/player")) {
      return;
    }

    if (pathname === "" || pathname === "/" || pathname.endsWith("/en") || pathname.endsWith("/uwu")) {
      setDiscordPresence({
        details: "Browsing Home",
        state: "Finding something to watch",
        button1Label: "Anime Realms GitHub",
        button1Url: "https://github.com/xenmods/animerealms.org",
      });
    } else if (pathname.includes("/discover")) {
      setDiscordPresence({
        details: "Exploring Discover",
        state: "Browsing trending anime",
        button1Label: "Anime Realms GitHub",
        button1Url: "https://github.com/xenmods/animerealms.org",
      });
    } else if (pathname.includes("/downloads")) {
      setDiscordPresence({
        details: "Offline Downloads",
        state: "Managing saved anime episodes",
        button1Label: "Anime Realms GitHub",
        button1Url: "https://github.com/xenmods/animerealms.org",
      });
    } else if (pathname.includes("/schedule")) {
      setDiscordPresence({
        details: "Release Schedule",
        state: "Checking upcoming episodes",
        button1Label: "Anime Realms GitHub",
        button1Url: "https://github.com/xenmods/animerealms.org",
      });
    } else if (pathname.includes("/visions")) {
      setDiscordPresence({
        details: "Browsing Visions",
        state: "Exploring short clips & highlights",
        button1Label: "Anime Realms GitHub",
        button1Url: "https://github.com/xenmods/animerealms.org",
      });
    } else if (pathname.includes("/settings")) {
      setDiscordPresence({
        details: "Configuring Settings",
        state: "Customizing Anime Realms",
        button1Label: "Anime Realms GitHub",
        button1Url: "https://github.com/xenmods/animerealms.org",
      });
    } else if (pathname.includes("/user/")) {
      const username = pathname.split("/user/")[1]?.split("/")[0] || "User";
      setDiscordPresence({
        details: `Viewing Profile: ${username}`,
        state: "Anime Realms Desktop",
        button1Label: "Anime Realms GitHub",
        button1Url: "https://github.com/xenmods/animerealms.org",
      });
    } else {
      setDiscordPresence({
        details: "Anime Realms Desktop",
        state: "Watching Free Anime",
        button1Label: "Anime Realms GitHub",
        button1Url: "https://github.com/xenmods/animerealms.org",
      });
    }
  }, [pathname]);

  return null;
}