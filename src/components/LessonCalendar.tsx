"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo, useState } from "react";

type LessonRow = {
  id: number;
  name: string;
  day: string;
  startTime: string | Date;
  endTime: string | Date;
  subject: { id: number; name: string };
  class: { id: number; name: string };
  teacher: { id: string; name: string; surname: string };
};

type Option = {
  id: number;
  name: string;
};

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  subjectName: string;
  className: string;
  teacherName: string;
};

const localizer = momentLocalizer(moment);

const palette = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
  "#0ea5e9",
  "#e11d48",
  "#10b981",
];

const parseDate = (value: string | Date) => new Date(value);

const getLatestMonday = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const latestMonday = new Date(today);
  latestMonday.setDate(today.getDate() - daysSinceMonday);
  return latestMonday;
};

const adjustEventsToCurrentWeek = <T extends { start: Date; end: Date }>(events: T[]): T[] => {
  const latestMonday = getLatestMonday();

  return events.map((event) => {
    const lessonDayOfWeek = event.start.getDay();
    const daysFromMonday = lessonDayOfWeek === 0 ? 6 : lessonDayOfWeek - 1;

    const adjustedStartDate = new Date(latestMonday);
    adjustedStartDate.setDate(latestMonday.getDate() + daysFromMonday);
    adjustedStartDate.setHours(
      event.start.getHours(),
      event.start.getMinutes(),
      event.start.getSeconds()
    );

    const adjustedEndDate = new Date(adjustedStartDate);
    adjustedEndDate.setHours(
      event.end.getHours(),
      event.end.getMinutes(),
      event.end.getSeconds()
    );

    return {
      ...event,
      start: adjustedStartDate,
      end: adjustedEndDate,
    };
  });
};

const LessonCalendar = ({
  lessons,
  subjects,
  classes,
}: {
  lessons: LessonRow[];
  subjects: Option[];
  classes: Option[];
}) => {
  const [calendarView, setCalendarView] = useState<View>(Views.WORK_WEEK);
  const [groupMode, setGroupMode] = useState<"all" | "subject" | "class">("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "all">("all");
  const [selectedClassId, setSelectedClassId] = useState<number | "all">("all");

  const eventData = useMemo(() => {
    const normalized = lessons.map((lesson) => ({
      id: lesson.id,
      title: `${lesson.name} · ${lesson.subject.name} · ${lesson.class.name}`,
      start: parseDate(lesson.startTime),
      end: parseDate(lesson.endTime),
      subjectName: lesson.subject.name,
      className: lesson.class.name,
      teacherName: `${lesson.teacher.name} ${lesson.teacher.surname}`,
    }));

    return adjustEventsToCurrentWeek(normalized);
  }, [lessons]);

  const filteredEvents = useMemo(() => {
    return eventData.filter((event) => {
      if (groupMode === "subject" && selectedSubjectId !== "all") {
        return event.subjectName === subjects.find((item) => item.id === selectedSubjectId)?.name;
      }
      if (groupMode === "class" && selectedClassId !== "all") {
        return event.className === classes.find((item) => item.id === selectedClassId)?.name;
      }
      return true;
    });
  }, [eventData, groupMode, selectedClassId, selectedSubjectId, subjects, classes]);

  const groupKey = groupMode === "subject" ? "subjectName" : "className";

  const groupMap = useMemo(() => {
    const map: Record<string, string> = {};
    filteredEvents.forEach((event, index) => {
      const key = event[groupKey];
      if (!map[key]) {
        map[key] = palette[index % palette.length];
      }
    });
    return map;
  }, [filteredEvents, groupKey]);

  const eventStyleGetter = (event: any) => {
    const color = groupMode === "class" ? groupMap[event.className] : groupMap[event.subjectName];
    return {
      style: {
        backgroundColor: color ?? "#2563eb",
        borderColor: "transparent",
        color: "white",
        borderRadius: "12px",
      },
    };
  };

  const handleViewChange = (nextView: View) => {
    setCalendarView(nextView);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Lesson schedule</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Quick calendar view</h2>
          <p className="mt-1 text-sm text-slate-600">
            Toggle between the weekly/daily view and filter by subject or class.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCalendarView(Views.WORK_WEEK)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              calendarView === Views.WORK_WEEK
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setCalendarView(Views.DAY)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              calendarView === Views.DAY
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setGroupMode("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              groupMode === "all"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            All lessons
          </button>
          <button
            type="button"
            onClick={() => setGroupMode("subject")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              groupMode === "subject"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            By subject
          </button>
          <button
            type="button"
            onClick={() => setGroupMode("class")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              groupMode === "class"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            By class
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="min-h-[560px] rounded-3xl border border-slate-200 bg-white p-4">
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            view={calendarView}
            views={[Views.WORK_WEEK, Views.DAY]}
            onView={handleViewChange}
            style={{ height: "100%" }}
            min={new Date(2025, 1, 0, 8, 0, 0)}
            max={new Date(2025, 1, 0, 17, 0, 0)}
            eventPropGetter={eventStyleGetter}
          />
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-100 p-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Filter panel</p>
            <p className="text-sm text-slate-500">
              Use subject or class filters to narrow the calendar events.
            </p>
          </div>

          {groupMode === "subject" && (
            <label className="block text-sm font-medium text-slate-700">
              Select a subject
              <select
                value={selectedSubjectId}
                onChange={(event) =>
                  setSelectedSubjectId(
                    event.target.value === "all" ? "all" : Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
              >
                <option value="all">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {groupMode === "class" && (
            <label className="block text-sm font-medium text-slate-700">
              Select a class
              <select
                value={selectedClassId}
                onChange={(event) =>
                  setSelectedClassId(
                    event.target.value === "all" ? "all" : Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
              >
                <option value="all">All classes</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Legend</p>
            <p className="mt-2">Showing {filteredEvents.length} lesson{filteredEvents.length !== 1 ? "s" : ""}.</p>
            <p className="mt-2">Group mode: {groupMode === "all" ? "All lessons" : groupMode === "subject" ? "Subject" : "Class"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonCalendar;
