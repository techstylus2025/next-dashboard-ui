"use client";

import ClassReportButton, { type ClassReportData } from "@/components/ClassReportButton";
import FormContainer from "@/components/FormContainer";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, ChevronDown, GraduationCap, Users } from "lucide-react";

type ClassroomCardProps = {
  classItem: {
    id: number;
    name: string;
    capacity: number;
    gradeId: number;
    supervisorId: string | null;
    studentCount: number;
    gradeLabel: string;
    supervisorName: string;
    subjects: string[];
  };
  isAdmin: boolean;
  report?: ClassReportData;
};

const ClassroomCard = ({ classItem, isAdmin, report }: ClassroomCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const fill = classItem.capacity > 0
    ? Math.min(100, Math.round((classItem.studentCount / classItem.capacity) * 100))
    : 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-sky-200 hover:shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500" />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-50 to-indigo-100 text-lg font-bold text-indigo-700">
              {classItem.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-slate-900 sm:text-lg">{classItem.name}</span>
              <span className="block text-xs text-slate-500">{expanded ? "Hide classroom details" : "Show classroom details"}</span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {isAdmin ? (
            <div className="flex shrink-0 items-center gap-1">
              <FormContainer
                table="class"
                type="update"
                data={{
                  id: classItem.id,
                  name: classItem.name,
                  capacity: classItem.capacity,
                  gradeId: classItem.gradeId,
                  supervisorId: classItem.supervisorId,
                }}
              />
              <FormContainer table="class" type="delete" id={classItem.id} />
            </div>
          ) : null}
        </div>

        {expanded ? (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Students</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {classItem.studentCount}
                  <span className="ml-1 text-xs font-medium text-slate-400">/ {classItem.capacity || "—"}</span>
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Grading level · subjects</p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">{classItem.gradeLabel} · {classItem.subjects.length}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Capacity</span>
                <span className="font-semibold text-slate-700">{fill}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all" style={{ width: `${fill}%` }} />
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Class supervisor</p>
                <p className="mt-0.5 truncate text-sm font-medium text-slate-700">{classItem.supervisorName}</p>
              </div>
            </div>

            <div className="mt-4 flex min-h-8 flex-wrap gap-1.5">
              {classItem.subjects.length ? classItem.subjects.slice(0, 4).map((subject) => (
                <span key={subject} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                  <BookOpen className="h-3 w-3" aria-hidden="true" />{subject}
                </span>
              )) : <span className="text-xs text-slate-400">No subjects scheduled</span>}
              {classItem.subjects.length > 4 ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">+{classItem.subjects.length - 4}</span>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/list/students?classId=${classItem.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                View students
              </Link>
              {isAdmin && report ? <ClassReportButton report={report} /> : null}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default ClassroomCard;
