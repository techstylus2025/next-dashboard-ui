import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { buildRoleTransition, normalizePasswordManagerRole } from "@/lib/passwordManagerRole";

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

    const normalizedOriginalRole = normalizePasswordManagerRole(originalRole);
    const normalizedRole = normalizePasswordManagerRole(role);

    if (!id || !normalizedOriginalRole || !normalizedRole || !username) {
      return NextResponse.json({ error: "Missing required credentials." }, { status: 400 });
    }

    if (username.length === 0) {
      return NextResponse.json({ error: "Username cannot be empty." }, { status: 400 });
    }

    let clerkUserId = id;

    const client = await clerkClient();

    const findClerkUserId = async (fallbackUsername: string) => {
      const getUserList = (client.users as any).getUserList;
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
      return client.users.updateUser(clerkId, {
        username,
        ...(password ? { password } : {}),
        publicMetadata: { role: normalizedRole },
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
            if (normalizedOriginalRole !== "admin") {
              return NextResponse.json({ error: "Unable to update authentication credentials." }, { status: 500 });
            }
          }
        } else if (normalizedOriginalRole !== "admin") {
          console.error("Clerk fallback user not found or ambiguous", { username, errorMessage });
          return NextResponse.json({ error: "Unable to update authentication credentials." }, { status: 500 });
        }
      } else {
        console.error("Clerk update failed", error);
        if (normalizedOriginalRole !== "admin") {
          return NextResponse.json({ error: "Unable to update authentication credentials." }, { status: 500 });
        }
      }
    }

    let currentRecord: Record<string, any> | null = null;

    switch (normalizedOriginalRole) {
      case "admin":
        currentRecord = await prisma.admin.findUnique({ where: { id } });
        break;
      case "teacher":
        currentRecord = await prisma.teacher.findUnique({ where: { id } });
        break;
      case "parent":
        currentRecord = await prisma.parent.findUnique({ where: { id } });
        break;
      case "student":
        currentRecord = await prisma.student.findUnique({ where: { id } });
        break;
    }

    const transition = buildRoleTransition(normalizedOriginalRole, normalizedRole, currentRecord);

    if (transition.shouldMigrate) {
      await prisma.$transaction(async (tx) => {
        let existingNewRecord: Record<string, any> | null = null;

        switch (normalizedRole) {
          case "admin":
            existingNewRecord = await tx.admin.findUnique({ where: { id } });
            if (existingNewRecord) {
              await tx.admin.update({ where: { id }, data: { ...(transition.createPayload ?? {}), username } as any });
            } else {
              await tx.admin.create({ data: { ...(transition.createPayload ?? {}), username } as any });
            }
            break;
          case "teacher":
            existingNewRecord = await tx.teacher.findUnique({ where: { id } });
            if (existingNewRecord) {
              await tx.teacher.update({ where: { id }, data: { ...(transition.createPayload ?? {}), username } as any });
            } else {
              await tx.teacher.create({ data: { ...(transition.createPayload ?? {}), username } as any });
            }
            break;
          case "parent":
            existingNewRecord = await tx.parent.findUnique({ where: { id } });
            if (existingNewRecord) {
              await tx.parent.update({ where: { id }, data: { ...(transition.createPayload ?? {}), username } as any });
            } else {
              await tx.parent.create({ data: { ...(transition.createPayload ?? {}), username } as any });
            }
            break;
          case "student":
            existingNewRecord = await tx.student.findUnique({ where: { id } });
            if (existingNewRecord) {
              await tx.student.update({ where: { id }, data: { ...(transition.createPayload ?? {}), username } as any });
            } else {
              await tx.student.create({ data: { ...(transition.createPayload ?? {}), username } as any });
            }
            break;
        }

        switch (normalizedOriginalRole) {
          case "admin":
            await tx.admin.delete({ where: { id } }).catch(() => undefined);
            break;
          case "teacher":
            await tx.teacher.delete({ where: { id } }).catch(() => undefined);
            break;
          case "parent":
            await tx.parent.delete({ where: { id } }).catch(() => undefined);
            break;
          case "student":
            await tx.student.delete({ where: { id } }).catch(() => undefined);
            break;
        }
      });
    } else {
      switch (normalizedRole) {
        case "admin":
          await prisma.admin.update({ where: { id }, data: { username } }).catch(async () => {
            const existing = await prisma.admin.findUnique({ where: { id } });
            if (!existing) {
              await prisma.admin.create({ data: { id, username } as any });
            }
          });
          break;
        case "teacher":
          await prisma.teacher.update({ where: { id }, data: { username } }).catch(async () => {
            const existing = await prisma.teacher.findUnique({ where: { id } });
            if (!existing) {
              await prisma.teacher.create({ data: { id, username } as any });
            }
          });
          break;
        case "parent":
          await prisma.parent.update({ where: { id }, data: { username } }).catch(async () => {
            const existing = await prisma.parent.findUnique({ where: { id } });
            if (!existing) {
              await prisma.parent.create({ data: { id, username } as any });
            }
          });
          break;
        case "student":
          await prisma.student.update({ where: { id }, data: { username } }).catch(async () => {
            const existing = await prisma.student.findUnique({ where: { id } });
            if (!existing) {
              await prisma.student.create({ data: { id, username } as any });
            }
          });
          break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save password manager updates." }, { status: 500 });
  }
}
