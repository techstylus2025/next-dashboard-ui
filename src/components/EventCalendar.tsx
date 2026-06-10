"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

type CalendarEvent = {
  id: number | string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  type: "school" | "national";
};

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());
  const [schoolDates, setSchoolDates] = useState<Set<string>>(new Set());
  const [nationalDates, setNationalDates] = useState<Set<string>>(new Set());
  const [eventsByDate, setEventsByDate] = useState<
    Record<string, CalendarEvent[]>
  >({});
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (value instanceof Date) {
      router.push(`?date=${value.toISOString()}`);
    }
  }, [value, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/events/dates");
        if (res.ok) {
          const json = await res.json();
          setSchoolDates(new Set(json.schoolDates || []));
          setNationalDates(new Set(json.nationalDates || []));
          setEventsByDate(json.events || {});
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const dateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const key = dateKey(date);
    const hasSchool = schoolDates.has(key);
    const hasNational = nationalDates.has(key);

    if (hasSchool && hasNational) return "both-events-tile";
    if (hasNational) return "national-event-tile";
    if (hasSchool) return "school-event-tile";
    return null;
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const key = dateKey(date);
    const hasSchool = schoolDates.has(key);
    const hasNational = nationalDates.has(key);
    if (!hasSchool && !hasNational) return null;

    return (
      <div
        className="mt-1 flex items-center justify-center gap-1"
        onMouseEnter={() => setHoveredDate(key)}
        onMouseLeave={() => setHoveredDate(null)}
      >
        {hasNational ? (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        ) : null}
        {hasSchool ? (
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
        ) : null}
      </div>
    );
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.type === "national") return "All day";
    return `${new Date(event.startTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${new Date(event.endTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div className="relative rounded-lg border border-slate-100 p-2 shadow-sm">
      <Calendar
        onChange={onChange}
        value={value}
        tileClassName={tileClassName}
        tileContent={tileContent}
        prevLabel="‹"
        nextLabel="›"
      />

      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          National holiday
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          School event
        </span>
      </div>

      {hoveredDate && eventsByDate[hoveredDate]?.length > 0 ? (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 max-w-sm min-w-52 -translate-x-1/2 rounded-lg bg-slate-900 p-3 text-white shadow-lg">
          <div className="mb-2 text-xs font-semibold text-slate-300">
            {new Date(hoveredDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="space-y-2">
            {eventsByDate[hoveredDate].map((event) => (
              <div key={event.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      event.type === "national" ? "bg-emerald-400" : "bg-sky-400"
                    }`}
                  />
                  <p className="font-medium text-white">{event.title}</p>
                </div>
                <p className="mt-0.5 pl-3.5 text-slate-300">
                  {formatEventTime(event)}
                </p>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 -mt-1 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      ) : null}
    </div>
  );
};

export default EventCalendar;
