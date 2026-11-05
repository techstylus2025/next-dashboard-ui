"use client";

import { saveClassTermScoreLimits } from "@/lib/termlyReportActions";
import type { ResultsPageContext } from "@/lib/resultsData";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";

export default function ClassScoreLimits({
  classes,
}: {
  classes: ResultsPageContext["classes"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState(
    Object.fromEntries(
      classes.map((cls) => [
        cls.id,
        {
          classScoreMaximum: String(cls.classScoreMaximum),
          examScoreMaximum: String(cls.examScoreMaximum),
        },
      ])
    )
  );

  const save = (classId: number) => {
    const limits = values[classId];
    if (!limits) return;
    startTransition(async () => {
      const result = await saveClassTermScoreLimits({
        classId,
        classScoreMaximum: Number(limits.classScoreMaximum),
        examScoreMaximum: Number(limits.examScoreMaximum),
      });
      if (result.success) {
        toast.success("Score limits saved.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not save score limits.");
      }
    });
  };

  return (
    <details className="group rounded-2xl border border-sky-100 bg-sky-50/70 p-4 sm:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-base font-semibold text-slate-900">Termly score limits</span>
          <span className="mt-1 block text-sm text-slate-600">
            Set class and exam score maximums per class. The two limits must total 100.
          </span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-slate-500 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-4 grid gap-3 border-t border-sky-100 pt-4 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((cls) => {
          const limits = values[cls.id];
          return (
            <div key={cls.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">{cls.name}</h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-600">
                  Class max
                  <input
                    type="number"
                    min={1}
                    max={99}
                    step={1}
                    value={limits?.classScoreMaximum ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [cls.id]: {
                          ...current[cls.id],
                          classScoreMaximum: event.target.value,
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Exam max
                  <input
                    type="number"
                    min={1}
                    max={99}
                    step={1}
                    value={limits?.examScoreMaximum ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [cls.id]: {
                          ...current[cls.id],
                          examScoreMaximum: event.target.value,
                        },
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Total: {(Number(limits?.classScoreMaximum) || 0) + (Number(limits?.examScoreMaximum) || 0)} / 100
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => save(cls.id)}
                className="mt-3 w-full rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Save limits
              </button>
            </div>
          );
        })}
      </div>
    </details>
  );
}
