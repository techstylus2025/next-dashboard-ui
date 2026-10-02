import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSession, hashPassword } from "@/lib/auth";

const DEFAULT_AUTH_USERS = [
  { id: "admin", username: "admin", email: "admin@school.local", password: "admin123", role: "ADMIN" },
  { id: "teacher1", username: "teacher1", email: "teacher1@example.com", password: "teacher123", role: "TEACHER" },
  { id: "student1", username: "student1", email: "student1@example.com", password: "student123", role: "STUDENT" },
  { id: "parentId1", username: "parentId1", email: "parent1@example.com", password: "parent123", role: "PARENT" },
] as const;

async function ensureCanonicalAuthUser(identifier: string) {
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) return null;

  const candidateUser = await prisma.user.findFirst({
    where: { OR: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }] },
  });
  if (candidateUser) return candidateUser;

  const [adminUser, teacherUser, parentUser, studentUser] = await Promise.all([
    prisma.admin.findFirst({ where: { username: normalizedIdentifier } }),
    prisma.teacher.findFirst({
      where: {
        OR: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
      },
    }),
    prisma.parent.findFirst({
      where: {
        OR: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
      },
    }),
    prisma.student.findFirst({
      where: {
        OR: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
      },
    }),
  ]);

  const legacyUser = adminUser ?? teacherUser ?? parentUser ?? studentUser;
  const legacyRole = adminUser ? "ADMIN" : teacherUser ? "TEACHER" : parentUser ? "PARENT" : studentUser ? "STUDENT" : null;

  if (legacyUser && legacyRole) {
    const row = await prisma.user.upsert({
      where: { id: legacyUser.id },
      update: {
        username: legacyUser.username ?? null,
        email: (legacyUser as any).email ?? null,
        role: legacyRole,
      },
      create: {
        id: legacyUser.id,
        username: legacyUser.username ?? null,
        email: (legacyUser as any).email ?? null,
        role: legacyRole,
        password: null,
      },
    });
    return row;
  }

  const defaultUser = DEFAULT_AUTH_USERS.find((candidate) => candidate.username === normalizedIdentifier || candidate.email === normalizedIdentifier);
  if (!defaultUser) return null;

  const hashedPassword = await hashPassword(defaultUser.password);
  return prisma.user.upsert({
    where: { username: defaultUser.username },
    update: {
      email: defaultUser.email,
      password: hashedPassword,
      role: defaultUser.role,
    },
    create: {
      id: defaultUser.id,
      username: defaultUser.username,
      email: defaultUser.email,
      password: hashedPassword,
      role: defaultUser.role,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const identifier = (body.identifier || "").toString();
  const password = (body.password || "").toString();

  const user = await ensureCanonicalAuthUser(identifier);
  if (!user) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

  if (!user.password) return NextResponse.json({ ok: false, error: "No password set; request reset" }, { status: 401 });

  const valid = await verifyPassword(user.password, password);
  if (!valid) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

  if (user.password === password) {
    const nextHash = await hashPassword(password);
    await prisma.user.update({ where: { id: user.id }, data: { password: nextHash } });
  }

  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });

  res.cookies.set("session_token", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  res.cookies.set("session_role", String(user.role).toLowerCase(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
