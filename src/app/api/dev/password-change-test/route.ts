import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createMessage, type UserRoleSlug } from "@/lib/messageActions";
import { mapToPrismaUserRole } from "@/lib/profileActions";

const validRoles = ["admin", "teacher", "parent", "student"] as const;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const devUserId = request.headers.get("x-dev-user-id");
  const devUserRole = request.headers.get("x-dev-user-role");

  if (!devUserId) {
    return NextResponse.json({ error: "Missing x-dev-user-id header" }, { status: 400 });
  }

  const payload = await request.json();
  const username = payload?.username?.toString()?.trim();
  const img = payload?.img?.toString()?.trim();
  const newPassword = payload?.newPassword?.toString()?.trim();
  const role = (validRoles.includes(devUserRole as any)
    ? devUserRole
    : "parent") as UserRoleSlug;

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  try {
    const modelData: Record<string, unknown> = { username };
    if (img !== undefined) modelData.img = img || null;

    if (role === "student") {
      const exists = await prisma.student.findUnique({ where: { id: devUserId } });
      if (!exists) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      await prisma.student.update({ where: { id: devUserId }, data: modelData });
    } else if (role === "teacher") {
      const exists = await prisma.teacher.findUnique({ where: { id: devUserId } });
      if (!exists) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      await prisma.teacher.update({ where: { id: devUserId }, data: modelData });
    } else if (role === "parent") {
      const exists = await prisma.parent.findUnique({ where: { id: devUserId } });
      if (!exists) return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
      await prisma.parent.update({ where: { id: devUserId }, data: modelData });
    } else if (role === "admin") {
      const exists = await prisma.admin.findUnique({ where: { id: devUserId } });
      if (!exists) return NextResponse.json({ error: "Admin profile not found" }, { status: 404 });
      await prisma.admin.update({ where: { id: devUserId }, data: { username } });
    }

    if (newPassword && role !== "admin") {
      const existingRequest = await prisma.passwordChangeRequest.findFirst({
        where: { requestedById: devUserId, status: "PENDING" },
      });

      if (existingRequest) {
        await prisma.passwordChangeRequest.update({
          where: { id: existingRequest.id },
          data: { newPassword, requestedAt: new Date() },
        });
      } else {
        await prisma.passwordChangeRequest.create({
          data: {
            requestedById: devUserId,
            requestedByRole: mapToPrismaUserRole(role),
            newPassword,
          },
        });
      }

      await createMessage({
        senderId: devUserId,
        senderRole: role,
        recipientId: "admin",
        recipientRole: "admin",
        text: `Password change request from dev user ${devUserId}.`,
        type: "message",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Profile record not found" }, { status: 404 });
    }
    if (error?.code === "P2002") {
      const meta = error.meta || {};
      const target = meta.target ? String(meta.target) : undefined;
      return NextResponse.json({ error: `Unique constraint failed${target ? `: ${target}` : ""}` }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}
