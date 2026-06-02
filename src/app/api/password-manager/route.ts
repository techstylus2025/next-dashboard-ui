import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : undefined;
    let originalRole = typeof body.originalRole === "string" ? body.originalRole : undefined;
    let role = typeof body.role === "string" ? body.role : undefined;
    let username = typeof body.username === "string" ? body.username.trim() : undefined;
    const password = typeof body.password === "string" ? body.password.trim() : undefined;

    if (!originalRole || !role || !username) {
      const adminUser = await prisma.admin.findUnique({ where: { id }, select: { username: true } });
      const teacherUser = await prisma.teacher.findUnique({ where: { id }, select: { username: true } });
      const parentUser = await prisma.parent.findUnique({ where: { id }, select: { username: true } });
      const studentUser = await prisma.student.findUnique({ where: { id }, select: { username: true } });

      if (adminUser) {
        originalRole = originalRole || "admin";
        role = role || "admin";
        username = username || adminUser.username;
      } else if (teacherUser) {
        originalRole = originalRole || "teacher";
        role = role || "teacher";
        username = username || teacherUser.username;
      } else if (parentUser) {
        originalRole = originalRole || "parent";
        role = role || "parent";
        username = username || parentUser.username;
      } else if (studentUser) {
        originalRole = originalRole || "student";
        role = role || "student";
        username = username || studentUser.username;
      }
    }

    if (!id || !originalRole || !role || !username) {
      return NextResponse.json({ error: "Missing required credentials." }, { status: 400 });
    }

    if (username.length === 0) {
      return NextResponse.json({ error: "Username cannot be empty." }, { status: 400 });
    }

    // Update Clerk username/password and keep user role metadata up to date.
    let clerkUserId = id;

    const findClerkUserId = async (fallbackUsername: string) => {
      const getUserList = (clerkClient.users as any).getUserList;
      const listArgs = [];
      if (typeof getUserList === "function") {
        try {
          const byUsername = await getUserList({ username: [fallbackUsername] });
          if (byUsername?.length === 1) {
            return byUsername[0].id;
          }
        } catch (err) {
          console.warn("Clerk username lookup failed", err);
        }

        try {
          const byEmail = await getUserList({ emailAddress: [fallbackUsername] });
          if (byEmail?.length === 1) {
            return byEmail[0].id;
          }
        } catch (err) {
          console.warn("Clerk email lookup failed", err);
        }
      }
      return undefined;
    };

    const updateClerk = async (clerkId: string) => {
      return clerkClient.users.updateUser(clerkId, {
        username,
        ...(password ? { password } : {}),
        publicMetadata: { role },
      });
    };

    try {
      await updateClerk(clerkUserId);
    } catch (error) {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as any).message
          : String(error);
      const didNotExist = /not found|no user|user does not exist/i.test(errorMessage);

      if (didNotExist && username) {
        const fallbackId = await findClerkUserId(username);
        if (fallbackId) {
          try {
            clerkUserId = fallbackId;
            await updateClerk(clerkUserId);
          } catch (innerError) {
            console.error("Clerk fallback update failed", innerError);
            if (originalRole !== "admin") {
              return NextResponse.json({ error: "Unable to update authentication credentials." }, { status: 500 });
            }
          }
        } else if (originalRole !== "admin") {
          console.error("Clerk fallback user not found or ambiguous", { username, errorMessage });
          return NextResponse.json({ error: "Unable to update authentication credentials." }, { status: 500 });
        }
      } else {
        console.error("Clerk update failed", error);
        if (originalRole !== "admin") {
          return NextResponse.json({ error: "Unable to update authentication credentials." }, { status: 500 });
        }
      }
    }

    switch (originalRole) {
      case "teacher":
        await prisma.teacher.update({ where: { id }, data: { username } });
        break;
      case "student":
        await prisma.student.update({ where: { id }, data: { username } });
        break;
      case "parent":
        await prisma.parent.update({ where: { id }, data: { username } });
        break;
      case "admin":
        await prisma.admin.update({ where: { id }, data: { username } });
        break;
      default:
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save password manager updates." }, { status: 500 });
  }
}
