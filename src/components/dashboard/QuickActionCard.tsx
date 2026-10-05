import Link from "next/link";
import type { ReactNode } from "react";

type QuickActionCardProps = {
  title: string;
  description?: string;
  href?: string;
  icon: ReactNode;
  colorVariant?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
};

const colorVariants = [
  { bg: "from-sky-500 to-blue-600", shadow: "shadow-sky-500/20" },
  { bg: "from-violet-500 to-indigo-600", shadow: "shadow-violet-500/20" },
  { bg: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20" },
  { bg: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
  { bg: "from-rose-500 to-pink-600", shadow: "shadow-rose-500/20" },
  { bg: "from-cyan-500 to-blue-500", shadow: "shadow-cyan-500/20" },
  { bg: "from-fuchsia-500 to-purple-600", shadow: "shadow-fuchsia-500/20" },
  { bg: "from-lime-500 to-green-600", shadow: "shadow-lime-500/20" },
];

export default function QuickActionCard({ title, description, href = "#", icon, colorVariant = 0 }: QuickActionCardProps) {
  const colors = colorVariants[colorVariant];

  return (
    <Link
      href={href}
      className="group flex min-h-[88px] items-center rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-md"
    >
      <div className="flex w-full items-center gap-3">
        <div className="relative overflow-visible">
          <div className={`absolute -inset-3 rounded-lg bg-gradient-to-br ${colors.bg} opacity-0 transition-all duration-200 blur-2xl group-hover:opacity-80 group-hover:scale-105 pointer-events-none z-0`} />
          <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${colors.bg} text-white shadow-sm ${colors.shadow}`}>
            <span className="inline-flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
              {icon}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5 text-slate-900">{title}</p>
          {description ? (
            <p className="mt-1 text-xs leading-4 text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
