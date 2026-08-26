"use client";

import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleLike, getLikeStatus } from "@/actions/reels";
import { toast } from "sonner";
import { LikesDialog } from "./LikesDialog";

interface ReelActionsProps {
  animeId: string;
  onCommentClick: () => void;
  title: string;
  liked: boolean;
  likesCount: number;
  onLike: () => void;
}

export function ReelActions({
  animeId,
  onCommentClick,
  title,
  liked,
  likesCount,
  onLike,
}: ReelActionsProps) {
  // Removed local state for liked/likesCount as it is now controlled by parent

  const handleShare = () => {
    navigator.clipboard.writeText(`https://anilist.co/anime/${animeId}`);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* LIKE */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className="p-3 rounded-full transition-all active:scale-95  group"
        >
          <Heart
            className={cn(
              "w-8 h-8 transition-colors duration-300",
              liked
                ? "fill-red-500 text-red-500"
                : "text-white group-hover:scale-110"
              // isAnimating removed here, handled by parent or simplified
            )}
          />
        </button>

        <LikesDialog
          animeId={animeId}
          trigger={
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-bold text-white drop-shadow-md hover:underline cursor-pointer"
            >
              {likesCount}
            </button>
          }
        />
      </div>

      {/* COMMENT */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onCommentClick}
          className="p-3 rounded-full transition-all active:scale-95  group"
        >
          <MessageCircle className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        </button>
        <span className="text-xs font-bold text-white drop-shadow-md">
          Comments
        </span>
      </div>

      {/* SHARE */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleShare}
          className="p-3 rounded-full transition-all active:scale-95  group"
        >
          <Share2 className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
        </button>
        <span className="text-xs font-bold text-white drop-shadow-md">
          Share
        </span>
      </div>

      {/* MORE */}
      <button className="p-3 rounded-full transition-all active:scale-95  group mt-2">
        <MoreHorizontal className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}
