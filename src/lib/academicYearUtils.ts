export function calculateTermDays(startDate: string, endDate: string, holidays: number): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day >= 1 && day <= 5) {
      workingDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return Math.max(0, workingDays - holidays);
}

export function calculateTermWeek(startDate: string, endDate: string, currentDate: Date): number | null {
  const parseIsoDay = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) return Number.NaN;

    const [, year, month, day] = match.map(Number);
    const timestamp = Date.UTC(year, month - 1, day);
    const parsed = new Date(timestamp);
    return parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
      ? timestamp
      : Number.NaN;
  };
  const toUtcDay = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOf = (timestamp: number) =>
    timestamp - ((new Date(timestamp).getUTCDay() + 6) % 7) * 86_400_000;

  const start = parseIsoDay(startDate);
  const end = parseIsoDay(endDate);
  const today = toUtcDay(currentDate);
  if (![start, end, today].every(Number.isFinite) || end < start) return null;

  const firstWeek = mondayOf(start);
  const totalWeeks = Math.floor((mondayOf(end) - firstWeek) / (7 * 86_400_000)) + 1;
  const currentWeek = Math.floor((mondayOf(today) - firstWeek) / (7 * 86_400_000)) + 1;
  return Math.min(totalWeeks, Math.max(1, currentWeek));
}
