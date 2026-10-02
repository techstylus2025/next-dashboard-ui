import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const bearerToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearerToken) {
      return NextResponse.json({ ok: false, error: "Clerk session token is missing." }, { status: 401 });
    }

    const client = await clerkClient();
    let authState;
    try {
      authState = await client.authenticateRequest(request, { acceptsToken: "session_token" });
    } catch (verificationError) {
      const clerkError = verificationError as {
        status?: number;
        errors?: Array<{ code?: string }>;
      };
      const status = clerkError.status;
      const code = clerkError.errors?.[0]?.code;
      console.warn("Clerk request authentication failed", { status, code });
      const details = [status && `HTTP ${status}`, code].filter(Boolean).join(", ");

      return NextResponse.json({
        ok: false,
        error: details
          ? `Clerk could not authenticate this session (${details}).`
          : "Clerk could not authenticate this session.",
      }, { status: 401 });
    }

    if (!authState.isAuthenticated) {
      console.warn("Clerk session is unauthenticated", {
        reason: authState.reason,
        message: authState.message,
      });
      const verificationMessage = authState.message?.replace(/\s+/g, " ").trim();
      return NextResponse.json({
        ok: false,
        error: verificationMessage
          ? `Clerk session could not be authenticated (${authState.reason}): ${verificationMessage}`
          : `Clerk session could not be authenticated (${authState.reason}).`,
      }, { status: 401 });
    }

    const userId = authState.toAuth().userId;
    const clerkUser = await client.users.getUser(userId);
    const username = clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || userId;
    const email = clerkUser.emailAddresses[0]?.emailAddress || null;
    const metadataRole = typeof clerkUser.publicMetadata.role === "string"
      ? clerkUser.publicMetadata.role.toUpperCase()
      : null;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    const role = metadataRole || existing?.role || "STUDENT";
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { username, email, role },
      create: { id: userId, username, email, password: null, role },
    });

    const token = await createSession(user.id, { userAgent: "clerk-login" });
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, role: user.role },
    });

    response.cookies.set("session_token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set("session_role", String(user.role).toLowerCase(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Failed to sync Clerk session:", error);
    return NextResponse.json({ ok: false, error: "Unable to sync your account." }, { status: 500 });
  }
}
