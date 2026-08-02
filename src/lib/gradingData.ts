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

export type GradingLevelRow = {
  id: number;
  level: GradingLevel;
  label: string | null;
};

const DEFAULT_GRADING_LEVELS: GradingLevel[] = [
  "CRECHE",
  "NURSERY",
  "KINDERGARTEN",
  "PRIMARY",
  "JHS",
];

async function ensureDefaultGradingLevels() {
  const existing = await db.grade.findMany({ select: { level: true } });
  const existingLevels = new Set(existing.map((row) => row.level));
  const missingLevels = DEFAULT_GRADING_LEVELS.filter((level) => !existingLevels.has(level));

  if (missingLevels.length > 0) {
    await db.grade.createMany({
      data: missingLevels.map((level) => ({ level })),
    });
  }
}

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

export async function loadGradingLevels(): Promise<GradingLevelRow[]> {
  await ensureDefaultGradingLevels();

  const rows = await db.grade.findMany({
    orderBy: { id: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    level: row.level,
    label: row.label ?? null,
  }));
}
