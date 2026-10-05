"use client";

import { ClipboardCheck, GraduationCap } from "lucide-react";
import { useState } from "react";
import StudentsAttendanceTable from "./StudentsAttendanceTable";
import TeachersAttendanceTable from "./TeachersAttendanceTable";

export default function AnalyticsTabs({ studentsRows, teachersRows }: {
  studentsRows: { className: string; totalStudents: number; presentToday: number; absentToday: number; }[];
  teachersRows: { name: string; supervisorClass: string | null; subjects: string[]; presentToday: boolean }[];
}) {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Attendance group"
        className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'students'}
          onClick={() => setTab('students')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'students'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <GraduationCap size={16} />
          Students
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'teachers'}
          onClick={() => setTab('teachers')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'teachers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardCheck size={16} />
          Teachers
        </button>
      </div>

      {tab === 'students' ? (
        <StudentsAttendanceTable rows={studentsRows} />
      ) : (
        <TeachersAttendanceTable rows={teachersRows} />
      )}
    </div>
  );
}
