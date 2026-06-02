"use client";

import {
  deleteTermlyReport,
  updateTermlyReportMeta,
  upsertTermlySubjectLine,
} from "@/lib/termlyReportActions";
import type { TermlyReportRow } from "@/lib/resultsData";
import { formatReportDate } from "./TermReportView";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";

export default function ReportEditorCard({
  report,
  canManageMeta,
  canDelete,
  onPreview,
}: {
  report: TermlyReportRow;
  canManageMeta: boolean;
  canDelete: boolean;
  onPreview: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [meta, setMeta] = useState({
    positionOnRoll: report.positionOnRoll?.toString() ?? "",
    totalOnRoll: String(report.totalOnRoll),
    totalAttendance: String(report.totalAttendance),
    vacationDate: report.vacationDate?.slice(0, 10) ?? "",
    reopeningDate: report.reopeningDate?.slice(0, 10) ?? "",
    interest: report.interest ?? "",
    conduct: report.conduct ?? "",
    resultStatus: report.resultStatus ?? "",
    supervisorRemarks: report.supervisorRemarks ?? "",
    supervisorSignature: report.supervisorSignature ?? "",
    headteacherRemarks: report.headteacherRemarks ?? "",
    headteacherSignature: report.headteacherSignature ?? "",
  });

  const [scores, setScores] = useState<
    Record<number, { classScore: string; examScore: string }>
  >(() => {
    const init: Record<number, { classScore: string; examScore: string }> = {};
    for (const line of report.subjectLines) {
      init[line.subjectId] = {
        classScore: String(line.classScore),
        examScore: String(line.examScore),
      };
    }
    return init;
  });

  const refresh = () => router.refresh();

  const saveMeta = () => {
    startTransition(async () => {
      const res = await updateTermlyReportMeta({
        reportId: report.id,
        positionOnRoll: meta.positionOnRoll
          ? parseInt(meta.positionOnRoll, 10)
          : null,
        totalOnRoll: parseInt(meta.totalOnRoll, 10) || report.totalOnRoll,
        totalAttendance:
          parseInt(meta.totalAttendance, 10) || report.totalAttendance,
        vacationDate: meta.vacationDate || null,
        reopeningDate: meta.reopeningDate || null,
        interest: meta.interest || null,
        conduct: meta.conduct || null,
        resultStatus: meta.resultStatus || null,
        supervisorRemarks: meta.supervisorRemarks || null,
        supervisorSignature: meta.supervisorSignature || null,
        headteacherRemarks: meta.headteacherRemarks || null,
        headteacherSignature: meta.headteacherSignature || null,
      });
      if (res.success) {
        toast.success("Report details saved.");
        refresh();
      } else {
        toast.error(res.error || "Save failed.");
      }
    });
  };

  const saveSubjectLine = (subjectId: number) => {
    const s = scores[subjectId];
    if (!s) return;
    startTransition(async () => {
      const res = await upsertTermlySubjectLine({
        reportId: report.id,
        subjectId,
        classScore: parseFloat(s.classScore) || 0,
        examScore: parseFloat(s.examScore) || 0,
      });
      if (res.success) {
        toast.success("Scores saved.");
        refresh();
      } else {
        toast.error(res.error || "Could not save scores.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete report for ${report.studentName}?`)) return;
    startTransition(async () => {
      const res = await deleteTermlyReport(report.id);
      if (res.success) {
        toast.success("Report deleted.");
        refresh();
      } else {
        toast.error(res.error || "Delete failed.");
      }
    });
  };

  const hasEditableSubjects = report.subjectLines.some((l) => l.canEdit);
  const canEditAnything = canManageMeta || hasEditableSubjects;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          className="flex-1 text-left min-w-0"
          onClick={() => setExpanded(!expanded)}
        >
          <h3 className="font-semibold text-slate-800 truncate">
            {report.studentName}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {report.className} · {report.academicYearLabel} · Term{" "}
            {report.termNumber}
            {report.overallGrade && (
              <span className="ml-1 font-medium text-sky-700">
                · {report.overallGrade}
                {report.overallPercentage != null &&
                  ` (${report.overallPercentage}%)`}
              </span>
            )}
          </p>
        </button>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={onPreview}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
          >
            {expanded ? "Collapse" : canEditAnything ? "Edit" : "Details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-5 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <span>
              <span className="text-slate-500">No. On Roll: </span>
              {report.totalOnRoll}
            </span>
            <span>
              <span className="text-slate-500">Attendance: </span>
              {report.totalAttendance}
            </span>
            <span>
              <span className="text-slate-500">Vacation: </span>
              {formatReportDate(report.vacationDate)}
            </span>
            <span>
              <span className="text-slate-500">Reopening: </span>
              {formatReportDate(report.reopeningDate)}
            </span>
          </div>

          {/* Mobile: card layout */}
          <div className="md:hidden space-y-3">
            {report.subjectLines.map((line) => (
              <div
                key={line.id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
              >
                <p className="font-medium text-sm text-slate-800 mb-2">
                  {line.subjectName}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex flex-col gap-1">
                    Class score
                    {line.canEdit ? (
                      <input
                        type="number"
                        min={0}
                        className="rounded border border-slate-200 px-2 py-1.5"
                        value={
                          scores[line.subjectId]?.classScore ??
                          String(line.classScore)
                        }
                        onChange={(e) =>
                          setScores((prev) => ({
                            ...prev,
                            [line.subjectId]: {
                              classScore: e.target.value,
                              examScore:
                                prev[line.subjectId]?.examScore ??
                                String(line.examScore),
                            },
                          }))
                        }
                      />
                    ) : (
                      <span className="py-1">{line.classScore}</span>
                    )}
                  </label>
                  <label className="flex flex-col gap-1">
                    Exam score
                    {line.canEdit ? (
                      <input
                        type="number"
                        min={0}
                        className="rounded border border-slate-200 px-2 py-1.5"
                        value={
                          scores[line.subjectId]?.examScore ??
                          String(line.examScore)
                        }
                        onChange={(e) =>
                          setScores((prev) => ({
                            ...prev,
                            [line.subjectId]: {
                              classScore:
                                prev[line.subjectId]?.classScore ??
                                String(line.classScore),
                              examScore: e.target.value,
                            },
                          }))
                        }
                      />
                    ) : (
                      <span className="py-1">{line.examScore}</span>
                    )}
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Total {line.totalMarks} · {line.grade ?? "—"} ·{" "}
                  {line.remark ?? "—"}
                </p>
                {line.canEdit && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => saveSubjectLine(line.subjectId)}
                    className="mt-2 w-full rounded-lg bg-sky-600 py-1.5 text-xs text-white disabled:opacity-50"
                  >
                    Save scores
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[600px] text-sm border border-slate-100 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Subject</th>
                  <th className="px-3 py-2 text-left">Class</th>
                  <th className="px-3 py-2 text-left">Exam</th>
                  <th className="px-3 py-2 text-left">Total</th>
                  <th className="px-3 py-2 text-left">Grade</th>
                  <th className="px-3 py-2 text-left">Remark</th>
                  {hasEditableSubjects && (
                    <th className="px-3 py-2 text-right">Save</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {report.subjectLines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium">{line.subjectName}</td>
                    <td className="px-3 py-2">
                      {line.canEdit ? (
                        <input
                          type="number"
                          min={0}
                          className="w-20 rounded border border-slate-200 px-2 py-1"
                          value={
                            scores[line.subjectId]?.classScore ??
                            String(line.classScore)
                          }
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [line.subjectId]: {
                                classScore: e.target.value,
                                examScore:
                                  prev[line.subjectId]?.examScore ??
                                  String(line.examScore),
                              },
                            }))
                          }
                        />
                      ) : (
                        line.classScore
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {line.canEdit ? (
                        <input
                          type="number"
                          min={0}
                          className="w-20 rounded border border-slate-200 px-2 py-1"
                          value={
                            scores[line.subjectId]?.examScore ??
                            String(line.examScore)
                          }
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [line.subjectId]: {
                                classScore:
                                  prev[line.subjectId]?.classScore ??
                                  String(line.classScore),
                                examScore: e.target.value,
                              },
                            }))
                          }
                        />
                      ) : (
                        line.examScore
                      )}
                    </td>
                    <td className="px-3 py-2">{line.totalMarks}</td>
                    <td className="px-3 py-2">{line.grade ?? "—"}</td>
                    <td className="px-3 py-2">{line.remark ?? "—"}</td>
                    {line.canEdit && (
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => saveSubjectLine(line.subjectId)}
                          className="text-sky-600 hover:underline text-xs"
                        >
                          Save
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canManageMeta && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-sm font-medium text-slate-700">
                Report details
              </h4>
              <p className="text-xs text-slate-500">
                Reopening date is set from the next term in the active academic
                year when reports are generated. You can override it here.
              </p>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <label className="flex flex-col gap-1">
                  Position on roll
                  <input
                    type="number"
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    value={meta.positionOnRoll}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, positionOnRoll: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Total on roll
                  <input
                    type="number"
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    value={meta.totalOnRoll}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, totalOnRoll: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Total attendance
                  <input
                    type="number"
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    value={meta.totalAttendance}
                    onChange={(e) =>
                      setMeta((m) => ({
                        ...m,
                        totalAttendance: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Vacation date
                  <input
                    type="date"
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    value={meta.vacationDate}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, vacationDate: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Reopening date
                  <input
                    type="date"
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    value={meta.reopeningDate}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, reopeningDate: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Interest
                  <input
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    value={meta.interest}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, interest: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Conduct
                  <input
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    value={meta.conduct}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, conduct: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Result
                  <input
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    placeholder="Pass / Promoted"
                    value={meta.resultStatus}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, resultStatus: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 sm:col-span-2">
                  Class supervisor remarks
                  <textarea
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    rows={2}
                    value={meta.supervisorRemarks}
                    onChange={(e) =>
                      setMeta((m) => ({
                        ...m,
                        supervisorRemarks: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Supervisor signature
                  <input
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    value={meta.supervisorSignature}
                    onChange={(e) =>
                      setMeta((m) => ({
                        ...m,
                        supervisorSignature: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 sm:col-span-2">
                  Headteacher remarks
                  <textarea
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    rows={2}
                    value={meta.headteacherRemarks}
                    onChange={(e) =>
                      setMeta((m) => ({
                        ...m,
                        headteacherRemarks: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Headteacher signature
                  <input
                    className="rounded-lg border border-slate-200 px-2 py-2 w-full"
                    value={meta.headteacherSignature}
                    onChange={(e) =>
                      setMeta((m) => ({
                        ...m,
                        headteacherSignature: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={saveMeta}
                className="w-full sm:w-auto rounded-lg bg-sky-600 px-4 py-2.5 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Save report details
              </button>
            </div>
          )}

          {canDelete && (
            <button
              type="button"
              disabled={pending}
              onClick={handleDelete}
              className="text-red-600 text-sm hover:underline"
            >
              Delete report
            </button>
          )}
        </div>
      )}
    </div>
  );
}
