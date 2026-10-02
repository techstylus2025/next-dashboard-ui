import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.json();
  const identifier = (body.identifier || "").toString().trim();
  if (!identifier) return NextResponse.json({ ok: false }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { username: identifier }] } });
  if (!user) return NextResponse.json({ ok: true }); // don't reveal

  const token = crypto.randomBytes(24).toString("hex");
  const outDir = path.join(process.cwd(), "scripts", "migration-output");
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, "reset_tokens.json");
  let data: Record<string, string> = {};
  try {
    const content = await fs.readFile(file, "utf8");
    data = JSON.parse(content || "{}");
  } catch {}
  data[user.id] = token;
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");

  // In production, send email here. For now return ok and token for testing
  return NextResponse.json({ ok: true, token });
}
