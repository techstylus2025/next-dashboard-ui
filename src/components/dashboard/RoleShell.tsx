import type { ReactNode } from "react";

type RoleShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  badge?: ReactNode;
};

export default function RoleShell({ title, subtitle, children, badge }: RoleShellProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-[0_25px_60px_-25px_rgba(7,26,73,0.45)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-200">Kings Heart</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">{subtitle}</p>
          </div>
          {badge ? <div>{badge}</div> : null}
        </div>
      </div>
      {children}
    </div>
  );
}
