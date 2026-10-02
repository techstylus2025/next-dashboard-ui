import { NextResponse } from "next/server";
import { getSessionFromRequest, destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
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
