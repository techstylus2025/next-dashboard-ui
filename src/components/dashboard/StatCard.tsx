import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string;
  detail: string;
  trend?: string;
  accent?: string;
  icon: ReactNode;
};

export default function StatCard({
  title,
  value,
  detail,
  trend,
  accent = "from-sky-500 to-blue-600",
  icon,
}: StatCardProps) {
  const cardBackground = {
    "from-sky-500 to-blue-600": "from-sky-100 via-sky-50 to-white",
    "from-violet-500 to-indigo-600": "from-violet-100 via-violet-50 to-white",
    "from-emerald-500 to-teal-600": "from-emerald-100 via-emerald-50 to-white",
    "from-amber-500 to-orange-500": "from-amber-100 via-amber-50 to-white",
    "from-rose-500 to-pink-600": "from-rose-100 via-rose-50 to-white",
    "from-cyan-500 to-blue-500": "from-cyan-100 via-cyan-50 to-white",
  }[accent] ?? "from-slate-100 via-slate-50 to-white";

  return (
    <div className={`min-h-[96px] rounded-lg bg-gradient-to-br ${cardBackground} p-4 shadow-sm transition-transform duration-150 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${accent} text-white shadow`}>
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-600">{detail}</p>
        {trend ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{trend}</span> : null}
      </div>
    </div>
  );
}
