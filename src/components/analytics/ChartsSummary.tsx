"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ChartsSummary({
  studentsByClass,
  topAttendants,
  topStudentsByClass,
  subjectPerformanceSummary,
}: {
  studentsByClass: { className: string; studentCount: number }[];
  topAttendants: { name: string; count: number }[];
  topStudentsByClass: { classId: number; className: string; topStudents: { studentName: string; overallPercentage: number | null }[] }[];
  subjectPerformanceSummary: { subjectName: string; averageMarks: number; lowPerformanceCount: number; studentCount: number }[];
}) {
  const topStudentsChartData = topStudentsByClass.map((entry) => {
    const row: Record<string, string | number | null> = { className: entry.className };
    entry.topStudents.forEach((student, index) => {
      row[`student${index + 1}`] = student.overallPercentage ?? 0;
      row[`student${index + 1}Name`] = student.studentName;
    });
    return row;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-semibold mb-2">Students by Class</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studentsByClass} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" />
              <YAxis dataKey="className" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="studentCount" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-semibold mb-2">Subject Performance Summary</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectPerformanceSummary} margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subjectName" angle={-20} textAnchor="end" height={60} interval={0} />
              <YAxis />
              <Tooltip formatter={(value: number) => (Number.isFinite(value) ? value.toFixed(1) : value)} />
              <Bar dataKey="averageMarks" fill="#f59e0b" name="Avg Marks" />
              <Bar dataKey="lowPerformanceCount" fill="#ef4444" name="Low Performers" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm xl:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold">Top Students by Class</h3>
            <p className="text-xs text-slate-500">Showing up to 5 highest ranked students per class.</p>
          </div>
        </div>
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topStudentsChartData} margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis />
              <Tooltip formatter={(value: number) => (Number.isFinite(value) ? `${value.toFixed(1)}%` : value)} />
              <Bar dataKey="student1" fill="#22c55e" name="Top 1" />
              <Bar dataKey="student2" fill="#38bdf8" name="Top 2" />
              <Bar dataKey="student3" fill="#a855f7" name="Top 3" />
              <Bar dataKey="student4" fill="#f97316" name="Top 4" />
              <Bar dataKey="student5" fill="#ef4444" name="Top 5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm xl:col-span-2">
        <h3 className="text-sm font-semibold mb-3">Top Students Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topStudentsByClass.map((entry) => (
            <div key={entry.classId} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">{entry.className}</p>
              <ul className="space-y-2">
                {entry.topStudents.map((student, index) => (
                  <li key={index} className="text-sm text-slate-700">
                    <span className="font-medium">{index + 1}. </span>
                    {student.studentName}
                    <span className="ml-2 text-slate-500">{student.overallPercentage?.toFixed(1) ?? "-"}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm xl:col-span-2">
        <h3 className="text-sm font-semibold mb-2">Top Attendants (30 days)</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAttendants} margin={{ left: 20, right: 20 }}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
