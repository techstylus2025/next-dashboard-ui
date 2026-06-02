"use client";

import { isDashboardPath } from "@/lib/dashboard";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type MenuItemConfig = {
  icon: string;
  label: string;
  href: string;
  accent: string;
  badge?: number;
  action?: () => void;
};

export type MenuSection = {
  items: MenuItemConfig[];
};

function isActivePath(pathname: string, href: string): boolean {
  if (isDashboardPath(href)) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MenuPanel({ sections }: { sections: MenuSection[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain py-2 px-2 lg:px-3 [scrollbar-width:thin]"
      aria-label="Main navigation"
      style={{ touchAction: "pan-y" }}
    >
      <div className="flex flex-col gap-0.5 text-sm">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="flex flex-col gap-0.5">
            {sectionIndex > 0 && (
              <div
                className="hidden lg:block my-2 mx-2 border-t border-slate-200"
                aria-hidden
              />
            )}
            {section.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const itemClasses = `group flex items-center gap-2 rounded-2xl py-1.5 px-2 transition-all duration-200 ${
                active
                  ? "bg-slate-100 shadow-sm ring-1 ring-slate-200/80"
                  : "hover:bg-slate-50 hover:shadow-sm hover:ring-1 hover:ring-slate-200/70"
              }`;

              const renderContent = (
                <>
                  <span
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-2 transition-transform duration-200 ${
                      active
                        ? "ring-slate-300/60 scale-105 shadow"
                        : "ring-slate-200/70 group-hover:scale-105"
                    } ${item.accent}`}
                  >
                    <Image
                      src={item.icon}
                      alt=""
                      width={15}
                      height={15}
                      className="h-4 w-4 brightness-0 invert opacity-[0.95]"
                    />
                    {item.badge ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`min-w-0 text-left text-sm leading-tight transition-colors truncate ${
                      active
                        ? "font-semibold text-slate-900"
                        : "font-medium text-slate-700 group-hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              );

              return item.action ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={itemClasses}
                >
                  {renderContent}
                </button>
              ) : (
                <Link
                  href={item.href}
                  key={item.label}
                  aria-current={active ? "page" : undefined}
                  className={itemClasses}
                >
                  {renderContent}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
