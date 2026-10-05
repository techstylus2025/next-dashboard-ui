"use client";

export default function StudentsAttendanceTable({ rows }: { rows: { className: string; totalStudents: number; presentToday: number; absentToday: number; }[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm sm:p-4">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="rounded-l-lg px-4 py-3 text-left font-semibold">Class</th>
            <th className="px-4 py-3 text-right font-semibold">Total students</th>
            <th className="px-4 py-3 text-right font-semibold">Present today</th>
            <th className="rounded-r-lg px-4 py-3 text-right font-semibold">Absent today</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.className} className="transition-colors hover:bg-slate-50/80">
              <td className="px-4 py-3.5 font-medium text-slate-800">{r.className}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{r.totalStudents}</td>
              <td className="px-4 py-3.5 text-right tabular-nums font-medium text-emerald-700">{r.presentToday}</td>
              <td className="px-4 py-3.5 text-right tabular-nums font-medium text-rose-600">{r.absentToday}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                No student attendance data is available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
