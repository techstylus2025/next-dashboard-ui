import prisma from "@/lib/prisma";
import {
  getNationalEvents,
  groupCalendarEventsByDate,
  nationalEventsToCalendarEntries,
  resolveCountryFromLocation,
  type CalendarEventEntry,
} from "@/lib/nationalEvents";
import { NextResponse } from "next/server";

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET() {
  try {
    const [schoolEvents, schoolSettings] = await Promise.all([
      prisma.event.findMany({
        where: { isArchived: false },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
        },
      }),
      prisma.schoolSetting.findFirst({ select: { location: true } }),
    ]);

    const countryCode = resolveCountryFromLocation(schoolSettings?.location);
    const currentYear = new Date().getFullYear();
    const nationalEvents = getNationalEvents(
      currentYear - 1,
      currentYear + 2,
      countryCode
    );

    const schoolEntries: CalendarEventEntry[] = schoolEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      type: "school",
    }));

    const allEntries = [
      ...nationalEventsToCalendarEntries(nationalEvents),
      ...schoolEntries,
    ];

    const events = groupCalendarEventsByDate(
      allEntries.map((entry) => {
        if (entry.type !== "school") return entry;
        const start = new Date(entry.startTime);
        const end = new Date(entry.endTime);
        const dateKey = localDateKey(start);
        return {
          ...entry,
          startTime: `${dateKey}T${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:00.000`,
          endTime: `${dateKey}T${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}:00.000`,
        };
      })
    );
    const dates = Object.keys(events);

    const schoolDates = new Set<string>();
    const nationalDates = new Set<string>();

    for (const [dateKey, dayEvents] of Object.entries(events)) {
      if (dayEvents.some((event) => event.type === "school")) {
        schoolDates.add(dateKey);
      }
      if (dayEvents.some((event) => event.type === "national")) {
        nationalDates.add(dateKey);
      }
    }

    return NextResponse.json({
      dates,
      events,
      schoolDates: [...schoolDates],
      nationalDates: [...nationalDates],
      countryCode,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { dates: [], events: {}, schoolDates: [], nationalDates: [] },
      { status: 500 }
    );
  }
}
