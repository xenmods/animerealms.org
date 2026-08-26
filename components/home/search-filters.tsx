"use client";

import * as React from "react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { DualSlider } from "@/components/ui/dual-slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";

export interface AdvancedFilters {
  genres: string[];
  yearRange: [number, number];
  status: string | null;
  sort: string;
}

export const defaultFilters: AdvancedFilters = {
  genres: [],
  yearRange: [1990, new Date().getFullYear()],
  status: null,
  sort: "SEARCH_MATCH",
};

export const hasActiveFilters = (filters: AdvancedFilters): boolean => {
  if (!filters) return false;
  return (
    filters.genres.length > 0 ||
    filters.yearRange[0] !== 1990 ||
    filters.yearRange[1] !== new Date().getFullYear() ||
    filters.status !== null ||
    filters.sort !== "SEARCH_MATCH"
  );
};

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Mecha", "Music", "Mystery", "Psychological",
  "Romance", "Sci-Fi", "Slice of Life", "Sports",
  "Supernatural", "Thriller",
];

const STATUSES = [
  { label: "Finished Airing", value: "FINISHED" },
  { label: "Currently Airing", value: "RELEASING" },
  { label: "Upcoming", value: "NOT_YET_RELEASED" },
];

const SORTS = [
  { label: "Relevance", value: "SEARCH_MATCH" },
  { label: "Popularity", value: "POPULARITY_DESC" },
  { label: "Score", value: "SCORE_DESC" },
  { label: "Newest", value: "START_DATE_DESC" },
  { label: "Oldest", value: "START_DATE" },
  { label: "Title A-Z", value: "TITLE_ROMAJI" },
];

interface SearchFiltersProps {
  filters: AdvancedFilters;
  setFilters: (filters: AdvancedFilters) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  trigger: React.ReactNode;
}

export function SearchFilters({
  filters,
  setFilters,
  isOpen,
  setIsOpen,
  trigger,
}: SearchFiltersProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Local state for the form so we don't trigger search on every click, only on Apply
  const [localFilters, setLocalFilters] = React.useState<AdvancedFilters>(filters);
  const [minYearInput, setMinYearInput] = React.useState(filters.yearRange[0].toString());
  const [maxYearInput, setMaxYearInput] = React.useState(filters.yearRange[1].toString());

  // Sync local filters when the popover opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      setMinYearInput(filters.yearRange[0].toString());
      setMaxYearInput(filters.yearRange[1].toString());
    }
  }, [isOpen, filters]);

  // Keep them in sync when slider changes the state
  React.useEffect(() => {
    setMinYearInput(localFilters.yearRange[0].toString());
    setMaxYearInput(localFilters.yearRange[1].toString());
  }, [localFilters.yearRange]);

  const handleApply = () => {
    setFilters(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
    setIsOpen(false);
  };

  const toggleGenre = (genre: string) => {
    setLocalFilters((prev) => {
      const g = prev.genres.includes(genre)
        ? prev.genres.filter((x) => x !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres: g };
    });
  };

  const FilterContent = () => (
    <div 
      className="flex flex-col gap-6 p-4 overflow-y-auto w-[90vw] md:w-[360px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-sm border-border"
      style={{ maxHeight: isDesktop ? "calc(var(--radix-popover-content-available-height) - 20px)" : "80vh" }}
    >
      {/* Genres */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">Genres</h4>
        <div className="grid grid-cols-2 gap-2">
          {GENRES.map((genre) => (
            <div key={genre} className="flex items-center space-x-2">
              <Checkbox
                id={`genre-${genre}`}
                checked={localFilters.genres.includes(genre)}
                onCheckedChange={() => toggleGenre(genre)}
              />
              <Label
                htmlFor={`genre-${genre}`}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {genre}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Year Range */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">Year Range</h4>
        <DualSlider
          min={1970}
          max={new Date().getFullYear() + 1}
          step={1}
          value={[localFilters.yearRange[0], localFilters.yearRange[1]]}
          onValueChange={(val: any) =>
            setLocalFilters((prev) => ({ ...prev, yearRange: [val[0], val[1]] }))
          }
          className="my-4"
        />
        <div className="flex items-center justify-between text-muted-foreground px-1 gap-2">
          <Input
            type="number"
            min={1970}
            max={localFilters.yearRange[1]}
            value={minYearInput}
            onChange={(e) => setMinYearInput(e.target.value)}
            onBlur={() => {
              let val = parseInt(minYearInput);
              if (isNaN(val)) val = 1970;
              val = Math.max(1970, Math.min(val, localFilters.yearRange[1]));
              setLocalFilters((prev) => ({
                ...prev,
                yearRange: [val, prev.yearRange[1]],
              }));
            }}
            className="w-20 text-center bg-secondary border-none h-8 px-1 text-xs"
          />
          <span className="text-xs">to</span>
          <Input
            type="number"
            min={localFilters.yearRange[0]}
            max={new Date().getFullYear() + 1}
            value={maxYearInput}
            onChange={(e) => setMaxYearInput(e.target.value)}
            onBlur={() => {
              let val = parseInt(maxYearInput);
              const maxYear = new Date().getFullYear() + 1;
              if (isNaN(val)) val = maxYear;
              val = Math.min(maxYear, Math.max(val, localFilters.yearRange[0]));
              setLocalFilters((prev) => ({
                ...prev,
                yearRange: [prev.yearRange[0], val],
              }));
            }}
            className="w-20 text-center bg-secondary border-none h-8 px-1 text-xs"
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">Status</h4>
        <div className="flex flex-col gap-2">
          {STATUSES.map((status) => (
            <div key={status.value} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status.value}`}
                checked={localFilters.status === status.value}
                onCheckedChange={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    status: prev.status === status.value ? null : status.value,
                  }))
                }
              />
              <Label
                htmlFor={`status-${status.value}`}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {status.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">Sort By</h4>
        <Select
          value={localFilters.sort}
          onValueChange={(val) =>
            setLocalFilters((prev) => ({ ...prev, sort: val }))
          }
        >
          <SelectTrigger className="w-full bg-secondary border-none">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="z-[9999]" position="popper" side="top" sideOffset={5}>
            {SORTS.map((sort) => (
              <SelectItem key={sort.value} value={sort.value}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 pb-2">
        <Button onClick={handleApply} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={handleClear} className="flex-1 rounded-full border-border/50 bg-background hover:bg-secondary">
          Clear All
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 border-border bg-card shadow-2xl rounded-xl" 
          align="end" 
          sideOffset={10} 
          collisionPadding={20}
        >
          {FilterContent()}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="bg-card border-border">
        <DrawerHeader className="text-left py-2">
          <DrawerTitle>Advanced Filters</DrawerTitle>
        </DrawerHeader>
        <div className="px-2 pb-6">
          {FilterContent()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
