"use client";

import ParentRowActions from "@/components/parents/ParentRowActions";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Eye, Mail, MapPin, Phone, Users } from "lucide-react";

type ParentDirectoryCardProps = {
  parent: {
    id: string;
    name: string;
    surname: string;
    username: string;
    email: string | null;
    occupation: string | null;
    phone: string;
    address: string;
    students: {
      id: string;
      name: string;
      surname: string;
      class: { name: string } | null;
    }[];
  };
  isAdmin: boolean;
};

const ParentDirectoryCard = ({ parent, isAdmin }: ParentDirectoryCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-rose-200 hover:shadow-lg">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500" />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100 text-lg font-bold text-rose-700">
              {parent.name.charAt(0).toUpperCase()}{parent.surname.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-slate-900 sm:text-lg">
                {parent.name} {parent.surname}
              </span>
              <span className="block truncate text-xs text-slate-500">@{parent.username}</span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {isAdmin ? (
            <div className="flex shrink-0 items-center gap-1">
              <ParentRowActions
                parent={{
                  ...parent,
                  email: parent.email ?? undefined,
                  occupation: parent.occupation ?? undefined,
                }}
              />
            </div>
          ) : null}
        </div>

        {expanded ? (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-slate-700">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <a href={`tel:${parent.phone}`} className="truncate hover:text-sky-700">{parent.phone}</a>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-700">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {parent.email ? (
                  <a href={`mailto:${parent.email}`} className="truncate hover:text-sky-700">{parent.email}</a>
                ) : <span className="text-slate-400">No email provided</span>}
              </div>
              <div className="flex items-start gap-2.5 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="line-clamp-2">{parent.address}</span>
              </div>
              {parent.occupation ? (
                <p className="pl-[26px] text-xs text-slate-500">Occupation: {parent.occupation}</p>
              ) : null}
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Users className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  Linked students
                </div>
                <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                  {parent.students.length}
                </span>
              </div>
              {parent.students.length > 0 ? (
                <ul className="mt-2.5 divide-y divide-slate-200">
                  {parent.students.map((student) => (
                    <li key={student.id} className="flex min-w-0 items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-700">{student.name} {student.surname}</p>
                        <p className="truncate text-[11px] text-slate-400">{student.class?.name ?? "No class assigned"}</p>
                      </div>
                      <Link
                        href={`/list/students/${student.id}`}
                        aria-label={`View ${student.name} ${student.surname}`}
                        title={`View ${student.name} ${student.surname}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-sky-50 hover:ring-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500">No active students linked</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default ParentDirectoryCard;
