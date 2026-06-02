import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId, sessionClaims } = auth();
    let role: string | null = null;

    // log for debugging role resolution
    // eslint-disable-next-line no-console
    console.debug("/api/me/role auth ->", { userId, sessionClaims });

    if (sessionClaims && (sessionClaims as any).metadata?.role) {
      role = (sessionClaims as any).metadata.role as string;
    }

    if (!role && userId) {
      const user = await clerkClient.users.getUser(userId);
      // eslint-disable-next-line no-console
      console.debug("/api/me/role clerk user.publicMetadata ->", user.publicMetadata);
      role = (user.publicMetadata as any)?.role || null;
    }

    return NextResponse.json({ role });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ role: null }, { status: 500 });
  }
}
