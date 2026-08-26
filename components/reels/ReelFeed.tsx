"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { getReelFeed, AnimeReel } from "@/actions/reels";
import { ReelItem } from "./ReelItem";
import { CommentDrawer } from "./CommentDrawer";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

export function ReelFeed() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ axis: "y", loop: false });
  const [reels, setReels] = useState<AnimeReel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Start unmuted by default (user request), browser might block but we try
  const [isMuted, setIsMuted] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [activeCommentAnimeId, setActiveCommentAnimeId] = useState<
    string | null
  >(null);
  const [activeReelTitle, setActiveReelTitle] = useState("");

  // Initial Fetch
  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    setLoading(true);
    const data = await getReelFeed(1);
    setReels((prev) => [...prev, ...data]);
    setLoading(false);
  };

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setActiveIndex(index);
    if (index >= reels.length - 2 && !loading) {
      // fetchMore()
    }
  }, [emblaApi, reels.length, loading]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const openComments = (animeId: number, title: string) => {
    setActiveCommentAnimeId(animeId.toString());
    setActiveReelTitle(title);
    setShowComments(true);
  };

  if (loading && reels.length === 0) {
    return (
      <div className="h-[100dvh] w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm animate-pulse">
            Finding cool anime...
          </p>
        </div>
      </div>
    );
  }

  const canScrollNext = !!emblaApi?.canScrollNext();
  const canScrollPrev = !!emblaApi?.canScrollPrev();

  return (
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden">
      {/* Fixed Back Button (Desktop) */}
      <div className="absolute top-4 left-4 z-50 hidden md:block">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all font-medium border border-white/10"
        >
          <ArrowLeft size={20} />
          <span>Home</span>
        </Link>
      </div>

      {/* Fixed Mute Button */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-4 right-4 sm:top-10 sm:right-10 md:right-8 z-50 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all cursor-pointer"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Fixed Navigation Arrows (Desktop) */}
      <div className="hidden md:flex flex-col gap-4 absolute right-8 top-1/2 -translate-y-1/2 z-50">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
        >
          <ChevronUp size={24} />
        </button>
        <button
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext} // Todo: fetchMore trigger handled in effect, button disables at end
          className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
        >
          <ChevronDown size={24} />
        </button>
      </div>

      <div className="embla h-full w-full" ref={emblaRef}>
        <div className="embla__container h-full w-full user-select-none flex flex-col">
          {reels.map((reel, index) => {
            const isActive = index === activeIndex;
            return (
              <ReelItem
                key={`${reel.id}-${index}`}
                reel={reel}
                index={index}
                isActive={isActive}
                totalReels={reels.length}
                isMuted={isMuted}
                toggleMute={() => setIsMuted(!isMuted)}
                onCommentClick={openComments}
                onScrollNext={() => emblaApi?.scrollNext()}
                onScrollPrev={() => emblaApi?.scrollPrev()}
              />
            );
          })}
        </div>
      </div>

      {/* Comment Drawer */}
      {activeCommentAnimeId && (
        <CommentDrawer
          animeId={activeCommentAnimeId}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          title={activeReelTitle}
        />
      )}
    </div>
  );
}
