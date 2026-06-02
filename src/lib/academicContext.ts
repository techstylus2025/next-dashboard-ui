import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";

const db = prisma as unknown as PrismaClient;

export type AcademicPeriodBadge = {
  badge: string;
  yearLabel: string | null;
  termNumber: number | null;
  termStart: Date | null;
  termEnd: Date | null;
};

function formatYearShort(label: string): string {
  const match = label.match(/^(\d{4})\s*[-/]\s*(\d{2,4})$/);
  if (match) {
    const end =
      match[2].length === 2 ? match[2] : match[2].slice(-2);
    return `${match[1]}/${end}`;
  }
  return label;
}

function resolveCurrentTerm(
  terms: { termNumber: number; startDate: Date; endDate: Date }[],
  now: Date
) {
  const sorted = [...terms].sort((a, b) => a.termNumber - b.termNumber);

  const inRange = sorted.find(
    (t) => now >= t.startDate && now <= t.endDate
  );
  if (inRange) return inRange;

  const past = sorted.filter((t) => now > t.endDate);
  if (past.length > 0) return past[past.length - 1];

  return sorted[0] ?? null;
}

export const getActiveAcademicPeriod = cache(
  async (): Promise<AcademicPeriodBadge> => {
    const year = await db.academicYear.findFirst({
      where: { isActive: true, isArchived: false },
      include: { terms: true },
    });

    if (!year || year.terms.length === 0) {
      return {
        badge: "Set active year",
        yearLabel: null,
        termNumber: null,
        termStart: null,
        termEnd: null,
      };
    }

    const now = new Date();
    const term = resolveCurrentTerm(year.terms, now);

    if (!term) {
      return {
        badge: formatYearShort(year.label),
        yearLabel: year.label,
        termNumber: null,
        termStart: null,
        termEnd: null,
      };
    }

    const shortYear = formatYearShort(year.label);
    return {
      badge: `${shortYear} · Term ${term.termNumber}`,
      yearLabel: year.label,
      termNumber: term.termNumber,
      termStart: term.startDate,
      termEnd: term.endDate,
    };
  }
);
