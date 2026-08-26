"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface IdleOverlayProps {
  visible: boolean;
  logoUrl?: string | null;
  animeDetails: any;
  episode: any;
  className?: string;
}

export function IdleOverlay({
  visible,
  logoUrl,
  animeDetails,
  episode,
  className,
}: IdleOverlayProps) {
  const t = useTranslations("Player");

  if (!animeDetails || !episode) return null;

  const title = animeDetails.title.english || animeDetails.title.romaji;
  const description =
    episode.overview !== "No Description"
      ? episode.overview
      : animeDetails.description;
  const episodeTitle = episode.name;
  const episodeNumber = episode.episode_number;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={cn(
            "absolute inset-0 z-50 flex items-center bg-background/75 backdrop-blur-xs pointer-events-none",
            className
          )}
        >
          <div className="container px-10 md:px-20 flex flex-col items-start gap-6 max-w-4xl">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col gap-2"
            >
              <span className="text-white/70 text-sm font-medium uppercase tracking-widest">
                {t("idle_watching")}
              </span>

              {logoUrl ? (
                <div className="relative h-32 w-80 md:h-48 md:w-96 my-4">
                  <Image
                    src={logoUrl}
                    alt={title}
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              ) : (
                <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                  {title}
                </h1>
              )}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold text-lg md:text-xl">
                  {t("idle_episode", { number: episodeNumber })}
                </span>
                {episodeTitle && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="text-white/90 text-lg md:text-xl">
                      {episodeTitle}
                    </span>
                  </>
                )}
              </div>

              {description && (
                <p
                  className="text-white/70 text-base md:text-lg max-w-2xl line-clamp-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: 0.5,
                duration: 1,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="mt-4"
            >
              <p className="text-white/50 text-sm">{t("idle_resume")}</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
