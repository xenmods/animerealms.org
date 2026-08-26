"use client";

import { useEffect, useState } from "react";
import AnimeList from "@/components/shared/anime-list";
import { useAnilist, MediaListStatus } from "@/lib/hooks/use-anilist";
import { useTranslations } from "next-intl";

interface UserAnimeListProps {
  status: MediaListStatus;
  title: string;
  icon?: string;
}

export default function UserAnimeList({
  status,
  title,
  icon,
}: UserAnimeListProps) {
  const { getUserList, error } = useAnilist();
  const [animes, setAnimes] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getUserList(status).then((data) => {
      if (mounted && data) {
        // Map entries to generic media objects for AnimeList
        // AnimeList expects an array of anime objects, not list entries
        const mediaList = data.map((entry: any) => entry.media).filter(Boolean);
        setAnimes(mediaList);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [getUserList, status]);

  useEffect(() => {
    if (error) {
      console.error("[UserAnimeList] useAnilist error:", error);
    }
  }, [error]);

  if (loading) {
    // Optionally return a skeleton here, or just null to pop in.
    // Given the design, an empty AnimeList with 'loading' prop might be better if supported,
    // or just render nothing until loaded.
    // For now, let's render standard AnimeList with empty data which usually handles skeletons if intended,
    // or just wait. The existing AnimeList doesn't seem to have explicit loading state prop exposed here easily
    // without checking its code. Let's assume passed null/undefined might show skeletons or we just wait.
    return null;
  }

  if (!animes || animes.length === 0) {
    return null;
  }

  return (
    <AnimeList
      title={title}
      animes={animes}
      icon={icon || "solar:bookmark-opened-broken"}
    />
  );
}
