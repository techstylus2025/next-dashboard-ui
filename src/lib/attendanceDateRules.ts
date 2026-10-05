import { getNationalEvents, resolveCountryFromLocation } from "@/lib/nationalEvents";
import prisma from "@/lib/prisma";

export async function getAttendanceDateRestriction(dateValue: string): Promise<string | null> {
  const dateKey = dateValue.slice(0, 10);
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return "Choose a valid attendance date.";

  const weekday = date.getUTCDay();
  if (weekday === 6) return "Attendance cannot be marked on Saturdays.";
  if (weekday === 0) return "Attendance cannot be marked on Sundays.";

  const schoolSettings = await prisma.schoolSetting.findFirst({ select: { location: true } });
  const countryCode = resolveCountryFromLocation(schoolSettings?.location);
  const nationalPublicHoliday = getNationalEvents(date.getUTCFullYear(), date.getUTCFullYear(), countryCode)
    .find((event) => event.date === dateKey && /public holiday/i.test(event.description));
  if (nationalPublicHoliday) {
    return `${nationalPublicHoliday.title} is a public holiday. Attendance cannot be marked.`;
  }

  const dayEnd = new Date(date);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  const calendarEvents = await prisma.event.findMany({
    where: {
      isArchived: false,
      startTime: { lt: dayEnd },
      endTime: { gte: date },
      OR: [
        { title: { contains: "midterm", mode: "insensitive" } },
        { title: { contains: "mid-term", mode: "insensitive" } },
        { title: { contains: "mid term", mode: "insensitive" } },
        { title: { contains: "holiday", mode: "insensitive" } },
        { description: { contains: "midterm", mode: "insensitive" } },
        { description: { contains: "mid-term", mode: "insensitive" } },
        { description: { contains: "mid term", mode: "insensitive" } },
        { description: { contains: "holiday", mode: "insensitive" } },
      ],
    },
    select: { title: true, description: true },
  });

  const midterm = calendarEvents.find((event) => /mid[\s-]?term/i.test(`${event.title} ${event.description}`));
  if (midterm) return `${midterm.title} is marked on the school calendar. Attendance cannot be marked.`;

  const holiday = calendarEvents.find((event) => /holiday/i.test(`${event.title} ${event.description}`));
  if (holiday) return `${holiday.title} is marked on the school calendar. Attendance cannot be marked.`;

  return null;
}