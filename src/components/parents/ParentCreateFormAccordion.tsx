"use client";

import { useState } from "react";
import ParentCreateForm from "@/components/parents/ParentCreateForm";

export default function ParentCreateFormAccordion() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Register parent
          </p>
          <span className="mt-1 block text-base font-semibold text-slate-950">
            {open ? "Hide form" : "Show parent registration form"}
          </span>
        </div>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pt-0">
          <ParentCreateForm />
        </div>
      </div>
    </div>
  );
}
