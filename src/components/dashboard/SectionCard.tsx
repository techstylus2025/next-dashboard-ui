import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export default function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
