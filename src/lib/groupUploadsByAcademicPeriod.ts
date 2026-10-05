export type AcademicPeriodRecord = {
  academicYearLabel: string;
  termNumber: number;
};

export type AcademicPeriodGroup<T> = {
  academicYearLabel: string;
  terms: { termNumber: number; records: T[] }[];
};

export function groupUploadsByAcademicPeriod<T extends AcademicPeriodRecord>(
  records: T[]
): AcademicPeriodGroup<T>[] {
  const years = new Map<string, Map<number, T[]>>();

  for (const record of records) {
    const terms = years.get(record.academicYearLabel) ?? new Map<number, T[]>();
    const termRecords = terms.get(record.termNumber) ?? [];
    termRecords.push(record);
    terms.set(record.termNumber, termRecords);
    years.set(record.academicYearLabel, terms);
  }

  return Array.from(years.entries())
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA, undefined, { numeric: true }))
    .map(([academicYearLabel, terms]) => ({
      academicYearLabel,
      terms: Array.from(terms.entries())
        .sort(([termA], [termB]) => termA - termB)
        .map(([termNumber, groupedRecords]) => ({ termNumber, records: groupedRecords })),
    }));
}