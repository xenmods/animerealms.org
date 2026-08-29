/**
 * Offline AniList Watch Progress Sync Queue
 * Stores episode progress locally when offline and pushes to AniList on reconnect.
 */

import { toast } from "sonner";

export interface QueuedWatchProgress {
  id: string;
  userId?: string;
  anilistId: number;
  episodeNumber: number;
  progress: number;
  duration: number;
  animeTitle?: string;
  timestamp: number;
}

const STORAGE_KEY = "animerealms_offline_sync_queue";

export function getOfflineQueue(): QueuedWatchProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("[SyncQueue] Failed to read offline queue:", e);
    return [];
  }
}

export function saveOfflineQueue(queue: QueuedWatchProgress[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn("[SyncQueue] Failed to save offline queue:", e);
  }
}

export function enqueueOfflineProgress(entry: Omit<QueuedWatchProgress, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  const queue = getOfflineQueue();
  const id = `${entry.anilistId}_${entry.episodeNumber}`;

  // Replace existing progress for the same episode if already queued
  const filtered = queue.filter((item) => item.id !== id);
  filtered.push({
    ...entry,
    id,
    timestamp: Date.now(),
  });

  saveOfflineQueue(filtered);
  console.log(`[SyncQueue] Queued offline progress for AniList ID ${entry.anilistId}, Episode ${entry.episodeNumber}`);
}

export async function processOfflineSyncQueue(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) return;

  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`[SyncQueue] Processing ${queue.length} pending items...`);
  const remaining: QueuedWatchProgress[] = [];

  for (const item of queue) {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("anilist_token") : null;
      
      if (token && item.anilistId > 0) {
        const query = `
          mutation ($mediaId: Int, $progress: Int) {
            SaveMediaListEntry (mediaId: $mediaId, progress: $progress) {
              id
              mediaId
              progress
              status
            }
          }
        `;
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query,
            variables: {
              mediaId: item.anilistId,
              progress: item.episodeNumber,
            },
          }),
        });

        if (res.ok) {
          toast.success(
            `Synchronized ${item.animeTitle || "Anime"} - Episode ${item.episodeNumber} with AniList!`
          );
          continue;
        }
      }

      // If token not available or synced through internal action
      remaining.push(item);
    } catch (e) {
      console.warn(`[SyncQueue] Failed to sync item ${item.id}:`, e);
      remaining.push(item);
    }
  }

  saveOfflineQueue(remaining);
}
