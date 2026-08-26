import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    const client = await clientPromise;
    const db = client.db("animerealms_v2");
    const notificationsCollection = db.collection("notifications");

    const result = await notificationsCollection.updateMany(
      {
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );

    console.log(`Marked ${result.modifiedCount} notifications as read.`);

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
