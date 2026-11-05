import { NextResponse } from "next/server";
import { getCurrentAuthContext, getSessionFromRequest, destroySession } from "@/lib/auth";
import { createActivityLog } from "@/lib/activityLog";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  const auth = await getCurrentAuthContext();
  const userId = session?.userId ?? auth.userId;
  const role = session?.user?.role ?? auth.role;
  if (userId && role) {
    const user = session?.user ?? await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    await createActivityLog({
      userId,
      username: user?.username,
      role,
      action: "LOGOUT",
    });
  }
  if (session) {
    await destroySession(session.token);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session_token", "deleted", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  res.cookies.set("session_role", "deleted", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
