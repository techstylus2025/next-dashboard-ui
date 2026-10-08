"use client";

import { useState } from "react";
import Image from "next/image";

export default function AssignmentViewModal({ assignment }: { assignment: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        aria-label={`View ${assignment.title}`}
      >
        <Image src="/view.svg" alt="" width={14} height={14} />
        View details
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`assignment-title-${assignment.id}`}
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-slate-100"
              onClick={() => setOpen(false)}
              aria-label="Close assignment details"
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              {assignment.lesson.subject.name} · {assignment.lesson.class.name}
            </p>
            <h2
              id={`assignment-title-${assignment.id}`}
              className="mt-2 pr-10 text-2xl font-bold tracking-tight text-slate-900"
            >
              {assignment.title}
            </h2>

            <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Teacher</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {assignment.lesson.teacher.name} {assignment.lesson.teacher.surname}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Available from</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {new Date(assignment.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Due date</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Instructions</h3>
              <div className="mt-2 min-h-24 whitespace-pre-wrap rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                {assignment.questions?.trim() || "No additional instructions were provided."}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
