import { NextResponse } from "next/server";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createMessage } from "@/lib/messageActions";

export const runtime = "nodejs";
import { isValidUserRole, mapToPrismaUserRole } from "@/lib/profileActions";

export async function POST(request: Request) {
  const user = await currentUser();
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

    await clerkClient.users.updateUser(user.id, updateData);

    const modelData: Record<string, unknown> = { username };
    if (img !== undefined) {
      modelData.img = img || null;
    }

    if (role === "student") {
      await prisma.student.update({ where: { id: user.id }, data: modelData });
    } else if (role === "teacher") {
      await prisma.teacher.update({ where: { id: user.id }, data: modelData });
    } else if (role === "parent") {
      await prisma.parent.update({ where: { id: user.id }, data: modelData });
    } else if (role === "admin") {
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

      await createMessage({
        senderId: user.id,
        senderRole: role,
        recipientId: "admin",
        recipientRole: "admin",
        text: `Password change request from ${user.username || user.fullName || "a user"}.`,
        type: "message",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}
