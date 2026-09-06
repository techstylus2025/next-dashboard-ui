"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo, useState } from "react";

const localizer = momentLocalizer(moment);

const CustomToolbar = ({ label, onView }: any) => {
  const views = [
    { key: Views.WORK_WEEK, label: "Week" },
    { key: Views.DAY, label: "Day" },
  ];

  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Class calendar</p>
        <div className="text-lg font-semibold text-slate-950">{label}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {views.map((viewOption) => (
          <button
            key={viewOption.key}
            type="button"
            onClick={() => onView(viewOption.key)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {viewOption.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const BigCalendar = ({
  data,
}: {
  data: { title: string; start: Date; end: Date }[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: "#0f172a",
        borderRadius: "14px",
        color: "#ffffff",
        border: "none",
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
        padding: "4px 10px",
      },
    };
  };

  const initialDate = useMemo(() => new Date(), []);

  return (
    <div className="w-full">
      <Calendar
        localizer={localizer}
        events={data}
        startAccessor="start"
        endAccessor="end"
        views={[Views.WORK_WEEK, Views.DAY]}
        view={view}
        onView={handleOnChangeView}
        components={{ toolbar: CustomToolbar }}
        eventPropGetter={eventStyleGetter}
        style={{ minHeight: 420 }}
        min={new Date(2025, 1, 0, 8, 0, 0)}
        max={new Date(2025, 1, 0, 17, 0, 0)}
      />
    </div>
  );
};

export default BigCalendar;
