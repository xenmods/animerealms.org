"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/navigation";
import { AnimeCard } from "@/components/shared/anime-card";
import { format } from "date-fns";

interface ScheduleItem {
  id: number;
  airingAt: number;
  episode: number;
  media: any;
}

export default function ScheduleSection({
  schedule,
}: {
  schedule: ScheduleItem[];
}) {
  const t = useTranslations("Home");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Parse schedule items to extract media and add airing time info
  const scheduleItems = schedule.map((item) => {
    // Format time: e.g. "14:30"
    const date = new Date(item.airingAt * 1000);
    const time = format(date, "h:mm a");
    return {
      ...item.media,
      airingTime: time,
      airingAt: item.airingAt,
    };
  });

  // Sort by airing time
  scheduleItems.sort((a, b) => a.airingAt - b.airingAt);

  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    setCurrentTime(Date.now() / 1000);
  }, []);

  // Filter for upcoming anime and limit to 7
  // If currentTime is not set (SSR), show mostly nothing or handle gracefully.
  // We'll show nothing until mounted to avoid hydration mismatch.
  const filteredItems = currentTime
    ? scheduleItems.filter((item) => item.airingAt > currentTime).slice(0, 7)
    : [];

  if (!currentTime) return null;

  return (
    <section className="flex flex-col gap-4 w-full min-w-[90vw] max-w-[90vw] min-[1921px]:min-w-full min-[1921px]:max-w-full animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div className="flex items-center gap-2">
          <Icon icon="solar:calendar-date-broken" className="text-xl" />
          <h2 className="font-semibold uppercase">
            {t("todays_schedule") || "Today's Schedule"}
          </h2>
        </div>
        <Link
          href="/schedule"
          className="group flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {t("view_all") || "View All"}
          <Icon
            icon="solar:arrow-right-broken"
            className="text-lg transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>

      <div
        ref={scrollContainerRef}
        className="relative flex w-full gap-4 overflow-x-auto pb-4 pt-2 px-4 sm:px-0 no-scrollbar snap-x snap-mandatory"
      >
        {filteredItems.map((anime, index) => (
          <motion.div
            key={anime.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative min-w-[160px] w-[160px] sm:min-w-[180px] sm:w-[180px] min-[1921px]:min-w-[330px] min-[1921px]:w-[330px] snap-start"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md bg-accent/80 px-2 py-0.5 text-xs font-bold text-accent-foreground backdrop-blur-md border border-white/10">
                {anime.airingTime}
              </span>
            </div>
            <AnimeCard anime={anime} />
          </motion.div>
        ))}

        <div className="flex min-w-[100px] min-[1921px]:min-w-[330px] min-[1921px]:w-[330px] flex-col items-center justify-center gap-2 snap-start">
          <Link
            href="/schedule"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/50 text-accent-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300"
          >
            <Icon icon="solar:arrow-right-line-duotone" className="text-2xl" />
          </Link>
          <span className="text-xs text-muted-foreground font-medium">
            {t("view_all")}
          </span>
        </div>
      </div>
    </section>
  );
}
