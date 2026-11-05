import type { GradingLevel, GradingScaleEntry } from "@prisma/client";

export type GradeLookup = { grade: string; remark: string };

export function lookupGradeFromScale(
  level: GradingLevel,
  percentage: number,
  entries: Pick<
    GradingScaleEntry,
    "level" | "minScore" | "maxScore" | "grade" | "remark"
  >[]
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
  maxPerComponent = 50,
  maxClassScore = maxPerComponent,
  maxExamScore = maxPerComponent
): number {
  const total = classScore + examScore;
  const maxTotal = maxClassScore + maxExamScore;
  if (maxTotal <= 0) return 0;
  return Math.round((total / maxTotal) * 10000) / 100;
}

export function computeJhsOverallGrade(
  subjectGrades: { grade: string | null; isCore: boolean }[]
): string | null {
  const coreGrades: number[] = [];
  const electiveGrades: number[] = [];

  for (const subject of subjectGrades) {
    const grade = subject.grade?.trim();
    if (!grade || !/^[1-9]$/.test(grade)) continue;
    (subject.isCore ? coreGrades : electiveGrades).push(Number(grade));
  }

  const bestElectiveGrades = electiveGrades
    .sort((a, b) => a - b)
    .slice(0, 2);
  const countedGrades = [...coreGrades, ...bestElectiveGrades];
  return countedGrades.length > 0
    ? String(countedGrades.reduce((sum, grade) => sum + grade, 0))
    : null;
}

export const GRADING_LEVEL_LABELS: Record<GradingLevel, string> = {
  CRECHE: "Creche",
  NURSERY: "Nursery",
  KINDERGARTEN: "Kindergarten",
  PRIMARY: "Primary",
  JHS: "JHS",
};
