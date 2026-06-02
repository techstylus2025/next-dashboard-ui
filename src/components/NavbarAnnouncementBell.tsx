"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 20_000;

export function dispatchAnnouncementsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("announcements-updated"));
  }
}

export default function NavbarAnnouncementBell({
  initialCount,
}: {
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [pulse, setPulse] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements/count", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      setCount((prev) => {
        if (data.count > prev) setPulse(true);
        return data.count;
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    const onUpdate = () => fetchCount();
    window.addEventListener("announcements-updated", onUpdate);
    const interval = setInterval(fetchCount, POLL_MS);
    return () => {
      window.removeEventListener("announcements-updated", onUpdate);
      clearInterval(interval);
    };
  }, [fetchCount]);

  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(false), 1200);
    return () => clearTimeout(t);
  }, [pulse]);

  const display = count > 99 ? "99+" : String(count);

  return (
    <Link
      href="/list/announcements"
      className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
      aria-label={`${count} announcements`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span
          className={`absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900 shadow-md ring-2 ring-indigo-700/80 ${
            pulse ? "animate-pulse scale-110" : ""
          }`}
        >
          {display}
        </span>
      )}
    </Link>
  );
}
