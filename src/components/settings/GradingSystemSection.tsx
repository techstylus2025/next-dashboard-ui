"use client";

import {
  createGradingLevel,
  createGradingScaleEntry,
  deleteGradingLevel,
  deleteGradingScaleEntry,
  updateGradingLevel,
  updateGradingScaleEntry,
} from "@/lib/gradingActions";
import { GRADING_LEVEL_LABELS } from "@/lib/gradingUtils";
import type { GradingEntryRow, GradingLevelRow } from "@/lib/gradingData";
import type { GradingLevel } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";

const LEVELS: GradingLevel[] = [
  "CRECHE",
  "NURSERY",
  "KINDERGARTEN",
  "PRIMARY",
  "JHS",
];

type FormState = {
  minScore: string;
  maxScore: string;
  grade: string;
  remark: string;
};

const emptyForm = (): FormState => ({
  minScore: "",
  maxScore: "",
  grade: "",
  remark: "",
});

export default function GradingSystemSection({
  entries,
  levels,
}: {
  entries: GradingEntryRow[];
  levels: GradingLevelRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeLevel, setActiveLevel] = useState<GradingLevel>("CRECHE");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [levelForm, setLevelForm] = useState<{ level: GradingLevel; label: string }>({
    level: "CRECHE",
    label: "",
  });
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null);

  const levelEntries = useMemo(
    () => entries.filter((e) => e.level === activeLevel),
    [entries, activeLevel]
  );

  const resetForm = () => {
    setForm(emptyForm());
    setEditId(null);
  };

  const resetLevelForm = () => {
    setLevelForm({ level: "CRECHE", label: "" });
    setEditingLevelId(null);
  };

  const handleSubmit = () => {
    const minScore = parseInt(form.minScore, 10);
    const maxScore = parseInt(form.maxScore, 10);
    if (Number.isNaN(minScore) || Number.isNaN(maxScore)) {
      toast.error("Enter a valid score range.");
      return;
    }

    startTransition(async () => {
      const res = editId
        ? await updateGradingScaleEntry({
            id: editId,
            minScore,
            maxScore,
            grade: form.grade,
            remark: form.remark,
          })
        : await createGradingScaleEntry({
            level: activeLevel,
            minScore,
            maxScore,
            grade: form.grade,
            remark: form.remark,
          });

      if (res.success) {
        toast.success(editId ? "Entry updated." : "Entry added.");
        resetForm();
        router.refresh();
      } else {
        toast.error(res.error || "Save failed.");
      }
    });
  };

  const startEdit = (row: GradingEntryRow) => {
    setEditId(row.id);
    setForm({
      minScore: String(row.minScore),
      maxScore: String(row.maxScore),
      grade: row.grade,
      remark: row.remark,
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this grading entry?")) return;
    startTransition(async () => {
      const res = await deleteGradingScaleEntry(id);
      if (res.success) {
        toast.success("Entry deleted.");
        if (editId === id) resetForm();
        router.refresh();
      } else {
        toast.error(res.error || "Delete failed.");
      }
    });
  };

  const handleLevelSubmit = () => {
    startTransition(async () => {
      const payload = {
        level: levelForm.level,
        label: levelForm.label.trim() || undefined,
      };

      const res = editingLevelId
        ? await updateGradingLevel({ id: editingLevelId, label: levelForm.label.trim() })
        : await createGradingLevel(payload);

      if (res.success) {
        toast.success(editingLevelId ? "Grading level updated." : "Grading level added.");
        resetLevelForm();
        router.refresh();
      } else {
        toast.error(res.error || "Save failed.");
      }
    });
  };

  const startLevelEdit = (row: GradingLevelRow) => {
    setEditingLevelId(row.id);
    setLevelForm({
      level: row.level,
      label: row.label ?? GRADING_LEVEL_LABELS[row.level],
    });
  };

  const handleLevelDelete = (id: number) => {
    if (!confirm("Delete this grading level?")) return;

    startTransition(async () => {
      const res = await deleteGradingLevel(id);
      if (res.success) {
        toast.success("Grading level deleted.");
        if (editingLevelId === id) resetLevelForm();
        router.refresh();
      } else {
        toast.error(res.error || "Delete failed.");
      }
    });
  };

  return (
    <section className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-sm p-5 md:p-6 shadow-sm ring-1 ring-slate-200/80">
      <h2 className="text-lg font-medium text-slate-800 mb-2">Grading system</h2>
      <p className="text-sm text-slate-500 mb-4">
        Define score ranges, grades, and remarks for each school level. Used when
        computing termly report grades.
      </p>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-3">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => {
              setActiveLevel(level);
              resetForm();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeLevel === level
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {GRADING_LEVEL_LABELS[level]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Grading levels</h3>
            <p className="text-sm text-slate-500">Manage the levels available when creating classes.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.1fr,1.2fr,auto]">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">Level</span>
            <select
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={levelForm.level}
              onChange={(e) => setLevelForm((f) => ({ ...f, level: e.target.value as GradingLevel }))}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {GRADING_LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">Display name</span>
            <input
              className="rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Optional custom label"
              value={levelForm.label}
              onChange={(e) => setLevelForm((f) => ({ ...f, label: e.target.value }))}
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={handleLevelSubmit}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {editingLevelId ? "Update" : "Add"}
            </button>
            {editingLevelId ? (
              <button
                type="button"
                onClick={resetLevelForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium text-left">Level</th>
                <th className="px-4 py-3 font-medium text-left">Display name</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{GRADING_LEVEL_LABELS[row.level]}</td>
                  <td className="px-4 py-3">{row.label ?? GRADING_LEVEL_LABELS[row.level]}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => startLevelEdit(row)} className="mr-3 text-sky-600 hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleLevelDelete(row.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Min score (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            className="rounded-lg border border-slate-200 px-3 py-2"
            value={form.minScore}
            onChange={(e) => setForm((f) => ({ ...f, minScore: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Max score (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            className="rounded-lg border border-slate-200 px-3 py-2"
            value={form.maxScore}
            onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Grade</span>
          <input
            className="rounded-lg border border-slate-200 px-3 py-2"
            placeholder="e.g. A"
            value={form.grade}
            onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Remarks</span>
          <input
            className="rounded-lg border border-slate-200 px-3 py-2"
            placeholder="e.g. Excellent"
            value={form.remark}
            onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
          />
        </label>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          disabled={pending}
          onClick={handleSubmit}
          className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {editId ? "Update entry" : "Add entry"}
        </button>
        {editId && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
          >
            Cancel edit
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Score range</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Remarks</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {levelEntries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No entries for {GRADING_LEVEL_LABELS[activeLevel]} yet.
                </td>
              </tr>
            ) : (
              levelEntries.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {row.minScore}% – {row.maxScore}%
                  </td>
                  <td className="px-4 py-3 font-medium">{row.grade}</td>
                  <td className="px-4 py-3">{row.remark}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="text-sky-600 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(row.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
