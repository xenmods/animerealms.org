"use server";

import { signIn as authSignIn } from "next-auth/react";
import { fetchEpisodesAnilist, getTitleLogo } from "@/lib/tmdb";
import clientPromise from "@/lib/db";
import { auth } from "@/auth";

export async function signIn(provider: string) {
  console.log("Signing in with provider:", provider);
  return await authSignIn(provider);
}

export async function getEpisodesAnilist(id: number) {
  return await fetchEpisodesAnilist(id);
}

export async function getTitleLogoAnilist(anilistId: number, locale: string) {
  return await getTitleLogo(anilistId, locale);
}

export async function updateProgress(
  user_id,
  anime_id,
  episode_id,
  progress,
  duration,
  animeDetails
) {
  console.log(
    `Updating progress for user ${user_id} for anime ${anime_id} episode ${episode_id}`
  );
  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const collection = db.collection("users");

  const filter = { _id: user_id };
  const now = new Date();

  const pullUpdate = {
    $pull: {
      recent_progress: {
        anime_id: anime_id,
      },
    },
  };

  const pushUpdate = {
    $push: {
      recent_progress: {
        $each: [
          {
            anime_id: anime_id,
            episode_id: episode_id,
            progress: progress,
            duration: duration,
            anime: animeDetails,
            timestamp: now,
          },
        ],
        $slice: -15,
      },
    },
  };

  const options = { upsert: true };

  try {
    await collection.updateOne(filter, pullUpdate);
    const result = await collection.updateOne(filter, pushUpdate, options);

    console.log(
      `Logged progress for user ${user_id}. Matched: ${
        result.matchedCount
      }, Modified: ${result.modifiedCount}, Upserted: ${
        result.upsertedId ? 1 : 0
      }`
    );
    return result;
  } catch (error) {
    console.error("Error updating progress:", error);
    throw error;
  }
}

/**
 * Retrieves the most recent watch progress for a specific episode
 * from the user's 15-item history.
 *
 * @param {string} user_id - The user's unique ID.
 * @param {string} anime_id - The anime's unique ID.
 * @param {string} episode_id - The episode's unique ID.
 * @returns {Promise<number>} - The progress (in seconds) or 0 if not found.
 */
export async function getUserProgress(user_id, anime_id, episode_id) {
  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const collection = db.collection("users");

  const filter = { _id: user_id };

  // We only need the 'recent_progress' array
  const projection = { _id: 0, recent_progress: 1 };

  try {
    const user = await collection.findOne(filter, { projection });

    // If user or their progress log doesn't exist, return 0
    if (!user || !user.recent_progress || user.recent_progress.length === 0) {
      console.log(`User or progress history not found: ${user_id}`);
      return 0;
    }

    // Find the *most recent* entry matching the episode
    // We search in reverse (from newest to oldest)
    const recentEntry = user.recent_progress
      .slice() // Create a shallow copy to avoid mutating the original
      .reverse()
      .find((p) => p.anime_id === anime_id && p.episode_id === episode_id);

    // Return the progress or 0 if no entry was found
    return recentEntry ? recentEntry.progress : 0;
  } catch (error) {
    console.error("Error getting user progress:", error);
    return 0;
  }
}

export async function getAllProgress(user_id) {
  const client = await clientPromise;
  const db = await client.db("animerealms_v2");
  const collection = await db.collection("users");

  const filter = { _id: user_id };
  const projection = { _id: 0, recent_progress: 1 };

  try {
    const user = await collection.findOne(filter, { projection });

    // If user or their progress log doesn't exist, return []
    if (!user || !user.recent_progress || user.recent_progress.length === 0) {
      console.log(`User or progress history not found: ${user_id}`);
      return [];
    }

    return user.recent_progress;
  } catch (err) {
    console.error("Error getting user progress:", err);
    return [];
  }
}

/**
 * Removes a specific watch progress entry from a user's history.
 *
 * @param {string} user_id - The user's unique ID.
 * @param {string} anime_id - The anime's unique ID.
 * @param {string} episode_id - The episode's unique ID.
 */
export async function removeProgressEntry(user_id, anime_id, episode_id) {
  console.log(
    `Removing progress for user ${user_id} for anime ${anime_id} episode ${episode_id}`
  );
  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const collection = db.collection("users");

  const filter = { _id: user_id };

  // Define the $pull operation to remove the matching entry
  const updateOperation = {
    $pull: {
      recent_progress: {
        anime_id: anime_id,
        episode_id: episode_id,
      },
    },
  };

  try {
    // We don't need upsert here. If the user doesn't exist,
    // it will match 0 and modify 0, which is fine.
    const result = await collection.updateOne(filter, updateOperation);

    console.log(
      `Removed progress entry for user ${user_id}. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
    );
    return result;
  } catch (error) {
    console.error("Error removing progress entry:", error);
    throw error;
  }
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const user_id = session.user.name;
  console.log(`Deleting account for user ${user_id}`);

  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const collection = db.collection("users");

  try {
    const result = await collection.deleteOne({ _id: user_id });
    console.log(
      `Deleted user ${user_id}. Deleted count: ${result.deletedCount}`
    );
    return result.deletedCount > 0;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
}
