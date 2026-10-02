import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import {
  ADMIN_ID,
  getAdminMessageThreads,
  getAllConversationUsers,
  getMessageUserName,
  getUserMessageThreads,
  type UserRoleSlug,
} from "@/lib/messageActions";

export async function GET() {
  const { userId, role: currentRole } = await getCurrentAuthContext();
  const roles: UserRoleSlug[] = ["admin", "teacher", "parent", "student"];
  if (!userId || !currentRole || !roles.includes(currentRole as UserRoleSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = currentRole as UserRoleSlug;
  const currentUserId = role === "admin" ? ADMIN_ID : userId;
  const displayName = await getMessageUserName(userId, role);

  const threads =
    role === "admin"
      ? await getAdminMessageThreads()
      : await getUserMessageThreads(currentUserId, role);

  const contacts =
    role === "admin"
      ? await getAllConversationUsers()
      : [];

  return NextResponse.json({
    role,
    currentUserId,
    currentName: displayName,
    threads,
    contacts,
  });
}
