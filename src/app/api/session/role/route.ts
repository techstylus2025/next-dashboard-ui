import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAccessRestriction } from "@/lib/accessControl";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  const user = session?.user;
  const role = user?.role ? String(user.role).toLowerCase() : null;
  const restriction = user
    ? await getAccessRestriction({
        userId: user.id,
        username: user.username,
        email: user.email,
        role,
      })
    : null;
  const allowedUser = restriction ? null : user;

  return NextResponse.json({
    role: allowedUser ? role : null,
    userId: allowedUser ? session?.userId ?? null : null,
    sessionUser: allowedUser
      ? {
          id: allowedUser.id,
          username: allowedUser.username,
          email: allowedUser.email,
          role: String(allowedUser.role).toLowerCase(),
        }
      : null,
  });
}
