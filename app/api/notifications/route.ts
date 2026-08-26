import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { auth } from "@/auth";
import { Notification } from "@/lib/types";

export async function GET() {
  try {
    const session = await auth();
    const client = await clientPromise;
    const db = client.db("animerealms_v2");
    const notificationsCollection = db.collection<Notification>("notifications");

    const notifications = await notificationsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    if (session?.user?.id) {
      const userId = session.user.id as string;
      const notificationsWithReadStatus = notifications.map((notification) => ({
        ...notification,
        isRead: notification.readBy?.includes(userId) || false,
      }));
      return NextResponse.json(notificationsWithReadStatus);
    } else {
      const notificationsWithReadStatus = notifications.map((notification) => ({
        ...notification,
        isRead: false, // For guests, isRead is always false from the backend
      }));
      return NextResponse.json(notificationsWithReadStatus);
    }
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
