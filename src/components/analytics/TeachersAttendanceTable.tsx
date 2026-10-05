"use client";

export default function TeachersAttendanceTable({ rows }: { rows: { name: string; supervisorClass: string | null; subjects: string[]; presentToday: boolean }[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm sm:p-4">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="rounded-l-lg px-4 py-3 text-left font-semibold">Teacher</th>
            <th className="px-4 py-3 text-left font-semibold">Class</th>
            <th className="px-4 py-3 text-left font-semibold">Subjects</th>
            <th className="rounded-r-lg px-4 py-3 text-left font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.name} className="transition-colors hover:bg-slate-50/80">
              <td className="px-4 py-3.5 font-medium text-slate-800">{r.name}</td>
              <td className="px-4 py-3.5 text-slate-600">{r.supervisorClass ?? "—"}</td>
              <td className="px-4 py-3.5 text-slate-600">{r.subjects.length ? r.subjects.join(", ") : "—"}</td>
              <td className="px-4 py-3.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${r.presentToday ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${r.presentToday ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {r.presentToday ? "Present" : "Absent"}
                </span>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                No teacher attendance data is available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
