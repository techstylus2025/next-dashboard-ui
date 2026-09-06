"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { GradingLevel } from "@prisma/client";
import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

const SETTINGS_PATH = "/list/settings";
const db = prisma as unknown as PrismaClient;

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  let role = (session?.sessionClaims?.metadata as { role?: string })?.role ?? null;

  if (!role && session?.userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(session.userId);
      role = (user?.publicMetadata as { role?: string })?.role ?? null;
    } catch (e) {
      console.warn("requireAdmin: failed to read Clerk user metadata", e);
    }
  }

  if (role !== "admin") {
    return { ok: false, error: "Only administrators can manage grading scales." };
  }
  return { ok: true };
}

export async function createGradingLevel(input: {
  level: GradingLevel;
  label?: string;
}): Promise<{ success: boolean; error: string | null; id?: number }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const normalizedLabel = input.label?.trim();

  try {
    const existing = await db.grade.findUnique({ where: { level: input.level } });
    if (existing) {
      return { success: false, error: "This grading level already exists." };
    }

    const row = await db.grade.create({
      data: {
        level: input.level,
        label: normalizedLabel || null,
      },
    });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null, id: row.id };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not save grading level." };
  }
}

export async function updateGradingLevel(input: {
  id: number;
  label: string;
}): Promise<{ success: boolean; error: string | null }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    await db.grade.update({
      where: { id: input.id },
      data: { label: input.label.trim() || null },
    });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not update grading level." };
  }
}

export async function deleteGradingLevel(id: number): Promise<{ success: boolean; error: string | null }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const linkedClasses = await db.class.findFirst({ where: { gradeId: id } });
    if (linkedClasses) {
      return { success: false, error: "This grading level is currently in use by classes." };
    }

    await db.grade.delete({ where: { id } });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not delete grading level." };
  }
}

export async function createGradingScaleEntry(input: {
  level: GradingLevel;
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
}): Promise<{ success: boolean; error: string | null; id?: number }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  if (input.minScore < 0 || input.maxScore > 100 || input.minScore > input.maxScore) {
    return { success: false, error: "Invalid score range (use 0–100)." };
  }
  const grade = input.grade.trim();
  if (!grade) return { success: false, error: "Grade is required." };

  try {
    const row = await db.gradingScaleEntry.create({
      data: {
        level: input.level,
        minScore: input.minScore,
        maxScore: input.maxScore,
        grade,
        remark: input.remark.trim(),
      },
    });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null, id: row.id };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not save grading entry." };
  }
}

export async function updateGradingScaleEntry(input: {
  id: number;
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
}): Promise<{ success: boolean; error: string | null }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  if (input.minScore < 0 || input.maxScore > 100 || input.minScore > input.maxScore) {
    return { success: false, error: "Invalid score range (use 0–100)." };
  }

  try {
    await db.gradingScaleEntry.update({
      where: { id: input.id },
      data: {
        minScore: input.minScore,
        maxScore: input.maxScore,
        grade: input.grade.trim(),
        remark: input.remark.trim(),
      },
    });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not update grading entry." };
  }
}

export async function deleteGradingScaleEntry(
  id: number
): Promise<{ success: boolean; error: string | null }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    await db.gradingScaleEntry.delete({ where: { id } });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not delete grading entry." };
  }
}
