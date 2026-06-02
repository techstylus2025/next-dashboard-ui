"use client";

import { useState } from "react";
import StudentsAttendanceTable from "./StudentsAttendanceTable";
import TeachersAttendanceTable from "./TeachersAttendanceTable";

export default function AnalyticsTabs({ studentsRows, teachersRows }: {
  studentsRows: { className: string; totalStudents: number; presentToday: number; absentToday: number; }[];
  teachersRows: { name: string; supervisorClass: string | null; subjects: string[]; presentToday: boolean }[];
}) {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setTab('students')} className={`px-3 py-1 rounded-full ${tab === 'students' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Students</button>
        <button onClick={() => setTab('teachers')} className={`px-3 py-1 rounded-full ${tab === 'teachers' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Teachers</button>
      </div>

      {tab === 'students' ? (
        <StudentsAttendanceTable rows={studentsRows} />
      ) : (
        <TeachersAttendanceTable rows={teachersRows} />
      )}
    </div>
  );
}
