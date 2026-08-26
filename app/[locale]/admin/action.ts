"use server";

import clientPromise from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export async function createNotification({
    title,
    content,
    tags,
}: {
    title: string;
    content: string;
    tags: string[];
}) {
    try {
        const client = await clientPromise;
        const db = client.db("animerealms_v2");
        const collection = db.collection("notifications");
        await collection.insertOne({
            title,
            content,
            tags,
            createdAt: new Date(),
            readBy: [],
        });
        revalidatePath("/api/notifications");
    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while creating the notification.");
    }
}

export async function getNotifications() {
    try {
        const client = await clientPromise;
        const db = client.db("animerealms_v2");
        const collection = db.collection("notifications");
        const notifications = await collection.find({}).sort({ createdAt: -1 }).toArray();
        return JSON.stringify(notifications);
    } catch (error) {
        console.error(error);
        return "[]";
    }
}

export async function updateNotification({
    id,
    title,
    content,
    tags,
}: {
    id: string;
    title: string;
    content: string;
    tags: string[];
}) {
    try {
        const client = await clientPromise;
        const db = client.db("animerealms_v2");
        const collection = db.collection("notifications");
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, content, tags } }
        );
        revalidatePath("/api/notifications");
    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while updating the notification.");
    }
}

export async function deleteNotification(id: string) {
    try {
        const client = await clientPromise;
        const db = client.db("animerealms_v2");
        const collection = db.collection("notifications");
        await collection.deleteOne({ _id: new ObjectId(id) });
        revalidatePath("/api/notifications");
    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while deleting the notification.");
    }
}

export async function getDocuments(collectionName: string, page: number = 1) {
  try {
    const client = await clientPromise;
    const db = client.db("animerealms_v2");
    const collection = db.collection(collectionName);
    const documents = await collection
      .find({})
      .skip((page - 1) * 10)
      .limit(10)
      .toArray();
    const count = await collection.countDocuments();
    return {
      documents: JSON.stringify(documents, null, 2),
      count,
    };
  } catch (error) {
    console.error(error);
    return {
      documents: "An error occurred while fetching documents.",
      count: 0,
    };
  }
}

export async function searchCollection(collectionName: string, id: string) {
  try {
    const client = await clientPromise;
    const db = client.db("animerealms_v2");
    const collection = db.collection(collectionName);
    let result;
    if (collectionName === "users") {
      result = await collection.findOne({ _id: id });
    } else {
      result = await collection.findOne({ anilistId: parseInt(id) });
    }
    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error(error);
    return "An error occurred while searching the collection.";
  }
}

export async function updateDocument(
  collectionName: string,
  id: string,
  content: string
) {
  try {
    const client = await clientPromise;
    const db = client.db("animerealms_v2");
    const collection = db.collection(collectionName);
    let result;
    if (collectionName === "users") {
      result = await collection.updateOne(
        { _id: id },
        { $set: JSON.parse(content) }
      );
    } else {
      result = await collection.updateOne(
        { anilistId: parseInt(id) },
        { $set: JSON.parse(content) }
      );
    }
    revalidatePath("/[locale]/admin", "page");
    return `Successfully updated ${result.modifiedCount} document.`;
  } catch (error) {
    console.error(error);
    return "An error occurred while updating the document.";
  }
}

export async function deleteDocument(collectionName: string, id: string) {
  try {
    const client = await clientPromise;
    const db = client.db("animerealms_v2");
    const collection = db.collection(collectionName);
    let result;
    if (collectionName === "users") {
      result = await collection.deleteOne({ _id: id });
    } else {
      result = await collection.deleteOne({ anilistId: parseInt(id) });
    }
    revalidatePath("/[locale]/admin", "page");
    return `Successfully deleted ${result.deletedCount} document.`;
  } catch (error) {
    console.error(error);
    return "An error occurred while deleting the document.";
  }
}
