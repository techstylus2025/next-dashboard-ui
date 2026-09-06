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
  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 min-h-[96px]">
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
