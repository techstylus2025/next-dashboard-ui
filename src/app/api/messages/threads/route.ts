import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  ADMIN_ID,
  getAdminMessageThreads,
  getAllParentsAndTeachers,
  getUserMessageThreads,
  type UserRoleSlug,
} from "@/lib/messageActions";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (user.publicMetadata?.role as UserRoleSlug | undefined) ?? "parent";
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.fullName ||
    user.username ||
    "User";
  const currentUserId = role === "admin" ? ADMIN_ID : user.id;

  const threads =
    role === "admin"
      ? await getAdminMessageThreads()
      : await getUserMessageThreads(currentUserId, role);

  const { parents, teachers } =
    role === "admin"
      ? await getAllParentsAndTeachers()
      : { parents: [], teachers: [] };

  return NextResponse.json({
    role,
    currentUserId,
    currentName: displayName,
    threads,
    allParents: parents,
    allTeachers: teachers,
  });
}
