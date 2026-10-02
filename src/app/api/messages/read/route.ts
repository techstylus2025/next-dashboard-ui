import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { markMessageAsRead, type UserRoleSlug } from "@/lib/messageActions";

const isRole = (role: string | null): role is UserRoleSlug =>
  role === "admin" || role === "teacher" || role === "parent" || role === "student";

export async function POST(request: Request) {
  const { userId, role } = await getCurrentAuthContext();
  if (!userId || !isRole(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const { messageId } = payload;

  if (!messageId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const marked = await markMessageAsRead(Number(messageId), userId, role);
    return marked
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Message not found." }, { status: 404 });
  } catch (error) {
    console.error("Failed to mark message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
