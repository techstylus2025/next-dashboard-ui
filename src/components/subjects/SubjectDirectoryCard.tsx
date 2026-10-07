"use client";

import FormContainer from "@/components/FormContainer";
import type { Class, Subject, Teacher } from "@prisma/client";
import { BookOpen, ChevronDown, GraduationCap, School, Users } from "lucide-react";
import { useState } from "react";

type SubjectVariant = Subject & {
  teachers: Pick<Teacher, "id" | "name" | "surname">[];
  grade: { level: string; label: string | null };
  classes: Pick<Class, "id" | "name">[];
  _count: { lessons: number };
};

const SubjectDirectoryCard = ({
  name,
  variants,
  isAdmin,
}: {
  name: string;
  variants: SubjectVariant[];
  isAdmin: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-amber-200 hover:shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-sky-500" />
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 text-amber-700">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold text-slate-900 sm:text-lg">{name}</span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {variants.length} grading level{variants.length === 1 ? "" : "s"}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4">
          {variants.map((subject) => (
            <section key={subject.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <GraduationCap className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden="true" />
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {subject.grade.label || subject.grade.level}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Teachers</span>
                    <span className="text-sm font-semibold tabular-nums text-slate-800">{subject.teachers.length}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Lessons</span>
                    <span className="text-sm font-semibold tabular-nums text-slate-800">{subject._count.lessons}</span>
                  </div>
                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <FormContainer table="subject" type="update" data={subject} />
                      <FormContainer table="subject" type="delete" id={subject.id} />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    Assigned teachers
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {subject.teachers.length ? subject.teachers.map((teacher) => (
                      <span key={teacher.id} className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
                        {teacher.name} {teacher.surname}
                      </span>
                    )) : <span className="text-xs text-slate-400">No teachers assigned</span>}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <School className="h-3.5 w-3.5" aria-hidden="true" />
                    Assigned classes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {subject.classes.length ? subject.classes.map((classItem) => (
                      <span key={classItem.id} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                        {classItem.name}
                      </span>
                    )) : <span className="text-xs text-slate-400">No classes assigned</span>}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </article>
  );
};

export default SubjectDirectoryCard;
