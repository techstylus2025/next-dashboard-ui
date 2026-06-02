import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getUnreadMessageCount, type UserRoleSlug } from "@/lib/messageActions";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const role = user.publicMetadata.role as string | undefined;
  if (!role) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getUnreadMessageCount(user.id, role as UserRoleSlug);
  return NextResponse.json({ count });
}
