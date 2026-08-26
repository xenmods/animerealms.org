"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export function AnilistStatus() {
  const [isDown, setIsDown] = useState(false);

  useEffect(() => {
    // Ping anilist to see if it's down
    const checkStatus = async () => {
      try {
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `query { Media(id: 1) { id } }`
          }),
        });
        
        if (!res.ok) {
           setIsDown(true);
           return;
        }

        const data = await res.json();
        if (data.errors) {
          setIsDown(true);
        } else {
          setIsDown(false);
        }
      } catch (e) {
        setIsDown(true);
      }
    };
    
    checkStatus();
  }, []);

  if (!isDown) return null;

  return (
    <div className="w-full bg-destructive text-destructive-foreground py-1.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 z-100 relative rounded-b-xl">
      <Icon icon="solar:danger-triangle-bold" className="w-4 h-4" />
      <span>AniList API is currently experiencing issues. Some features and data might be unavailable.</span>
    </div>
  );
}
