"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

const SETTINGS_PATH = "/list/settings";
const db = prisma as unknown as PrismaClient;

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  const role = (session?.sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { ok: false, error: "Only administrators can manage settings." };
  }
  return { ok: true };
}

export async function archiveParentRecords(
  parentId: string
): Promise<{
  success: boolean;
  error: string | null;
  summary?: string;
  counts?: { attendance: number; results: number; students: number };
}> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const summary = await db.$transaction(async (tx) => {
      const students = await tx.student.findMany({ where: { parentId }, select: { id: true } });
      const studentIds = students.map((s) => s.id);

      // mark parent as archived
      await tx.parent.update({ where: { id: parentId }, data: { isArchived: true, archivedAt: new Date() } });

      let attendanceCount = 0;
      let resultsCount = 0;

      if (studentIds.length > 0) {
        const attendance = await tx.attendance.updateMany({ where: { studentId: { in: studentIds }, isArchived: false }, data: { isArchived: true } });
        attendanceCount = attendance.count;

        const results = await tx.result.updateMany({ where: { studentId: { in: studentIds }, isArchived: false }, data: { isArchived: true } });
        resultsCount = results.count;

        await tx.termlyReport.updateMany({ where: { studentId: { in: studentIds } }, data: {} });

        // mark students as archived
        await tx.student.updateMany({ where: { id: { in: studentIds } }, data: { isArchived: true, archivedAt: new Date() } });
      }

      return {
        summary: `Archived for parent ${parentId}: ${attendanceCount} attendance, ${resultsCount} results for ${studentIds.length} student(s).`,
        counts: { attendance: attendanceCount, results: resultsCount, students: studentIds.length },
      };
    });

    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null, summary: (summary as any).summary, counts: (summary as any).counts };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not archive parent records." };
  }
}
