"use client";

import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";
import { LampContainer } from "@/components/ui/lamp";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  SearchFilters,
  AdvancedFilters,
  hasActiveFilters,
} from "@/components/home/search-filters";
import { Button } from "@/components/ui/button";

export default function Hero({
  search,
  setSearch,
  filters,
  setFilters,
  greeting,
  placeholder,
}: {
  search?: string;
  setSearch?: (value: string) => void;
  filters?: AdvancedFilters;
  setFilters?: (filters: AdvancedFilters) => void;
  greeting?: string;
  placeholder?: string;
}) {
  const t = useTranslations("Home");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const filterActive = filters ? hasActiveFilters(filters) : false;
  const showFiltersBtn = search || filterActive || isFiltersOpen;

  return (
    <LampContainer className="h-screen flex items-center justify-center overflow-hidden z-[100] pt-20">
      <motion.div
        initial={{ opacity: 0.5 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          delay: 0.3,

          duration: 0.8,

          ease: "easeInOut",
        }}
        className="flex flex-col items-center justify-center gap-6 max-w-[80vw] lg:max-w-[40vw]"
      >
        <h1 className="text-3xl sm:text-5xl text-center">{greeting}</h1>

        <div className="relative w-full md:w-3/4 flex items-center group">
          <Input
            type="text"
            placeholder={placeholder || t("placeholder")}
            className="pl-10 pr-32 w-full shadow-none border focus-visible:border-border rounded-full focus-visible:outline-none focus-visible:ring-0 text-xs md:text-sm h-12"
            value={search}
            onChange={(e) => {
              const value = e.target.value;

              const capitalized = value.replace(/\b\w/g, (char) =>
                char.toUpperCase(),
              );

              if (setSearch) setSearch(capitalized);
            }}
          />

          <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon
              icon="solar:minimalistic-magnifer-linear"
              className="text-muted-foreground w-5 h-5"
            />
          </span>

          <div
            className={`absolute right-1 top-1/2 -translate-y-1/2 transition-opacity duration-300 z-10 ${
              showFiltersBtn
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
            }`}
          >
            {filters && setFilters && (
              <SearchFilters
                filters={filters}
                setFilters={setFilters}
                isOpen={isFiltersOpen}
                setIsOpen={setIsFiltersOpen}
                trigger={
                  <Button
                    variant="secondary"
                    className="h-8 rounded-full px-4 text-xs font-semibold hover:bg-secondary"
                  >
                    Advanced Filters
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </motion.div>
    </LampContainer>
  );
}
