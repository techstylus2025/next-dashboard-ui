export type TermCalendar = {
  termNumber: number;
  startDate: Date;
  endDate: Date;
};

export function getTermVacationAndReopening(
  terms: TermCalendar[],
  termNumber: number
): { vacationDate: Date; reopeningDate: Date | null } {
  const sorted = [...terms].sort((a, b) => a.termNumber - b.termNumber);
  const current = sorted.find((t) => t.termNumber === termNumber);
  if (!current) {
    throw new Error("TERM_NOT_FOUND");
  }
  const next = sorted.find((t) => t.termNumber === termNumber + 1);
  return {
    vacationDate: current.endDate,
    reopeningDate: next?.startDate ?? null,
  };
}
