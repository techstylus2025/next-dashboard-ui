import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { ADMIN_ID, createMessage, findNonAdminUser, type ClientMessageType, type UserRoleSlug } from "@/lib/messageActions";

const isRole = (role: unknown): role is UserRoleSlug =>
  role === "admin" || role === "teacher" || role === "parent" || role === "student";

export async function POST(request: Request) {
  const { userId, role } = await getCurrentAuthContext();
  if (!userId || !isRole(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const { recipientId, recipientRole, text, type } = payload ?? {};

  if (
    typeof recipientId !== "string" ||
    !recipientId.trim() ||
    !isRole(recipientRole) ||
    typeof text !== "string" ||
    !text.trim() ||
    text.length > 10000 ||
    (type !== undefined && type !== "message" && type !== "complaint")
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (role === "admin") {
    if (recipientRole === "admin" || !(await findNonAdminUser(recipientId, recipientRole))) {
      return NextResponse.json({ error: "Choose a valid non-admin recipient." }, { status: 400 });
    }
  } else if (recipientId !== ADMIN_ID || recipientRole !== "admin") {
    return NextResponse.json({ error: "Conversations can only be with the school administrator." }, { status: 403 });
  }

  if (type === "complaint" && role !== "parent") {
    return NextResponse.json({ error: "Only parents can submit complaints." }, { status: 403 });
  }

  try {
    const message = await createMessage({
      senderId: role === "admin" ? ADMIN_ID : userId,
      senderRole: role,
      recipientId,
      recipientRole,
      text: text.trim(),
      type: (type as ClientMessageType | undefined) ?? "message",
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Failed to create admin-user message:", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 400 });
  }

}
