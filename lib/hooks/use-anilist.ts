"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface AnilistError {
  message: string;
  status: number;
  locations: { line: number; column: number }[];
}

export type MediaListStatus =
  | "CURRENT"
  | "COMPLETED"
  | "PAUSED"
  | "DROPPED"
  | "PLANNING"
  | "REPEATING";

export interface FuzzyDateInput {
  year?: number | null;
  month?: number | null;
  day?: number | null;
}

export interface SaveMediaListEntryInput {
  status?: MediaListStatus;
  score?: number;
  progress?: number;
  repeat?: number;
  private?: boolean;
  notes?: string;
  startedAt?: FuzzyDateInput;
  completedAt?: FuzzyDateInput;
}

export interface MediaListEntryData {
  status: MediaListStatus | "NONE";
  score: number;
  progress: number;
  repeat: number;
  private: boolean;
  notes: string;
  startedAt: FuzzyDateInput;
  completedAt: FuzzyDateInput;
  media: {
    episodes: number | null;
  };
}

export const useAnilist = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AnilistError[] | null>(null);

  // A reusable GraphQL fetcher function
  const fetchGraphQL = useCallback(
    async (query: string, variables: Record<string, any>) => {
      const accessToken = (session?.user as any)?.token;

      if (!accessToken) {
        console.error("No access token found in session.");
        setError([
          { message: "Not authenticated", status: 401, locations: [] },
        ]);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ query, variables }),
        });

        const data = await response.json();

        if (data.errors) {
          setError(data.errors);
          console.error("AniList API Errors:", JSON.stringify(data.errors));
          return null;
        }

        return data.data;
      } catch (err: any) {
        setError([{ message: err.message, status: 500, locations: [] }]);
        console.error("Fetch Error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session],
  );

  const markProgress = useCallback(
    async (mediaId: number, progress: number) => {
      const mutation = `
        mutation ($mediaId: Int, $progress: Int) {
          SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: CURRENT) {
            id
            progress
            status
          }
        }
      `;
      const data = await fetchGraphQL(mutation, { mediaId, progress });
      return data?.SaveMediaListEntry;
    },
    [fetchGraphQL],
  );

  const getProgress = useCallback(
    async (id: number) => {
      const getLists = `
      query ($id: Int) {
        Media(id: $id) {
          mediaListEntry {
            progress
            status
            customLists
            repeat
          }
        }
      }
    `;
      const data = await fetchGraphQL(getLists, { id });
      return (
        data?.Media?.mediaListEntry || {
          progress: 0,
          status: "NONE",
          repeat: 0,
        }
      );
    },
    [fetchGraphQL],
  );

  const getLists = useCallback(async () => {
    const query = `
      query {
        Viewer {
          mediaListOptions {
            animeList {
              customLists
            }
          }
        }
      }
    `;
    const data = await fetchGraphQL(query, {});
    return data?.Viewer?.mediaListOptions?.animeList?.customLists;
  }, [fetchGraphQL]);

  const getCurrentlyWatching = useCallback(async () => {
    const userName = session?.user?.name;
    if (!userName) return null;

    const query = `
      query ($userName: String) {
        MediaListCollection(userName: $userName, type: ANIME, status: CURRENT) {
          lists {
            name
            entries {
              progress
              media {
                id
                title {
                  romaji
                  english
                }
                episodes
                coverImage {
                  large
                }
                nextAiringEpisode {
                  episode
                  timeUntilAiring
                }
              }
            }
          }
        }
      }
    `;
    const data = await fetchGraphQL(query, { userName });
    return data?.MediaListCollection?.lists[0]?.entries || [];
  }, [fetchGraphQL, session]);

  const getUserList = useCallback(
    async (status: MediaListStatus) => {
      const userName = session?.user?.name;
      if (!userName) return null;

      const query = `
      query ($userName: String, $status: MediaListStatus) {
        MediaListCollection(userName: $userName, type: ANIME, status: $status, sort: UPDATED_TIME_DESC) {
          lists {
            name
            entries {
              progress
              score
              media {
                id
                title {
                  romaji
                  english
                }
                episodes
                coverImage {
                  large
                  extraLarge
                }
                nextAiringEpisode {
                  episode
                  timeUntilAiring
                }
                meanScore
                format
              }
            }
          }
        }
      }
    `;
      const data = await fetchGraphQL(query, { userName, status });
      return (
        data?.MediaListCollection?.lists?.flatMap((l: any) => l.entries) || []
      );
    },
    [fetchGraphQL, session],
  );

  const saveMediaListEntry = useCallback(
    async (mediaId: number, input: SaveMediaListEntryInput) => {
      const mutation = `
        mutation (
          $mediaId: Int,
          $status: MediaListStatus,
          $score: Float,
          $progress: Int,
          $repeat: Int,
          $private: Boolean,
          $notes: String,
          $startedAt: FuzzyDateInput,
          $completedAt: FuzzyDateInput
        ) {
          SaveMediaListEntry (
            mediaId: $mediaId,
            status: $status,
            score: $score,
            progress: $progress,
            repeat: $repeat,
            private: $private,
            notes: $notes,
            startedAt: $startedAt,
            completedAt: $completedAt
          ) {
            id
            status
            progress
            score
            repeat
            private
            notes
            startedAt { year month day }
            completedAt { year month day }
          }
        }
      `;
      const data = await fetchGraphQL(mutation, { mediaId, ...input });
      return data?.SaveMediaListEntry;
    },
    [fetchGraphQL],
  );

  const getMediaListEntry = useCallback(
    async (id: number): Promise<MediaListEntryData | null> => {
      const query = `
        query ($id: Int) {
          Media(id: $id) {
            episodes
            coverImage {
              large
              extraLarge
            }
            mediaListEntry {
              id
              mediaId
              status
              score
              progress
              repeat
              private
              notes
              startedAt { year month day }
              completedAt { year month day }
            }
          }
        }
      `;
      const data = await fetchGraphQL(query, { id });

      if (!data?.Media) return null;

      return {
        ...(data.Media.mediaListEntry || {
          status: "NONE",
          score: 0,
          progress: 0,
          repeat: 0,
          private: false,
          notes: "",
          startedAt: {},
          completedAt: {},
        }),
        media: {
          episodes: data.Media.episodes,
        },
      };
    },
    [fetchGraphQL],
  );

  const deleteMediaListEntry = useCallback(
    async (id: number) => {
      const mutation = `
        mutation ($id: Int) {
          DeleteMediaListEntry (id: $id) {
            deleted
          }
        }
      `;
      const data = await fetchGraphQL(mutation, { id });
      return data?.DeleteMediaListEntry;
    },
    [fetchGraphQL],
  );

  const getViewerOptions = useCallback(async () => {
    const query = `
      query {
        Viewer {
          mediaListOptions {
            scoreFormat
          }
        }
      }
    `;
    const data = await fetchGraphQL(query, {});
    return data?.Viewer?.mediaListOptions;
  }, [fetchGraphQL]);

  return {
    loading,
    error,
    markProgress,
    getProgress,
    getLists,
    getCurrentlyWatching,
    saveMediaListEntry,
    getMediaListEntry,
    deleteMediaListEntry,
    getViewerOptions,
    getUserList,
  };
};
