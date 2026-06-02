import prisma from "@/lib/prisma";
import { PrismaClient, type GradingLevel } from "@prisma/client";

const db = prisma as unknown as PrismaClient;

export type GradingEntryRow = {
  id: number;
  level: GradingLevel;
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
};

export async function loadGradingScaleEntries(): Promise<GradingEntryRow[]> {
  const rows = await db.gradingScaleEntry.findMany({
    orderBy: [{ level: "asc" }, { minScore: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    level: r.level,
    minScore: r.minScore,
    maxScore: r.maxScore,
    grade: r.grade,
    remark: r.remark,
  }));
}
