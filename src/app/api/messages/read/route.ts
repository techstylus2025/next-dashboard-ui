import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { markMessageAsRead } from "@/lib/messageActions";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const { messageId } = payload;

  if (!messageId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await markMessageAsRead(messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
