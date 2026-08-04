"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type ClassOption = {
  id: number;
  name: string;
};

type TeacherOption = {
  id: string;
  name: string;
  surname?: string | null;
};

type ExamFiltersModalProps = {
  classes: ClassOption[];
  teachers: TeacherOption[];
  initialSearch?: string;
  initialClassId?: string;
  initialTeacherId?: string;
  initialSortBy?: string;
  initialSortOrder?: "asc" | "desc";
};

export default function ExamFiltersModal({
  classes,
  teachers,
  initialSearch = "",
  initialClassId = "",
  initialTeacherId = "",
  initialSortBy = "date",
  initialSortOrder = "desc",
}: ExamFiltersModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [classId, setClassId] = useState(initialClassId);
  const [teacherId, setTeacherId] = useState(initialTeacherId);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);

  const applyFilters = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }

    if (classId) {
      params.set("classId", classId);
    } else {
      params.delete("classId");
    }

    if (teacherId) {
      params.set("teacherId", teacherId);
    } else {
      params.delete("teacherId");
    }

    if (sortBy) {
      params.set("sortBy", sortBy);
    } else {
      params.delete("sortBy");
    }

    if (sortOrder) {
      params.set("sortOrder", sortOrder);
    } else {
      params.delete("sortOrder");
    }

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.push(nextUrl);
    setOpen(false);
  };

  const clearFilters = () => {
    setSearch("");
    setClassId("");
    setTeacherId("");
    setSortBy("date");
    setSortOrder("desc");

    const params = new URLSearchParams(searchParams.toString());
    ["search", "classId", "teacherId", "sortBy", "sortOrder"].forEach((key) => {
      params.delete(key);
    });

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    setOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          aria-label="Open exam filters"
          className="icon-action w-8 h-8"
          onClick={() => setOpen(true)}
        >
          <Image src="/filter.svg" alt="" width={14} height={14} />
        </button>
        <button
          type="button"
          aria-label="Open exam sort options"
          className="icon-action w-8 h-8"
          onClick={() => setOpen(true)}
        >
          <Image src="/sort.svg" alt="" width={14} height={14} />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-2 sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Filters</h3>
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={(event) => applyFilters(event)}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Search</label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search subject"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Class</label>
                <select
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">All classes</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Teacher</label>
                <select
                  value={teacherId}
                  onChange={(event) => setTeacherId(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">All teachers</option>
                  {teachers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.surname ?? ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="date">Date</option>
                  <option value="subject">Subject</option>
                  <option value="class">Class</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Order</label>
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
