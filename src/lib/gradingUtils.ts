import type { GradingLevel, GradingScaleEntry } from "@prisma/client";

export type GradeLookup = { grade: string; remark: string };

export function lookupGradeFromScale(
  level: GradingLevel,
  percentage: number,
  entries: GradingScaleEntry[]
): GradeLookup {
  const match = entries.find(
    (e) =>
      e.level === level &&
      percentage >= e.minScore &&
      percentage <= e.maxScore
  );
  if (match) {
    return { grade: match.grade, remark: match.remark };
  }
  return { grade: "—", remark: "" };
}

export function computeSubjectPercentage(
  classScore: number,
  examScore: number,
  maxPerComponent = 50
): number {
  const total = classScore + examScore;
  const maxTotal = maxPerComponent * 2;
  if (maxTotal <= 0) return 0;
  return Math.round((total / maxTotal) * 10000) / 100;
}

export const GRADING_LEVEL_LABELS: Record<GradingLevel, string> = {
  CRECHE: "Creche",
  KINDERGARTEN: "Kindergarten",
  PRIMARY: "Primary",
  JHS: "JHS",
};
