import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createMessage } from "@/lib/messageActions";

export const runtime = "nodejs";
import { isValidUserRole, mapToPrismaUserRole } from "@/lib/profileActions";

export async function POST(request: Request) {
  // Dev bypass: allow injecting a dummy user via headers for local testing
  const devUserId = request.headers.get("x-dev-user-id");
  const devUserRole = request.headers.get("x-dev-user-role") as string | null;
  const user = devUserId
    ? { id: devUserId, publicMetadata: { role: devUserRole ?? "parent" } }
    : await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const username = payload?.username?.toString()?.trim();
  const img = payload?.img?.toString()?.trim();
  const newPassword = payload?.newPassword?.toString()?.trim();
  const role = user.publicMetadata?.role as string | undefined;

  if (!username || !role || !isValidUserRole(role)) {
    return NextResponse.json({ error: "Invalid profile request" }, { status: 400 });
  }

  try {
    const updateData: Record<string, unknown> = { username };
    if (role === "admin" && newPassword) {
      Object.assign(updateData, { password: newPassword });
    }

    // In dev mode we may inject a dummy user via headers. Skip calling Clerk
    // when `x-dev-user-id` is present so tests don't require Clerk to be configured.
    const isDevBypass = Boolean(devUserId);
    if (!isDevBypass) {
      const client = await clerkClient();
      try {
        await client.users.updateUser(user.id, updateData);
      } catch (clerkErr: any) {
        console.error('Clerk updateUser error:', clerkErr);
        return NextResponse.json({ error: `Clerk error: ${clerkErr?.message ?? 'update failed'}` }, { status: 500 });
      }
    } else {
      console.log('Dev bypass: skipping Clerk user update for', user.id);
    }

    const modelData: Record<string, unknown> = { username };
    if (img !== undefined) {
      modelData.img = img || null;
    }

    // Ensure the corresponding DB record exists before updating
    if (role === "student") {
      const exists = await prisma.student.findUnique({ where: { id: user.id } });
      if (!exists) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      await prisma.student.update({ where: { id: user.id }, data: modelData });
    } else if (role === "teacher") {
      const exists = await prisma.teacher.findUnique({ where: { id: user.id } });
      if (!exists) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      await prisma.teacher.update({ where: { id: user.id }, data: modelData });
    } else if (role === "parent") {
      const exists = await prisma.parent.findUnique({ where: { id: user.id } });
      if (!exists) return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
      await prisma.parent.update({ where: { id: user.id }, data: modelData });
    } else if (role === "admin") {
      const exists = await prisma.admin.findUnique({ where: { id: user.id } });
      if (!exists) return NextResponse.json({ error: "Admin profile not found" }, { status: 404 });
      await prisma.admin.update({ where: { id: user.id }, data: { username } });
    }

    if (newPassword && role !== "admin") {
      const existingRequest = await prisma.passwordChangeRequest.findFirst({
        where: { requestedById: user.id, status: "PENDING" },
      });

      if (existingRequest) {
        await prisma.passwordChangeRequest.update({
          where: { id: existingRequest.id },
          data: { newPassword, requestedAt: new Date() },
        });
      } else {
        await prisma.passwordChangeRequest.create({
          data: {
            requestedById: user.id,
            requestedByRole: mapToPrismaUserRole(role),
            newPassword,
          },
        });
      }

      const displayName =
        typeof user === "object" && "username" in user
          ? user.username || ("fullName" in user ? user.fullName : "a user")
          : "a user";

      await createMessage({
        senderId: user.id,
        senderRole: role,
        recipientId: "admin",
        recipientRole: "admin",
        text: `Password change request from ${displayName}.`,
        type: "message",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    // Prisma record not found
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Profile record not found" }, { status: 404 });
    }
    // Unique constraint failed (username/email/phone)
    if (error?.code === "P2002") {
      const meta = error.meta || {};
      const target = meta.target ? String(meta.target) : undefined;
      return NextResponse.json({ error: `Unique constraint failed${target ? `: ${target}` : ""}` }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}
