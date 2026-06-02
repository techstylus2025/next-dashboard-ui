"use client";

import { useEffect, useState } from "react";
import BigCalendar from "./BigCalender";

interface ScheduleCalendarProps {
  type: "teacherId" | "classId";
  id: string | number;
}

interface ScheduleEvent {
  title: string;
  start: string;
  end: string;
}

export default function ScheduleCalendar({ type, id }: ScheduleCalendarProps) {
  const [events, setEvents] = useState<{ title: string; start: Date; end: Date }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSchedule() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/schedules?type=${encodeURIComponent(type)}&id=${encodeURIComponent(String(id))}`);
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || "Unable to load schedule.");
        }

        const payload = await response.json();
        const data: ScheduleEvent[] = payload.data ?? [];

        if (!cancelled) {
          setEvents(
            data.map((event) => ({
              title: event.title,
              start: new Date(event.start),
              end: new Date(event.end),
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load schedule.");
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [type, id]);

  if (loading) {
    return (
      <div className="min-h-[24rem] md:min-h-[32rem] rounded-3xl border border-slate-200/70 bg-slate-50 p-8 text-center text-slate-600">
        Loading schedule...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[24rem] md:min-h-[32rem] rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="min-h-[24rem] md:min-h-[32rem] rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        No class schedule available for your student yet.
      </div>
    );
  }

  return (
    <div className="min-h-[24rem] md:min-h-[32rem] rounded-3xl bg-slate-50 p-2 md:p-4">
      <BigCalendar data={events} />
    </div>
  );
}
