import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { ADMIN_ID, createMessage } from "@/lib/messageActions";

const validateRole = (role: string): boolean =>
  role === "admin" || role === "teacher" || role === "parent" || role === "student";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const { senderId, senderRole, recipientId, recipientRole, text, type } = payload;

  if (
    !senderId ||
    !recipientId ||
    !senderRole ||
    !recipientRole ||
    !text ||
    !validateRole(senderRole) ||
    !validateRole(recipientRole)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const currentRole = user?.publicMetadata?.role as string;
  if (currentRole === "admin") {
    if (senderId !== ADMIN_ID || senderRole !== "admin") {
      return NextResponse.json({ error: "Invalid admin sender" }, { status: 403 });
    }
  } else {
    if (senderId !== user.id || senderRole !== currentRole) {
      return NextResponse.json({ error: "Invalid sender" }, { status: 403 });
    }
  }

  const message = await createMessage({
    senderId,
    senderRole,
    recipientId,
    recipientRole,
    text,
    type,
  });

  return NextResponse.json(message);
}
