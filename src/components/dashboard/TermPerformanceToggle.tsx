"use client";

import React, { useState } from "react";

type ClassPoint = { className: string; averageScore: number };
type TermPoint = { termKey: string; label: string; performanceByClass: ClassPoint[] };

export default function TermPerformanceToggle({
  terms,
  initialIndex = 0,
}: {
  terms: TermPoint[];
  initialIndex?: number;
}) {
  const [selected, setSelected] = useState<number>(initialIndex);

  if (!terms || terms.length === 0) {
    return <p className="text-sm text-slate-500">No performance data available.</p>;
  }

  const active = terms[Math.min(Math.max(selected, 0), terms.length - 1)];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{active.label}</h3>
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
        >
          {terms.map((t, idx) => (
            <option key={t.termKey} value={idx}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {active.performanceByClass.length === 0 ? (
          <p className="text-sm text-slate-500">No class performance for this term.</p>
        ) : (
          active.performanceByClass.map((item) => (
            <div key={item.className} className="space-y-1">
              <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                <span>{item.className}</span>
                <span className="font-semibold text-slate-900">{item.averageScore}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-200">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600" style={{ width: `${item.averageScore}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
