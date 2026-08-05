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
