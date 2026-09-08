"use client";

import { useState } from "react";

type EventItem = {
  title: string;
  timeLabel: string;
  startTimeIso?: string;
  dateLabel?: string;
  description?: string;
  location: string;
};

export default function UpcomingEvents({ events }: { events: EventItem[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div>
      {events.length > 0 ? (
        <ul>
          {events.map((event, idx) => (
            <li key={event.title} className="flex flex-col sm:flex-row sm:items-center gap-3 pb-3 mb-3 border-b border-slate-100 last:border-b-0 last:mb-0">
              <div className="flex flex-row items-start sm:items-center gap-3 w-full">
                <div className="flex flex-col items-center sm:items-start sm:mr-2">
                  <div className="h-8 w-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 7V3M16 7V3M3 11h18M21 19H3V11a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center justify-between">
                    <button type="button" onClick={() => setExpanded(expanded === idx ? null : idx)} className="text-left">
                      <p className="font-semibold text-slate-900 hover:underline truncate">{event.title}</p>
                    </button>

                    <div className="ml-4 flex-shrink-0 text-sm text-slate-500 flex items-center gap-2">
                      <span className="text-slate-400 whitespace-nowrap">{event.dateLabel ?? ""}</span>
                      {event.dateLabel && event.timeLabel ? <span className="text-slate-300">·</span> : null}
                      <span className="text-slate-400 whitespace-nowrap">{event.timeLabel ?? ""}</span>
                      {(event.timeLabel || event.dateLabel) && event.location ? <span className="text-slate-300">·</span> : null}
                      <span className="text-slate-400 max-w-[140px] truncate block">{event.location}</span>
                    </div>
                  </div>

                  {expanded === idx && event.description ? (
                    <div className="mt-2 text-sm text-slate-600">
                      {event.description}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No upcoming events are scheduled yet.</p>
      )}
    </div>
  );
}
