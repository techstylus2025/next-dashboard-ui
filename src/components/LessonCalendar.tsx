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
  const [selectedLesson, setSelectedLesson] = useState<CalendarEvent | null>(null);

  const eventData = useMemo(() => {
    const normalized = lessons
      .map((lesson) => {
        const subjectName = lesson.subject?.name ?? "Unknown subject";
        const className = lesson.class?.name ?? "Unknown class";
        const teacherName = `${lesson.teacher?.name ?? "Unknown"} ${lesson.teacher?.surname ?? ""}`.trim();

        return {
          id: lesson.id,
          title: `${lesson.name ?? "Lesson"} · ${subjectName} · ${className}`,
          start: parseDate(lesson.startTime),
          end: parseDate(lesson.endTime),
          subjectName,
          className,
          teacherName: teacherName || "Unknown teacher",
        };
      })
      .filter((event) => event.start instanceof Date && !Number.isNaN(event.start.getTime()));

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

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedLesson(event);
  };

  const closeModal = () => setSelectedLesson(null);

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

        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setCalendarView(Views.WORK_WEEK)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
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
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
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
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
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
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
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
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
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
            onSelectEvent={handleSelectEvent}
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

      {selectedLesson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm fade-in"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-modal-title"
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-100 via-slate-50 to-emerald-100 shadow-2xl shadow-slate-900/20 transition-all duration-300 ease-out transform fade-in"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm transition hover:bg-white"
            >
              ✕
            </button>
            <div className="rounded-b-3xl bg-white/90 p-8">
              <div className="rounded-3xl bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-400 p-6 text-white shadow-lg shadow-sky-500/20">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-100/90">Lesson detail</p>
                <h3 id="lesson-modal-title" className="mt-3 text-2xl font-semibold">{selectedLesson.title}</h3>
                <p className="mt-2 text-sm text-slate-100/90">Tap outside the card or press close to dismiss this quick lesson summary.</p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-sky-50 p-4 ring-1 ring-sky-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Subject</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedLesson.subjectName}</p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Class</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedLesson.className}</p>
                </div>
                <div className="rounded-3xl bg-fuchsia-50 p-4 ring-1 ring-fuchsia-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-500">Teacher</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedLesson.teacherName}</p>
                </div>
                <div className="rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-500">Time</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {selectedLesson.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {selectedLesson.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">Details</p>
                <p className="mt-2">Click anywhere outside the modal or the close button to dismiss.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonCalendar;
