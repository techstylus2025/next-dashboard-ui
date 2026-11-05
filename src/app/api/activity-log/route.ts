import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { createActivityLog } from "@/lib/activityLog";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId, role } = await getCurrentAuthContext();
  if (!userId || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const path =
    typeof body === "object" && body !== null && "path" in body
      ? body.path
      : null;
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/api") ||
    path.length > 200
  ) {
    return NextResponse.json({ error: "Invalid activity path" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  await createActivityLog({
    userId,
    username: user?.username,
    role,
    action: "PAGE_VIEW",
    path,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
