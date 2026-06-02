"use client";

export default function StudentsAttendanceTable({ rows }: { rows: { className: string; totalStudents: number; presentToday: number; absentToday: number; }[] }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-3 py-2 text-left">Class</th>
            <th className="px-3 py-2 text-right">Total students</th>
            <th className="px-3 py-2 text-right">Present today</th>
            <th className="px-3 py-2 text-right">Absent today</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.className} className="hover:bg-slate-50">
              <td className="px-3 py-3 font-medium">{r.className}</td>
              <td className="px-3 py-3 text-right text-slate-700">{r.totalStudents}</td>
              <td className="px-3 py-3 text-right text-emerald-700">{r.presentToday}</td>
              <td className="px-3 py-3 text-right text-rose-600">{r.absentToday}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
