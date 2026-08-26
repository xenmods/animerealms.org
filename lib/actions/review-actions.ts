"use server";

import clientPromise from "@/lib/db";
import { auth } from "@/auth";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

const DATABASE_NAME = "animerealms_v2";
const COLLECTION_NAME = "reviews";

export async function submitReview(rating: number, message: string) {
  const session = await auth();
  if (!session?.user?.name) {
    throw new Error("Unauthorized");
  }

  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // Check if user already reviewed (double check server side)
  const existingReview = await collection.findOne({
    userId: session.user.name,
  });
  if (existingReview) {
    throw new Error("You have already submitted a review.");
  }

  await collection.insertOne({
    userId: session.user.name,
    username: session.user.name,
    userImage: session.user.image, // capture image if available for display
    rating,
    message,
    createdAt: new Date(),
  });

  revalidatePath("/reviews");
  return { success: true };
}

export async function skipReview() {
  const session = await auth();
  if (!session?.user?.name) {
    throw new Error("Unauthorized");
  }

  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const existingReview = await collection.findOne({
    userId: session.user.name,
  });
  if (existingReview) {
    return { success: true }; // Already handled
  }

  await collection.insertOne({
    userId: session.user.name,
    username: session.user.name,
    skipped: true,
    createdAt: new Date(),
  });

  return { success: true };
}

export async function hasUserReviewed() {
  const session = await auth();
  if (!session?.user?.name) {
    return false;
  }

  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const review = await collection.findOne({ userId: session.user.name });
  return !!review;
}

export async function getReviews() {
  const session = await auth();
  if (session?.user?.name !== "xen") {
    throw new Error("Unauthorized");
  }

  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const reviews = await collection
    .find({ skipped: { $ne: true } })
    .sort({ createdAt: -1 })
    .toArray();

  // Convert _id and createdAt to simple types if needed by Client Components,
  // but Server Components handle them fine. For safety in passing to client:
  return reviews.map((review) => ({
    ...review,
    _id: review._id.toString(),
    createdAt: review.createdAt,
  }));
}

export async function deleteAllReviews() {
  const session = await auth();
  if (session?.user?.name !== "xen") {
    throw new Error("Unauthorized");
  }

  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  await collection.deleteMany({});

  revalidatePath("/reviews");
  return { success: true };
}
