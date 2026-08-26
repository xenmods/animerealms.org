"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Link as I18nLink } from "@/i18n/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { AnimeCard } from "@/components/shared/anime-card";
import Autoplay from "embla-carousel-autoplay";
import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DiscoverHeroProps {
  files: any[];
}

export default function DiscoverHero({ files }: DiscoverHeroProps) {
  const t = useTranslations("Discover");
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (!files || files.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center gap-4 mb-2">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full h-[90vh] group relative overflow-hidden"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="h-full ml-0">
          {files.map((anime) => (
            <CarouselItem
              key={anime.id}
              className="relative w-full h-[90vh] pl-0 block sm:px-12"
            >
              {/* Background Image Container - Absolute Full Coverage */}
              <div className="absolute inset-0 z-0 w-full h-full">
                <Image
                  src={
                    anime.bannerImage ||
                    anime.coverImage?.extraLarge ||
                    anime.coverImage?.large
                  }
                  alt={anime.title?.english || anime.title?.romaji}
                  fill
                  className="object-cover opacity-60"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-r from-background via-background/60 to-transparent" />
              </div>

              {/* Content Container - Relative z-10 Full Height Centered */}
              <div className="relative z-10 w-full h-full flex flex-col justify-center px-4 md:px-12 pt-24 md:pt-40">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-3xl space-y-6"
                >
                  {anime.logo ? (
                    <div className="relative h-32 md:h-40 w-full max-w-[250px] md:max-w-lg mb-4">
                      {/* Adjusted max-w and h for logo to be punchy but reasonable */}
                      <Image
                        src={anime.logo}
                        alt={anime.title?.english || anime.title?.romaji}
                        fill
                        className="object-contain object-left"
                        priority
                      />
                    </div>
                  ) : (
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none line-clamp-2">
                      {anime.title?.english || anime.title?.romaji}
                    </h1>
                  )}

                  <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                    {anime.format && (
                      <span className="uppercase px-2 py-0.5 border border-border rounded text-xs">
                        {anime.format}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Icon
                        icon="solar:star-bold"
                        className="text-yellow-500"
                      />
                      {anime.averageScore
                        ? (anime.averageScore / 10).toFixed(1)
                        : "N/A"}
                    </span>
                    <span>•</span>
                    <span>{anime.seasonYear || "Unknown"}</span>
                    {anime.episodes && (
                      <>
                        <span>•</span>
                        <span>{anime.episodes} eps</span>
                      </>
                    )}
                  </div>

                  <p className="text-lg md:text-xl text-muted-foreground line-clamp-3 max-w-2xl">
                    {anime.description?.replace(/<[^>]*>?/gm, "")}
                  </p>

                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      size="lg"
                      className="gap-2 h-12 px-8 text-base"
                      asChild
                    >
                      <I18nLink href={`/watch/${anime.id}/1`}>
                        <Icon icon="solar:play-bold" className="text-xl" />
                        {t("playNow")}
                      </I18nLink>
                    </Button>
                    <AnimeCard anime={anime}>
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 h-12 px-8 text-base pointer-events-none"
                      >
                        <Icon
                          icon="solar:info-circle-bold"
                          className="text-xl"
                        />
                        {t("moreInfo")}
                      </Button>
                    </AnimeCard>
                  </div>
                </motion.div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 hidden md:flex" />
        <CarouselNext className="right-4 hidden md:flex" />

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === current
                  ? "bg-primary w-4"
                  : "bg-primary/30 hover:bg-primary/50"
              )}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
