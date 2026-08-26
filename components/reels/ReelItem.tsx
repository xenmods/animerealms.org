"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimeReel, getLikeStatus, toggleLike } from "@/actions/reels";
import { ReelPlayer } from "./ReelPlayer";
import { ReelOverlay } from "./ReelOverlay";
import { ReelActions } from "./ReelActions";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

interface ReelItemProps {
  reel: AnimeReel;
  index: number;
  isActive: boolean;
  totalReels: number;
  isMuted: boolean;
  toggleMute: () => void;
  onCommentClick: (animeId: number, title: string) => void;
  onScrollPrev: () => void;
  onScrollNext: () => void;
}

export function ReelItem({
  reel,
  index,
  isActive,
  totalReels,
  isMuted,
  toggleMute,
  onCommentClick,
  onScrollPrev,
  onScrollNext,
}: ReelItemProps) {
  // Playback state
  const [userPaused, setUserPaused] = useState(false);

  // Likes state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  // Click detection for Double Tap
  const lastClickRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Like Status
  useEffect(() => {
    // Only fetch if we haven't already or if it's potentially stale (active)
    // For now, fetch on mount
    getLikeStatus(reel.id.toString()).then((data) => {
      setLiked(data.liked);
      setLikesCount(data.count);
    });
  }, [reel.id]);

  // Reset pause on active change
  useEffect(() => {
    if (isActive) {
      setUserPaused(false);
    }
  }, [isActive]);

  const handleInteraction = (e: React.MouseEvent) => {
    // Basic double tap detection logic
    const now = Date.now();
    const timeDiff = now - lastClickRef.current;

    if (timeDiff < 300) {
      // DOUBLE TAP
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      handleDoubleTap(e);
      lastClickRef.current = 0; // Reset
    } else {
      // SINGLE CLICK (Wait to see if it becomes double)
      lastClickRef.current = now;
      clickTimeoutRef.current = setTimeout(() => {
        // Confirmed Single Tap -> Toggle Pause
        if (isActive) {
          setUserPaused((prev) => !prev);
        }
        clickTimeoutRef.current = null;
      }, 300);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    // Trigger Like
    if (!liked) {
      handleLike();
    }
    // Show Animation
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 800);
  };

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      const res = await toggleLike(reel.id.toString());
      if (res.error) {
        toast.error("Please login to like!");
        // Revert
        setLiked(!newLiked);
        setLikesCount((prev) => (!newLiked ? prev + 1 : prev - 1));
      }
    } catch (e) {
      toast.error("Failed to like");
    }
  };

  return (
    <div
      className="embla__slide relative h-full w-full flex-[0_0_100%]"
      onClick={handleInteraction}
    >
      {/* Video Player */}
      <ReelPlayer
        videoId={reel.trailer?.id || ""}
        thumbnail={
          reel.trailer?.thumbnail ||
          reel.bannerImage ||
          reel.coverImage.extraLarge
        }
        isActive={isActive}
        isMuted={isMuted}
        toggleMute={toggleMute}
        shouldPlay={isActive && !userPaused}
        onVideoEnd={() => {
          if (isActive && index < totalReels - 1) {
            onScrollNext();
          }
        }}
      />

      {/* Heart Animation Overlay */}
      <AnimatePresence>
        {showHeartAnimation && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -100 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Heart className="w-24 h-24 fill-red-500 text-red-500 drop-shadow-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP LAYOUT WRAPPER */}
      <div className="absolute inset-0 pointer-events-none flex justify-center md:py-8">
        <div className="w-full h-full md:max-w-[calc((100vh-4rem)*(9/16))] relative">
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-20 md:rounded-xl overflow-hidden pointer-events-none" />

          {/* User Paused Indicator (Optional, subtle play icon in center when paused) */}
          {userPaused && isActive && (
            <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-white border-b-[10px] border-b-transparent ml-1" />
              </div>
            </div>
          )}

          {/* Controls & Info Layer */}
          <div className="absolute inset-0 z-30 flex flex-col justify-end p-4 pb-24 md:pb-8 pointer-events-auto">
            <div className="flex items-end gap-4">
              {/* Left: Info */}
              <div
                className="flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()} // Prevent click-through for text selection etc?
              >
                <ReelOverlay
                  animeId={reel.id}
                  title={reel.title.english || reel.title.romaji}
                  description={reel.description}
                  genres={reel.genres}
                  friendActivity={reel.friendActivity}
                  onDetailsOpen={() => setUserPaused(true)}
                />
              </div>

              {/* Right: Actions */}
              <div
                className="flex-none pb-2 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <ReelActions
                  animeId={reel.id.toString()}
                  title={reel.title.english || reel.title.romaji}
                  onCommentClick={() =>
                    onCommentClick(
                      reel.id,
                      reel.title.english || reel.title.romaji
                    )
                  }
                  liked={liked}
                  likesCount={likesCount}
                  onLike={handleLike}
                />
              </div>
            </div>
          </div>

          {/* Desktop Navigation Arrows Moved to Feed */}
        </div>
      </div>
    </div>
  );
}
