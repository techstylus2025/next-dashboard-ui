"use client";

import React, { useMemo, useState } from "react";
import Performance from "@/components/Performance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type ClassPoint = { className: string; averageScore: number };
type TermPoint = { termKey: string; label: string; performanceByClass: ClassPoint[] };

export default function PerformancePanel({ terms, fallbackClasses }: { terms?: TermPoint[]; fallbackClasses?: ClassPoint[] }) {
  const available = terms && terms.length > 0 ? terms : fallbackClasses ? [{ termKey: "latest", label: "Latest", performanceByClass: fallbackClasses }] : [];
  const [selected, setSelected] = useState(0);

  const active = available[Math.min(Math.max(selected, 0), available.length - 1)];

  const classPoints = active ? active.performanceByClass ?? [] : [];

  const overall = useMemo(() => {
    if (!classPoints || classPoints.length === 0) return null;
    const sum = classPoints.reduce((s, c) => s + (c.averageScore || 0), 0);
    return Math.round((sum / classPoints.length) * 10) / 10;
  }, [classPoints]);

  const report = {
    overallPercentage: overall,
    overallGrade: null,
    resultStatus: null,
    academicYearLabel: active ? active.label : "Latest",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{active ? active.label : "Performance"}</h3>
        {available.length > 1 ? (
          <select value={selected} onChange={(e) => setSelected(Number(e.target.value))} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700">
            {available.map((t, idx) => (
              <option key={t.termKey} value={idx}>
                {t.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <Performance report={report} />
        </div>

        <div className="rounded-md bg-white p-3 border border-slate-200">
          <p className="mb-3 text-sm font-semibold text-slate-700">Class averages</p>
          {classPoints.length === 0 ? (
            <p className="text-sm text-slate-500">No class data available.</p>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPoints.map((c) => ({ name: c.className, value: c.averageScore }))} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
