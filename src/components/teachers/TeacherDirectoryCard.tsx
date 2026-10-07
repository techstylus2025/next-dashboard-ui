"use client";

import Avatar from "@/components/Avatar";
import FormContainer from "@/components/FormContainer";
import type { Class, Subject, Teacher } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Eye,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  School,
} from "lucide-react";

type TeacherDirectoryRecord = Teacher & {
  subjects: Subject[];
  classes: Class[];
  assignedClasses: Class[];
};

const TeacherDirectoryCard = ({
  teacher,
  isAdmin,
}: {
  teacher: TeacherDirectoryRecord;
  isAdmin: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const teachingClasses = [...new Map(
    [...teacher.assignedClasses, ...teacher.classes].map((classItem) => [classItem.id, classItem])
  ).values()];
  const displayName = `${teacher.name} ${teacher.surname}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-violet-200 hover:shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500" />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <Avatar
              src={teacher.img}
              name={displayName}
              alt={displayName}
              size={48}
              className="h-12 w-12 shrink-0 rounded-2xl"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-slate-900 sm:text-lg">{displayName}</span>
              <span className="block truncate text-xs text-slate-500">@{teacher.username}</span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/list/teachers/${teacher.id}`}
              aria-label={`View ${displayName}`}
              title="View teacher profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Link>
            {isAdmin ? (
              <>
                <FormContainer table="teacher" type="update" data={teacher} />
                <FormContainer table="teacher" type="delete" id={teacher.id} />
              </>
            ) : null}
          </div>
        </div>

        {expanded ? (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-slate-700">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {teacher.email ? (
                  <a href={`mailto:${teacher.email}`} className="truncate hover:text-sky-700">{teacher.email}</a>
                ) : <span className="text-slate-400">No email provided</span>}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-700">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {teacher.phone ? (
                  <a href={`tel:${teacher.phone}`} className="truncate hover:text-sky-700">{teacher.phone}</a>
                ) : <span className="text-slate-400">No phone provided</span>}
              </div>
              <div className="flex items-start gap-2.5 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="line-clamp-2">{teacher.address || "No address recorded"}</span>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Subject assignments
              </p>
              <div className="flex min-h-7 flex-wrap gap-1.5">
                {teacher.subjects.length ? teacher.subjects.map((subject) => (
                  <span key={subject.id} className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">{subject.name}</span>
                )) : <span className="text-xs text-slate-400">No subjects assigned</span>}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <School className="h-3.5 w-3.5" aria-hidden="true" />
                Teaching / assigned classes
              </p>
              <div className="flex min-h-7 flex-wrap gap-1.5">
                {teachingClasses.length ? teachingClasses.map((classItem) => (
                  <span key={classItem.id} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">{classItem.name}</span>
                )) : <span className="text-xs text-slate-400">No classes assigned</span>}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                Class supervisor
              </p>
              {teacher.classes.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {teacher.classes.map((classItem) => (
                    <span key={classItem.id} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200">
                      {classItem.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-800/70">No class supervisor assignment</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default TeacherDirectoryCard;
