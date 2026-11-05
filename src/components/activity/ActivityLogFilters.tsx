"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

const roles = ["admin", "teacher", "student", "parent"] as const;

type ActivityLogFiltersProps = {
  query: string;
  period: string;
  date: string;
  role: string;
  action: string;
  maxDate: string;
};

function FilterFields({
  query,
  period,
  date,
  role,
  action,
  maxDate,
}: ActivityLogFiltersProps) {
  return (
    <>
      <label className="block text-xs font-semibold text-slate-600">
        Search activity
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Name, user ID, or page"
          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>
      <label className="block text-xs font-semibold text-slate-600">
        Time period
        <select
          name="period"
          defaultValue={period}
          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800"
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </label>
      <label className="block text-xs font-semibold text-slate-600">
        Specific date
        <input
          type="date"
          name="date"
          defaultValue={date}
          max={maxDate}
          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800"
        />
      </label>
      <label className="block text-xs font-semibold text-slate-600">
        User role
        <select
          name="role"
          defaultValue={role}
          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800"
        >
          <option value="">All roles</option>
          {roles.map((item) => (
            <option key={item} value={item}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold text-slate-600">
        Activity
        <select
          name="action"
          defaultValue={action}
          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800"
        >
          <option value="">All activity</option>
          <option value="PAGE_VIEW">Page visits</option>
          <option value="LOGIN">Sign-ins</option>
          <option value="LOGOUT">Sign-outs</option>
        </select>
      </label>
    </>
  );
}

export default function ActivityLogFilters(props: ActivityLogFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeFilters = [
    props.query,
    props.date,
    props.role,
    props.action,
    props.period !== "7d" ? props.period : "",
  ].filter(Boolean).length;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <form
        action="/admin/activity"
        method="get"
        className="hidden gap-3 border-b border-slate-200 p-4 sm:grid sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_10rem_10rem_10rem_10rem_auto_auto] xl:items-end"
      >
        <FilterFields {...props} />
        <button
          type="submit"
          className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Apply filters
        </button>
        <Link
          href="/admin/activity"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Clear
        </Link>
      </form>

      <div className="border-b border-slate-200 p-4 sm:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-haspopup="dialog"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilters > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-100 px-1 text-xs text-sky-800">
              {activeFilters}
            </span>
          ) : null}
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 sm:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-filter-title"
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <header className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="activity-filter-title" className="text-lg font-semibold text-slate-950">
                  Filter activity
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Narrow the activity log by user, date, or event.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close filters"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </header>
            <form action="/admin/activity" method="get" className="space-y-4">
              <FilterFields {...props} />
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <Link
                  href="/admin/activity"
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Clear
                </Link>
                <button
                  type="submit"
                  className="h-11 flex-1 rounded-xl bg-slate-950 text-sm font-semibold text-white"
                >
                  Apply filters
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
