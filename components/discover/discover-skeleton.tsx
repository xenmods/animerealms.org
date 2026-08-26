"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { AnimeListSkeleton } from "@/components/shared/anime-list-skeleton";

export function DiscoverSkeleton() {
  return (
    <div className="min-h-screen relative pb-10">
      <div className="w-full flex flex-col items-center gap-4 mb-10">
        {/* Hero Skeleton - mimicking the carousel height */}
        <div className="relative w-full h-[90vh] overflow-hidden">
          <Skeleton className="absolute inset-0 w-full h-full" />

          {/* Hero Content Overlay Skeleton */}
          <div className="relative z-10 w-full h-full flex flex-col justify-center px-4 md:px-12 pt-24 md:pt-40">
            <div className="max-w-3xl space-y-6">
              {/* Logo/Title */}
              <Skeleton className="h-32 md:h-40 w-full max-w-[250px] mb-4" />

              {/* Metadata */}
              <div className="flex gap-4">
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-6 w-12 rounded" />
                <Skeleton className="h-6 w-20 rounded" />
              </div>

              {/* Description */}
              <div className="space-y-2 max-w-2xl">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-4/6" />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-12 w-40 rounded-lg" />
                <Skeleton className="h-12 w-40 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10 px-4 md:px-12 container mx-auto relative z-10">
        <AnimeListSkeleton />
        <AnimeListSkeleton />
        <AnimeListSkeleton />
        <AnimeListSkeleton />
        <AnimeListSkeleton />
      </div>
    </div>
  );
}
