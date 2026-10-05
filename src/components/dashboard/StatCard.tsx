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
    <div className={`min-h-[132px] rounded-2xl border border-slate-200/80 bg-gradient-to-br ${cardBackground} p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-600 sm:text-sm">{detail}</p>
        {trend ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{trend}</span> : null}
      </div>
    </div>
  );
}
