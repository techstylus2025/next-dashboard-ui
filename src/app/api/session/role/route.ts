import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  const user = session?.user;
  const role = user?.role ? String(user.role).toLowerCase() : null;

  return NextResponse.json({
    role,
    userId: session?.userId ?? null,
    sessionUser: user
      ? {
          id: user.id,
          username: user.username,
          email: user.email,
          role: String(user.role).toLowerCase(),
        }
      : null,
  });
}
