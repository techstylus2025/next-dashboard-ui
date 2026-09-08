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
      className="group flex min-h-[72px] items-center rounded-lg bg-slate-50 p-3 transition-all duration-150 hover:-translate-y-0.5 hover:bg-white"
    >
      <div className="flex w-full items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${colors.bg} text-white shadow-sm ${colors.shadow}`}>
          <span className="inline-flex h-4 w-4 items-center justify-center [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
            {icon}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 leading-5">{title}</p>
        </div>
      </div>
    </Link>
  );
}
