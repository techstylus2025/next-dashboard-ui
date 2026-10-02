"use client";

import { useState } from "react";
import { CalendarDays, ClipboardCheck, Users } from "lucide-react";

type ParentAttendanceRecord = {
  id: number;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  present: boolean;
};

type ChildOption = {
  id: string;
  name: string;
  className: string;
};

export default function ParentAttendanceRecords({
  records,
  students,
}: {
  records: ParentAttendanceRecord[];
  students: ChildOption[];
}) {
  const [query, setQuery] = useState("");
  const [childId, setChildId] = useState("all");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredRecords = records.filter((record) => {
    if (childId !== "all" && record.studentId !== childId) return false;
    if (status === "present" && !record.present) return false;
    if (status === "absent" && record.present) return false;
    if (fromDate && record.date < fromDate) return false;
    if (toDate && record.date > toDate) return false;
    if (query && !`${record.studentName} ${record.className}`.toLowerCase().includes(query.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  const presentCount = filteredRecords.filter((record) => record.present).length;
  const absentCount = filteredRecords.length - presentCount;
  const attendanceRate = filteredRecords.length
    ? Math.round((presentCount / filteredRecords.length) * 100)
    : 0;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Family records</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Student attendance</h1>
          <p className="mt-1 text-sm text-slate-600">Attendance history for students linked to your parent account.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays size={16} aria-hidden="true" />
          <span>{records.length} records</span>
        </div>
      </header>

      <section aria-label="Attendance summary" className="grid gap-3 sm:grid-cols-3">
        <SummaryItem label="Records shown" value={filteredRecords.length} icon={<ClipboardCheck size={18} />} tone="sky" />
        <SummaryItem label="Present" value={presentCount} icon={<ClipboardCheck size={18} />} tone="green" />
        <SummaryItem label="Attendance rate" value={`${attendanceRate}%`} icon={<Users size={18} />} tone="slate" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-medium text-slate-600 sm:min-w-48">
            Search student
            <span className="relative mt-1 block">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name or class"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </span>
          </label>
          <label className="min-w-40 text-xs font-medium text-slate-600">
            Student
            <select value={childId} onChange={(event) => setChildId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
              <option value="all">All students</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
          </label>
          <label className="min-w-36 text-xs font-medium text-slate-600">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
              <option value="all">All statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            From
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            To
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900" />
          </label>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Attendance history</h2>
              <p className="mt-0.5 text-xs text-slate-500">Most recent records first</p>
            </div>
            <span className="text-xs tabular-nums text-slate-500">{filteredRecords.length} shown</span>
          </div>

          {filteredRecords.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Class</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">{record.studentName}</td>
                      <td className="px-4 py-3 text-slate-600">{record.className || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${record.date}T00:00:00`))}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${record.present ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${record.present ? "bg-emerald-500" : "bg-rose-500"}`} aria-hidden="true" />
                          {record.present ? "Present" : "Absent"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ClipboardCheck size={19} />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800">No attendance records found</p>
              <p className="mt-1 text-sm text-slate-500">Try changing the student, status, or date filters.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryItem({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: "sky" | "green" | "slate";
}) {
  const toneClass = {
    sky: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${toneClass}`}>{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      </div>
    </div>
  );
}
