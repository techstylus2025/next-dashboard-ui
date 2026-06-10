import prisma from "@/lib/prisma";
import {
  getNationalEventsForDate,
  resolveCountryFromLocation,
} from "@/lib/nationalEvents";

const EventList = async ({ dateParam }: { dateParam: string | undefined }) => {
  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [schoolSettings, schoolEvents] = await Promise.all([
    prisma.schoolSetting.findFirst({ select: { location: true } }),
    prisma.event.findMany({
      where: {
        isArchived: false,
        startTime: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const countryCode = resolveCountryFromLocation(schoolSettings?.location);
  const nationalEvents = getNationalEventsForDate(date, countryCode);

  if (schoolEvents.length === 0 && nationalEvents.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        No events scheduled for this day.
      </p>
    );
  }

  return (
    <>
      {nationalEvents.map((event) => (
        <div
          className="rounded-md border-2 border-gray-100 border-t-4 border-t-emerald-500 bg-emerald-50/30 p-5"
          key={event.id}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                National
              </span>
              <h2 className="font-semibold text-slate-800">{event.title}</h2>
            </div>
            <span className="shrink-0 text-xs text-slate-500">All day</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{event.description}</p>
        </div>
      ))}

      {schoolEvents.map((event) => (
        <div
          className="rounded-md border-2 border-gray-100 border-t-4 border-t-sky-500 p-5 odd:border-t-lamaSky even:border-t-lamaPurple"
          key={event.id}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                School
              </span>
              <h2 className="font-semibold text-slate-700">{event.title}</h2>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {event.startTime.toLocaleTimeString("en-UK", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{event.description}</p>
        </div>
      ))}
    </>
  );
};

export default EventList;
