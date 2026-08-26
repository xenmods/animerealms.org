"use server";

import clientPromise from "@/lib/db";
import { Settings } from "@/components/settings-context"; // Import the interface from your hook

/**
 * Helper function to get the users collection
 */
async function getUsersCollection() {
  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  return db.collection("users");
}

/**
 * Loads the user's settings from MongoDB.
 * @param userId - The user's ID (from session.user.name)
 * @returns The user's settings object or null if not found.
 */
export async function loadUserSettings(
  userId: string
): Promise<Settings | null> {
  if (!userId) {
    return null;
  }

  try {
    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne(
      { _id: userId },
      { projection: { settings: 1 } } // Only fetch the settings field
    );

    if (user && user.settings) {
      return user.settings as Settings;
    }

    return null; // No settings found for this user
  } catch (error) {
    console.error("Failed to load user settings:", error);
    return null;
  }
}

/**
 * Saves or updates the user's settings in MongoDB.
 * @param userId - The user's ID (from session.user.name)
 * @param settings - The settings object to save.
 */
export async function saveUserSettings(userId: string, settings: Settings) {
  if (!userId) {
    return { error: "User not authenticated." };
  }

  try {
    const usersCollection = await getUsersCollection();

    await usersCollection.updateOne(
      { _id: userId }, // Find the user by their ID (session.user.name)
      { $set: { settings: settings } }, // Set the entire 'settings' field
      { upsert: true } // If the user document exists, update. If not, create it.
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to save user settings:", error);
    return { error: "Database operation failed." };
  }
}
