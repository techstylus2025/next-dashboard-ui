"use client";

import Image from "next/image";
import { useState } from "react";

type ResultsFiltersModalProps = {
  search: string;
  filterClass: string;
  filterYear: string;
  filterTerm: string;
  sortKey: string;
  sortDirection: "asc" | "desc";
  classes: Array<{ id: number; name: string }>;
  academicYears: Array<{ id: number; label: string }>;
  viewMode: "reports" | "class-progress";
  onSearchChange: (value: string) => void;
  onFilterClassChange: (value: string) => void;
  onFilterYearChange: (value: string) => void;
  onFilterTermChange: (value: string) => void;
  onSortKeyChange: (value: string) => void;
  onSortDirectionChange: (value: "asc" | "desc") => void;
  onClear: () => void;
};

export default function ResultsFiltersModal({
  search,
  filterClass,
  filterYear,
  filterTerm,
  sortKey,
  sortDirection,
  classes,
  academicYears,
  viewMode,
  onSearchChange,
  onFilterClassChange,
  onFilterYearChange,
  onFilterTermChange,
  onSortKeyChange,
  onSortDirectionChange,
  onClear,
}: ResultsFiltersModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-2.5 text-slate-600 shadow-sm md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open filters"
      >
        <Image src="/filter.svg" alt="" width={16} height={16} />
      </button>

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

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Search</label>
                <input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={viewMode === "class-progress" ? "Search class..." : "Search student..."}
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Class</label>
                <select
                  value={filterClass}
                  onChange={(event) => onFilterClassChange(event.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                <label className="text-xs font-medium text-slate-700">Year</label>
                <select
                  value={filterYear}
                  onChange={(event) => onFilterYearChange(event.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">All years</option>
                  {academicYears.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Term</label>
                <select
                  value={filterTerm}
                  onChange={(event) => onFilterTermChange(event.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">All terms</option>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                  <option value="4">Term 4</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Sort by</label>
                <select
                  value={sortKey}
                  onChange={(event) => onSortKeyChange(event.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {viewMode === "class-progress" ? (
                    <>
                      <option value="name">Class name</option>
                      <option value="students">Student count</option>
                      <option value="generated">Reports generated</option>
                      <option value="completion">Completion %</option>
                    </>
                  ) : (
                    <>
                      <option value="student">Student</option>
                      <option value="class">Class</option>
                      <option value="percentage">Completion %</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Order</label>
                <select
                  value={sortDirection}
                  onChange={(event) => onSortDirectionChange(event.target.value as "asc" | "desc")}
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
