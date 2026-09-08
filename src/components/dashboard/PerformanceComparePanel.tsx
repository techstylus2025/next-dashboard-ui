"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type ApiTerm = {
  termKey: string;
  label: string;
  classes: { classId: number; className: string; subjects: { subjectId: number; subjectName: string; average: number }[] }[];
};

const COLORS = ["#2563eb", "#06b6d4", "#f97316", "#10b981", "#8b5cf6", "#ef4444"];

export default function PerformanceComparePanel({ initialTerms }: { initialTerms?: ApiTerm[] }) {
  const [terms, setTerms] = useState<ApiTerm[] | null>(initialTerms ?? null);
  const [mode, setMode] = useState<"byClass" | "bySubject">("byClass");
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/dashboard/performance")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const serverTerms: ApiTerm[] = data.terms ?? [];
        if (serverTerms.length > 0) {
          setTerms(serverTerms);
          setSelectedTerms(serverTerms.slice(-3).map((t) => t.termKey));
        } else if (initialTerms && initialTerms.length > 0) {
          setTerms(initialTerms);
          setSelectedTerms(initialTerms.slice(-3).map((t) => t.termKey));
        } else {
          setTerms([]);
        }
      })
      .catch(() => {
        if (initialTerms && initialTerms.length > 0) {
          setTerms(initialTerms);
          setSelectedTerms(initialTerms.slice(-3).map((t) => t.termKey));
        } else {
          setTerms([]);
        }
      });
    return () => {
      mounted = false;
    };
  }, [initialTerms]);

  const classes = useMemo(() => {
    if (!terms) return [];
    const map = new Map<number, string>();
    for (const t of terms) for (const c of t.classes) map.set(c.classId, c.className);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [terms]);

  const subjects = useMemo(() => {
    if (!terms) return [];
    const map = new Map<number, string>();
    for (const t of terms) for (const c of t.classes) for (const s of c.subjects) map.set(s.subjectId, s.subjectName);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [terms]);

  // build chart data depending on mode
  const chartData = useMemo(() => {
    if (!terms || selectedTerms.length === 0) return [];

    if (mode === "byClass") {
      // require a class selected
      const cid = selectedClass ?? classes[0]?.id;
      if (!cid) return [];
      // x-axis: subjects; series: terms
      const subjectSet = new Map<number, string>();
      for (const t of terms) for (const c of t.classes.filter((c) => c.classId === cid)) for (const s of c.subjects) subjectSet.set(s.subjectId, s.subjectName);
      const subjectList = Array.from(subjectSet.entries()).map(([id, name]) => ({ id, name }));

      return subjectList.map((sub) => {
        const row: any = { name: sub.name };
        for (const tk of selectedTerms) {
          const term = terms.find((x) => x.termKey === tk);
          const cls = term?.classes.find((x) => x.classId === cid);
          const subj = cls?.subjects.find((x) => x.subjectId === sub.id);
          row[tk] = subj ? subj.average : 0;
        }
        return row;
      });
    }

    // bySubject: require a subject selected
    const sid = selectedSubject ?? subjects[0]?.id;
    if (!sid) return [];
    // x-axis: classes; series: terms
    const classSet = new Map<number, string>();
    for (const t of terms) for (const c of t.classes) classSet.set(c.classId, c.className);
    const classList = Array.from(classSet.entries()).map(([id, name]) => ({ id, name }));

    return classList.map((cl) => {
      const row: any = { name: cl.name };
      for (const tk of selectedTerms) {
        const term = terms.find((x) => x.termKey === tk);
        const cls = term?.classes.find((x) => x.classId === cl.id);
        const subj = cls?.subjects.find((x) => x.subjectId === sid);
        row[tk] = subj ? subj.average : 0;
      }
      return row;
    });
  }, [terms, mode, selectedClass, selectedSubject, selectedTerms, classes, subjects]);

  if (!terms) return <p className="text-sm text-slate-500">Loading performance data…</p>;
  if (terms.length === 0) return <p className="text-sm text-slate-500">No performance data available.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Mode:</label>
          <div className="inline-flex rounded-md bg-white p-1">
            <button onClick={() => setMode("byClass")} className={`px-3 py-1 text-sm ${mode === "byClass" ? "bg-slate-100 font-semibold" : "text-slate-600"}`}>By class</button>
            <button onClick={() => setMode("bySubject")} className={`px-3 py-1 text-sm ${mode === "bySubject" ? "bg-slate-100 font-semibold" : "text-slate-600"}`}>By subject</button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {mode === "byClass" ? (
            <select className="rounded-md border px-2 py-1 text-sm" value={selectedClass ?? classes[0]?.id ?? ""} onChange={(e) => setSelectedClass(Number(e.target.value))}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <select className="rounded-md border px-2 py-1 text-sm" value={selectedSubject ?? subjects[0]?.id ?? ""} onChange={(e) => setSelectedSubject(Number(e.target.value))}>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Terms:</label>
            <div className="flex items-center gap-2 overflow-x-auto">
              {terms.map((t, idx) => (
                <label key={t.termKey} className="inline-flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={selectedTerms.includes(t.termKey)} onChange={(e) => setSelectedTerms((s) => e.target.checked ? [...s, t.termKey] : s.filter((x) => x !== t.termKey))} />
                  <span className="ml-1">{t.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md bg-white p-3">
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-500">Select a class/subject and at least one term to compare.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
                {selectedTerms.map((tk, i) => (
                  <Bar key={tk} dataKey={tk} fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
