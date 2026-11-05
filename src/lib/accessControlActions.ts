"use server";

import { getCurrentAuthContext } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

const ACCESS_CONTROL_PATH = "/admin/access-control";
const MANAGEABLE_ROLES = ["teacher", "student", "parent"] as const;
type ManageableRole = (typeof MANAGEABLE_ROLES)[number];

async function requireAdmin() {
  const auth = await getCurrentAuthContext();
  return auth.userId && auth.role === "admin";
}

export async function setMaintenanceMode(enabled: boolean) {
  if (!(await requireAdmin())) {
    return { success: false, error: "Only administrators can change access settings." };
  }
  if (typeof enabled !== "boolean") {
    return { success: false, error: "Choose a valid maintenance mode setting." };
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO "AppAccessSettings" ("id", "maintenanceMode", "updatedAt")
      VALUES (1, ${enabled}, CURRENT_TIMESTAMP)
      ON CONFLICT ("id")
      DO UPDATE SET "maintenanceMode" = EXCLUDED."maintenanceMode",
                    "updatedAt" = CURRENT_TIMESTAMP
    `;
    revalidatePath(ACCESS_CONTROL_PATH);
    return { success: true, error: null };
  } catch (error) {
    console.error("Failed to update maintenance mode:", error);
    return { success: false, error: "Could not update maintenance mode." };
  }
}

export async function setRoleAccessDenied(roleInput: string, denied: boolean) {
  if (!(await requireAdmin())) {
    return { success: false, error: "Only administrators can change access settings." };
  }
  const role = roleInput.toLowerCase();
  if (!MANAGEABLE_ROLES.includes(role as ManageableRole) || typeof denied !== "boolean") {
    return { success: false, error: "Choose a valid user role." };
  }

  try {
    if (denied) {
      await prisma.$executeRaw`
        INSERT INTO "AccessDeniedRole" ("role")
        VALUES (${role})
        ON CONFLICT ("role") DO NOTHING
      `;
    } else {
      await prisma.$executeRaw`DELETE FROM "AccessDeniedRole" WHERE "role" = ${role}`;
    }
    revalidatePath(ACCESS_CONTROL_PATH);
    return { success: true, error: null };
  } catch (error) {
    console.error("Failed to update role access:", error);
    return { success: false, error: "Could not update role access." };
  }
}

export async function addDeniedUser(identifierInput: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: "Only administrators can change access settings." };
  }
  const identifier = identifierInput.trim().toLowerCase();
  if (
    identifier.length < 2 ||
    identifier.length > 254 ||
    !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$|^[a-z0-9][a-z0-9._-]*$/i.test(identifier)
  ) {
    return { success: false, error: "Enter a valid username or email address." };
  }

  try {
    const existingUsers = await prisma.$queryRaw<Array<{ role: string }>>`
      SELECT "role"
      FROM "User"
      WHERE lower("username") = ${identifier}
         OR lower("email") = ${identifier}
      LIMIT 1
    `;
    if (existingUsers[0]?.role.toLowerCase() === "admin") {
      return { success: false, error: "Administrator accounts cannot be blocked here." };
    }
    const inserted = await prisma.$executeRaw`
      INSERT INTO "AccessDeniedUser" ("id", "identifier", "createdAt")
      VALUES (${randomUUID()}, ${identifier}, CURRENT_TIMESTAMP)
      ON CONFLICT ("identifier") DO NOTHING
    `;
    if (inserted === 0) {
      return { success: false, error: "That user is already on the blocked list." };
    }
  } catch (error) {
    console.error("Failed to block user:", error);
    return { success: false, error: "Could not block this user." };
  }
  revalidatePath(ACCESS_CONTROL_PATH);
  return { success: true, error: null };
}

export async function removeDeniedUser(id: string) {
  if (!(await requireAdmin())) {
    return { success: false, error: "Only administrators can change access settings." };
  }
  if (!id.trim()) return { success: false, error: "Choose a user to unblock." };

  try {
    const removed = await prisma.$executeRaw`
      DELETE FROM "AccessDeniedUser"
      WHERE "id" = ${id}
    `;
    if (removed === 0) {
      return { success: false, error: "This blocked-user entry no longer exists." };
    }
    revalidatePath(ACCESS_CONTROL_PATH);
    return { success: true, error: null };
  } catch (error) {
    console.error("Failed to restore user access:", error);
    return { success: false, error: "Could not restore user access." };
  }
}
