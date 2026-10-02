import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const token = (body.token || "").toString();
  const password = (body.password || "").toString();
  if (!token || !password) return NextResponse.json({ ok: false }, { status: 400 });

  const file = path.join(process.cwd(), "scripts", "migration-output", "reset_tokens.json");
  let data: Record<string, string> = {};
  try {
    const content = await fs.readFile(file, "utf8");
    data = JSON.parse(content || "{}");
  } catch {}

  const entries = Object.entries(data);
  const found = entries.find(([, t]) => t === token);
  if (!found) return NextResponse.json({ ok: false }, { status: 400 });
  const userId = found[0];

  const hashed = await hashPassword(password);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } as any });

  // remove token
  delete data[userId];
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");

  return NextResponse.json({ ok: true });
}
