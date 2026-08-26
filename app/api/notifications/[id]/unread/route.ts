import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { auth } from "@/auth";
import { ObjectId } from "mongodb";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const { id: notificationId } = await params;

    console.log("Unreading Notification ID:", notificationId);
    console.log("User ID:", userId);

    if (!ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { error: "Invalid notification ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("animerealms_v2");
    const notificationsCollection = db.collection("notifications");

    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $pull: { readBy: userId } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as unread:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as unread" },
      { status: 500 }
    );
  }
}
