import prisma from "@/lib/prisma";
import { PrismaClient, type GradingLevel } from "@prisma/client";
import { isRecoverablePrismaError } from "@/lib/prismaError";

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
  try {
    const existing = await db.grade.findMany({ select: { level: true } });
    const existingLevels = new Set(existing.map((row) => row.level));
    const missingLevels = DEFAULT_GRADING_LEVELS.filter((level) => !existingLevels.has(level));

    if (missingLevels.length > 0) {
      await db.grade.createMany({
        data: missingLevels.map((level) => ({ level })),
      });
    }
  } catch (error) {
    if (!isRecoverablePrismaError(error)) {
      throw error;
    }
  }
}

export async function loadGradingScaleEntries(): Promise<GradingEntryRow[]> {
  try {
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
  } catch (error) {
    if (!isRecoverablePrismaError(error)) {
      throw error;
    }
    return [];
  }
}

export async function loadGradingLevels(): Promise<GradingLevelRow[]> {
  await ensureDefaultGradingLevels();

  try {
    const rows = await db.grade.findMany({
      orderBy: { id: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      level: row.level,
      label: row.label ?? null,
    }));
  } catch (error) {
    if (!isRecoverablePrismaError(error)) {
      throw error;
    }
    return [];
  }
}

