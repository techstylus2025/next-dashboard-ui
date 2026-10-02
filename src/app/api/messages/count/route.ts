import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { getUnreadMessageCount, type UserRoleSlug } from "@/lib/messageActions";

export async function GET() {
  const { userId, role } = await getCurrentAuthContext();
  if (!userId || !role || !["admin", "teacher", "parent", "student"].includes(role)) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getUnreadMessageCount(userId, role as UserRoleSlug);
  return NextResponse.json({ count });
}
