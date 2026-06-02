"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());
  const [eventDates, setEventDates] = useState<Set<string>>(new Set());

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
          setEventDates(new Set(json.dates || []));
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const tileClassName = ({ date }: { date: Date }) => {
    const key = date.toISOString().slice(0, 10);
    return eventDates.has(key) ? "event-tile" : null;
  };

  return (
    <div className="rounded-lg shadow-sm border border-slate-100 p-2">
      <Calendar
        onChange={onChange}
        value={value}
        tileClassName={tileClassName}
        prevLabel="‹"
        nextLabel="›"
      />
    </div>
  );
};

export default EventCalendar;
