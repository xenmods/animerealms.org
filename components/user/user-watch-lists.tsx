"use client";

import { useSettings } from "@/components/settings-context";
import AnimeList from "@/components/shared/anime-list";
import { Badge } from "@/components/ui/badge";

interface UserWatchListsProps {
  lists: any[];
}

import { useTranslations } from "next-intl";

export default function UserWatchLists({ lists }: UserWatchListsProps) {
  const tShared = useTranslations("Shared");
  const { settings } = useSettings();
  const { profileListOrder } = settings;

  // Filter out empty lists
  const activeLists = lists.filter(
    (list) => list.entries && list.entries.length > 0,
  );

  // Sort lists based on profileListOrder
  const sortedLists = [...activeLists].sort((a, b) => {
    const indexA = profileListOrder.indexOf(a.name);
    const indexB = profileListOrder.indexOf(b.name);

    // If both are found in the order array, sort by index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If A is found but B is not, A comes first
    if (indexA !== -1) {
      return -1;
    }

    // If B is found but A is not, B comes first
    if (indexB !== -1) {
      return 1;
    }

    // If neither are found, keep original order (or sort alphabetically if preferred)
    return 0;
  });

  return (
    <div className="space-y-8">
      {sortedLists.map((list) => (
        <div key={list.name}>
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h3 className="text-xl font-bold">
              {tShared(list.name.toLowerCase()) || list.name}
            </h3>
            <span className="text-sm text-muted-foreground">
              ({list.entries.length})
            </span>
          </div>
          <AnimeList
            animes={list.entries.map((entry: any) => entry.media)}
            className="min-w-full max-w-full py-0"
          />
        </div>
      ))}
    </div>
  );
}
