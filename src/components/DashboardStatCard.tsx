type DashboardStatCardProps = {
  label: string;
  value: string;
  detail?: string;
  badge?: string;
  className?: string;
};

const DashboardStatCard = ({ label, value, detail, badge, className }: DashboardStatCardProps) => {
  const base = "rounded-3xl p-4 shadow-sm";
  const outer = className ? `${base} ${className}` : `${base} border border-slate-200/80 bg-white/95`;
  const labelClass = className ? "text-sm font-medium text-white/90" : "text-sm font-medium text-slate-500";
  const valueClass = className ? "mt-2 text-2xl font-semibold text-white" : "mt-2 text-2xl font-semibold text-slate-900";
  const badgeClass = className ? "rounded-2xl bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white" : "rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700";

  return (
    <div className={outer}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={labelClass}>{label}</p>
          <p className={valueClass}>{value}</p>
        </div>
        {badge ? (
          <span className={badgeClass}>
            {badge}
          </span>
        ) : null}
      </div>
      {detail ? <p className={className ? "mt-3 text-sm text-white/90" : "mt-3 text-sm text-slate-500"}>{detail}</p> : null}
    </div>
  );
};

export default DashboardStatCard;
