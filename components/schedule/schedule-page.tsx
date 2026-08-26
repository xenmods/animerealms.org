"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AnimeCard } from "@/components/shared/anime-card";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface ScheduleItem {
  id: number;
  airingAt: number;
  episode: number;
  media: any;
  isPast?: boolean;
}

interface SchedulePageProps {
  schedule: ScheduleItem[];
}

export default function SchedulePage({ schedule }: SchedulePageProps) {
  const t = useTranslations("Home");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<number>(Date.now() / 1000);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const nextAiringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update time every minute to keep "next airing" fresh
    const interval = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Generate the days for the current week starting Monday
  const weekDays = useMemo<Date[]>(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  // Filter schedule for selected day
  const dailySchedule = useMemo(() => {
    return schedule
      .filter((item) => {
        const itemDate = new Date(item.airingAt * 1000);
        return isSameDay(itemDate, selectedDay);
      })
      .sort((a, b) => a.airingAt - b.airingAt)
      .map((item) => ({
        ...item.media,
        airingTime: format(new Date(item.airingAt * 1000), "h:mm a"),
        airingAt: item.airingAt,
        episode: item.episode,
        isPast: item.airingAt < currentTime,
      }));
  }, [schedule, selectedDay, currentTime]);

  // Find index of the first show that hasn't aired yet
  const nextAiringIndex = dailySchedule.findIndex((item) => !item.isPast);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show button if NOT intersecting (meaning it's off screen)
        // We also check if there IS a next airing item to scroll to.
        if (nextAiringIndex !== -1 && isSameDay(selectedDay, new Date())) {
          setShowScrollButton(!entry.isIntersecting);
        } else {
          setShowScrollButton(false);
        }
      },
      {
        threshold: 0.1, // Trigger when even a small part is visible/hidden
        rootMargin: "0px 0px -100px 0px", // Offset a bit so it triggers before it's completely gone/here
      }
    );

    if (nextAiringRef.current) {
      observer.observe(nextAiringRef.current);
    }

    return () => observer.disconnect();
  }, [nextAiringIndex, selectedDay]); // Re-run when next airing changes

  const scrollToNextAiring = () => {
    nextAiringRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="min-h-screen w-full px-4 pt-4 pb-8 md:px-8 max-w-[1200px] mx-auto flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-2 items-center text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          {t("schedule_title") || "Weekly Schedule"}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("schedule_subtitle") ||
            "Keep track of your favorite anime airing times"}
        </p>
      </div>

      {/* Day Selector */}
      <div className="sticky top-0 z-40 -mx-4 px-4 py-4 md:static md:mx-0 md:px-0 bg-background/95 backdrop-blur-xl md:bg-transparent border-b md:border-none">
        <div className="flex gap-2 overflow-x-auto no-scrollbar p-2 md:pb-0 md:flex-wrap justify-start md:justify-center">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, new Date());
            const dayName = format(day, "EEEE");
            const dateNum = format(day, "d");

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`
                  relative flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-2xl transition-all duration-300 border
                  ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                      : "bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                  }
                `}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                  {dayName.substring(0, 3)}
                </span>
                <span className="text-xl font-bold">{dateNum}</span>
                {isToday && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline View */}
      <div className="w-full relative px-2 md:px-10">
        {/* Connector Line Removed (handled per item) */}

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay.toISOString()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-8 pb-20"
          >
            {dailySchedule.length > 0 ? (
              dailySchedule.map((anime, idx) => {
                const isNext =
                  idx === nextAiringIndex && isSameDay(selectedDay, new Date());
                const isPast = anime.isPast;

                return (
                  <motion.div
                    key={anime.id}
                    // Flatten animation for performance if list is long, but kept for cool effect
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    ref={isNext ? nextAiringRef : null}
                    className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0 
                      ${idx % 2 === 0 ? "md:flex-row-reverse" : ""}
                    `}
                  >
                    {/* Time (Mobile: Top, Desktop: Opposite Side) */}
                    <div className="flex-1 w-full md:w-auto flex md:justify-end md:px-10">
                      <div
                        className={`hidden md:flex flex-col ${
                          idx % 2 === 0 ? "items-start" : "items-end text-right"
                        } ${isPast && !isNext ? "opacity-50" : ""}`}
                      >
                        <span
                          className={`text-2xl font-bold tracking-tight ${
                            isNext ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {anime.airingTime}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                          Episode {anime.episode}
                        </span>
                      </div>
                      {/* Mobile Time Header */}
                      <div
                        className={`flex md:hidden items-center gap-3 pl-12 mb-2 ${
                          isPast && !isNext ? "opacity-50" : ""
                        }`}
                      >
                        <span
                          className={`text-lg font-bold ${
                            isNext
                              ? "text-primary bg-primary/10 px-2 py-0.5 rounded-md"
                              : "text-foreground"
                          }`}
                        >
                          {anime.airingTime}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium uppercase border border-border px-2 py-0.5 rounded-full">
                          EP {anime.episode}
                        </span>
                      </div>
                    </div>

                    {/* Node and Connector */}
                    <div className="absolute left-[19px] md:left-[50%] md:-translate-x-1/2 top-0 bottom-0 flex flex-col items-center z-20">
                      {/* Top Line Connector (connects to previous) */}
                      {idx > 0 && (
                        <div
                          className={`w-0.5 flex-1 ${
                            isPast && !isNext
                              ? "bg-border/50"
                              : "bg-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                          }`}
                        />
                      )}

                      {/* Node Circle */}
                      <div className="relative z-10 py-1">
                        {/* Tooltip for Next Airing */}
                        {isNext && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 z-20">
                            {t("airing_next")}
                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-primary" />
                          </div>
                        )}

                        <div
                          className={`relative flex items-center justify-center w-4 h-4 rounded-full border-2 transition-all duration-500
                            ${
                              isNext
                                ? "border-primary bg-background scale-150 shadow-[0_0_15px_rgba(var(--primary),0.6)]"
                                : isPast
                                ? "border-muted-foreground/30 bg-muted"
                                : "border-primary/50 bg-background"
                            }
                          `}
                        >
                          {isNext && (
                            <div className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20" />
                          )}
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isNext
                                ? "bg-primary"
                                : isPast
                                ? "bg-muted-foreground/30"
                                : "bg-primary/50"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Bottom Line Connector (connects to next) */}
                      {idx < dailySchedule.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 ${
                            isPast
                              ? isNext
                                ? "bg-primary/50"
                                : "bg-border/50"
                              : "bg-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                          }`}
                        />
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 w-full pl-12 md:pl-10 md:px-10">
                      <div
                        className={`relative group overlow-hidden rounded-xl border bg-card/50 backdrop-blur-sm p-3 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:bg-card/80
                          ${
                            isNext
                              ? "border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                              : "border-transparent"
                          }
                          ${
                            isPast && !isNext
                              ? "opacity-50 hover:opacity-100 grayscale hover:grayscale-0"
                              : ""
                          }
                      `}
                      >
                        <div className="flex gap-4">
                          <div className="w-[80px] h-[110px] sm:w-[100px] sm:h-[140px] flex-shrink-0 relative rounded-lg overflow-hidden shadow-sm">
                            <AnimeCard anime={anime} />
                          </div>
                          <div className="flex flex-col py-1 gap-1">
                            <h3 className="font-bold text-base sm:text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                              {anime.title.userPreferred ||
                                anime.title.english ||
                                anime.title.romaji}
                            </h3>

                            <div className="flex flex-wrap gap-2 mt-auto">
                              {anime.genres
                                ?.slice(0, 2)
                                .map((genre: string) => (
                                  <span
                                    key={genre}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                                  >
                                    {genre}
                                  </span>
                                ))}
                            </div>

                            <div className="md:hidden mt-2 text-xs text-muted-foreground">
                              {isNext ? (
                                <span className="text-primary font-bold flex items-center gap-1">
                                  <Icon icon="solar:clock-circle-bold" /> Airing
                                  Next
                                </span>
                              ) : isPast ? (
                                <span>Aired</span>
                              ) : (
                                <span>Upcoming</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                <Icon icon="solar:sleep-broken" className="text-6xl mb-4" />
                <p className="text-xl font-medium">{t("no_anime_airing")}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Scroll Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToNextAiring}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 border border-primary/20 backdrop-blur-md"
          >
            <span className="text-sm">
              {t("scroll_to_airing") || "Scroll To Airing"}
            </span>
            <Icon
              icon="solar:double-alt-arrow-down-bold-duotone"
              className="text-xl animate-bounce"
            />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
