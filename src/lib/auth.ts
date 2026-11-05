export const SESSION_COOKIE_NAME = "session_token";
export const DEFAULT_SESSION_DAYS = 7;

function createSessionToken() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createUserId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function hashPassword(password: string) {
  const argon2 = (await import("argon2")).default;
  return await argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  if (!hash) return false;

  try {
    const argon2 = (await import("argon2")).default;
    if (await argon2.verify(hash, password)) {
      return true;
    }
  } catch (err) {
    // Ignore invalid Argon2 hashes and fall through to legacy plain-text support.
  }

  return hash === password;
}

export async function createSession(userId: string, opts?: { expiresInDays?: number; ip?: string; userAgent?: string }) {
  const expiresInDays = opts?.expiresInDays ?? DEFAULT_SESSION_DAYS;
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const prisma = (await import("@/lib/prisma")).default;

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
      ip: opts?.ip || null,
      userAgent: opts?.userAgent || null,
    },
  });

  return token;
}

export async function getSessionByToken(token?: string | null) {
  if (!token) return null;
  const prisma = (await import("@/lib/prisma")).default;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    try {
      await prisma.session.delete({ where: { token } });
    } catch {}
    return null;
  }
  return session;
}

export function buildSessionCookie(token: string, opts?: { expiresInDays?: number }) {
  const expiresInDays = opts?.expiresInDays ?? DEFAULT_SESSION_DAYS;
  const maxAge = expiresInDays * 24 * 60 * 60;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export async function destroySession(token?: string | null) {
  if (!token) return;
  try {
    const prisma = (await import("@/lib/prisma")).default;
    await prisma.session.deleteMany({ where: { token } });
  } catch {}
}

export async function getSessionFromRequest(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const parts = cookie.split(";").map((s) => s.trim());
  const match = parts.find((p) => p.startsWith(SESSION_COOKIE_NAME + "="));
  if (!match) return null;
  const token = match.split("=")[1];
  if (!token) return null;
  return await getSessionByToken(token);
}

export async function getServerSession(options?: { skipAccessControl?: boolean }) {
  let tokenCookie: string | undefined;
  try {
    const headersModule = await import("next/headers");
    const cookies = (headersModule as any).cookies as (() => Promise<{ get: (name: string) => { value?: string } | undefined }>) | undefined;
    if (!cookies) return null;

    const store = await cookies();
    tokenCookie = store.get(SESSION_COOKIE_NAME)?.value;
  } catch (err) {
    return null;
  }

  if (!tokenCookie) return null;
  const session = await getSessionByToken(tokenCookie);
  if (!session?.user || options?.skipAccessControl) return session;

  const { getAccessRestriction } = await import("@/lib/accessControl");
  const restriction = await getAccessRestriction({
    userId: session.user.id,
    username: session.user.username,
    email: session.user.email,
    role: String(session.user.role),
  });
  return restriction ? null : session;
}

export async function getCurrentAuthContext(): Promise<{ userId: string | null; role: string | null }> {
  const session = await getServerSession();
  if (session?.user) {
    return {
      userId: session.user.id,
      role: String(session.user.role).toLowerCase(),
    };
  }

  let userId: string | null;
  let normalizedRole: string | null;
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const clerkSession = await auth();
    const role = (clerkSession.sessionClaims?.metadata as { role?: string } | undefined)?.role;
    userId = clerkSession.userId ?? null;
    normalizedRole = role ? role.toLowerCase() : null;
  } catch {
    return { userId: null, role: null };
  }

  const { getAccessRestriction } = await import("@/lib/accessControl");
  const restriction = await getAccessRestriction({ userId, role: normalizedRole });
  if (restriction) return { userId: null, role: null };
  return { userId, role: normalizedRole };
}

export async function createUserWithPassword(data: { id?: string; username?: string; email?: string; password: string; role: any }) {
  const prisma = (await import("@/lib/prisma")).default;
  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      id: data.id ?? createUserId(),
      username: data.username,
      email: data.email,
      password: hashed,
      role: data.role,
    },
  });
  return user;
}

export default {
  hashPassword,
  verifyPassword,
  createSession,
  getSessionByToken,
  getSessionFromRequest,
  buildSessionCookie,
  destroySession,
  createUserWithPassword,
};
