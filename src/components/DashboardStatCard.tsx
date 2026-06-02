type DashboardStatCardProps = {
  label: string;
  value: string;
  detail?: string;
  badge?: string;
};

const DashboardStatCard = ({ label, value, detail, badge }: DashboardStatCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {badge ? (
          <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
            {badge}
          </span>
        ) : null}
      </div>
      {detail ? <p className="mt-3 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
};

export default DashboardStatCard;
