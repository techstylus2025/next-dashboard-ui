import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session || !session.user) {
    return NextResponse.json({ ok: false, user: null }, { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
    },
  });
}
