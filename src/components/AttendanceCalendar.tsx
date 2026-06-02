"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const AttendanceCalendar = ({ selectedDate }: { selectedDate: string }) => {
  const [value, setValue] = useState<Date>(() => new Date(selectedDate));
  const router = useRouter();

  useEffect(() => {
    const parsed = new Date(selectedDate);
    if (!Number.isNaN(parsed.getTime())) {
      setValue(parsed);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!(value instanceof Date)) return;

    const currentDateKey = value.toISOString().slice(0, 10);
    if (currentDateKey === selectedDate) return;

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("date", currentDateKey);

    router.push(`${window.location.pathname}?${searchParams.toString()}`);
  }, [value, selectedDate, router]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-700 p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">Attendance calendar</p>
      <Calendar
        onChange={(nextValue: Value) => {
          if (Array.isArray(nextValue) || nextValue === null) return;
          setValue(nextValue);
        }}
        value={value}
        prevLabel="‹"
        nextLabel="›"
      />
    </div>
  );
};

export default AttendanceCalendar;
