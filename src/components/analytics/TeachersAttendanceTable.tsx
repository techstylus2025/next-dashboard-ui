"use client";

export default function TeachersAttendanceTable({ rows }: { rows: { name: string; supervisorClass: string | null; subjects: string[]; presentToday: boolean }[] }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            <th className="px-3 py-2 text-left">Teacher's name</th>
            <th className="px-3 py-2 text-left">Class</th>
            <th className="px-3 py-2 text-left">Subjects</th>
            <th className="px-3 py-2 text-left">Attendance status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.name} className="hover:bg-slate-50">
              <td className="px-3 py-3 font-medium">{r.name}</td>
              <td className="px-3 py-3">{r.supervisorClass ?? "—"}</td>
              <td className="px-3 py-3">{r.subjects.join(", ")}</td>
              <td className="px-3 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.presentToday ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                  {r.presentToday ? "Present" : "Absent"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
