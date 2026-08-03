"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Menu from "@/components/Menu";
import MessagesModal from "@/components/MessagesModal";
import Navbar from "@/components/Navbar";
import type { ReactNode } from "react";

export default function DashboardShell({
  children,
  homeHref,
  supervisorClassName,
}: {
  children: ReactNode;
  homeHref: string;
  supervisorClassName?: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();
  const role = user?.publicMetadata.role as string | undefined;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.innerWidth < 768;
    if (!isMobile || !menuOpen) {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      return;
    }

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [menuOpen]);

  const bottomNavItems = [
    {
      icon: "/more.svg",
      label: "Menu",
      href: "#menu",
      show: !!role,
      action: () => setMenuOpen(true),
    },
    {
      icon: "/home.svg",
      label: "Home",
      href: homeHref,
      show: !!role,
    },
    {
      icon: "/profile.svg",
      label: "Profile",
      href: "/profile",
      show: !!role,
    },
    {
      icon: "/help.svg",
      label: "Help",
      href: "/list/help",
      show: !!role,
    },
    {
      icon: "/setting.svg",
      label: "Settings",
      href: "/list/settings",
      show: role === "admin",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 border-r border-slate-800/60 bg-slate-950 shadow-xl transition-transform duration-300 ease-out md:static md:h-auto md:translate-x-0 flex flex-col ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-800/50 px-4 py-3 sm:px-5 bg-slate-950">
          <Link href={homeHref} className="flex items-center gap-2">
            <Image src="/logo.png" alt="logo" width={32} height={32} />
            <span className="font-bold text-white">KINGS HEART SCHOOL</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin]" style={{ WebkitOverflowScrolling: "touch" }}>
            <Menu />
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 min-w-0 flex-col md:pl-0 lg:pl-0">
        <div className="sticky top-0 z-40 flex items-center justify-center border-b border-slate-200 bg-white/90 px-2 py-2.5 backdrop-blur-md shadow-sm md:hidden">
          <Link href={homeHref} className="flex items-center gap-2">
            <Image src="/logo.png" alt="logo" width={28} height={28} />
            <span className="text-sm font-semibold text-slate-900">KINGS HEART SCHOOL</span>
          </Link>
        </div>

        <div className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 backdrop-blur-md px-0 py-0 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {supervisorClassName ? (
                <div className="rounded-full bg-sky-600/10 px-2.5 py-1.5 text-xs font-medium text-sky-900 ring-1 ring-sky-200">
                  Supervisor of {supervisorClassName}
                </div>
              ) : null}
            </div>
            <Navbar onMessagesOpen={() => setMessagesOpen(true)} />
          </div>
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-slate-100/70 px-2.5 py-2 pb-24 sm:px-3 lg:px-4" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="page-shell">{children}</div>
        </main>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu overlay"
        />
      ) : null}

      <button
        type="button"
        className="hidden md:inline-flex fixed bottom-8 right-5 z-50 h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-600 text-white shadow-[0_18px_45px_-18px_rgba(56,189,248,0.85)] transition-transform duration-200 hover:-translate-y-1"
        aria-label="Open messages"
        onClick={() => setMessagesOpen(true)}
      >
        <span className="sr-only">Open messages</span>
        <Image src="/message.svg" alt="Messages" width={24} height={24} className="invert" />
      </button>

      <div className="fixed left-4 right-4 bottom-4 z-40 md:hidden rounded-full border border-slate-800/20 bg-slate-950/95 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-2 py-2">
          {bottomNavItems.filter((item) => item.show).map((item) => {
            const active = item.href !== "#menu" && pathname === item.href;
            return item.action ? (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className={`inline-flex flex-col items-center justify-center gap-1 rounded-full px-2.5 py-2 text-[11px] font-medium transition-colors border-b-2 ${
                  active ? "text-sky-400 border-b-sky-400" : "text-slate-400 border-b-transparent hover:text-slate-300"
                }`}
              >
                <Image src={item.icon} alt={item.label} width={18} height={18} className="invert" />
                <span>{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex flex-col items-center justify-center gap-1 rounded-full px-2.5 py-2 text-[11px] font-medium transition-colors border-b-2 ${
                  active ? "text-sky-400 border-b-sky-400" : "text-slate-400 border-b-transparent hover:text-slate-300"
                }`}
              >
                <Image src={item.icon} alt={item.label} width={18} height={18} className="invert" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <MessagesModal open={messagesOpen} onClose={() => setMessagesOpen(false)} />
    </div>
  );
}
