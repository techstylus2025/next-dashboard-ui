"use client";

import Image from "next/image";
import { useState } from "react";

type AttendanceFiltersModalProps = {
  searchTerm: string;
  filterType: "all" | "student" | "teacher";
  filterStatus: "all" | "present" | "absent";
  sortKey: "date" | "person";
  sortDirection: "asc" | "desc";
  onSearchChange: (value: string) => void;
  onFilterTypeChange: (value: "all" | "student" | "teacher") => void;
  onFilterStatusChange: (value: "all" | "present" | "absent") => void;
  onSortKeyChange: (value: "date" | "person") => void;
  onSortDirectionChange: (value: "asc" | "desc") => void;
  onClear: () => void;
};

export default function AttendanceFiltersModal({
  searchTerm,
  filterType,
  filterStatus,
  sortKey,
  sortDirection,
  onSearchChange,
  onFilterTypeChange,
  onFilterStatusChange,
  onSortKeyChange,
  onSortDirectionChange,
  onClear,
}: AttendanceFiltersModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open attendance filters"
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
                  value={searchTerm}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search name, class, date, type"
                  className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "student", "teacher"] as const).map((typeOption) => (
                    <button
                      key={typeOption}
                      type="button"
                      onClick={() => onFilterTypeChange(typeOption)}
                      className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                        filterType === typeOption
                          ? "bg-sky-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {typeOption === "all" ? "All types" : typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "present", "absent"] as const).map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => onFilterStatusChange(statusOption)}
                      className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                        filterStatus === statusOption
                          ? "bg-sky-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {statusOption === "all" ? "All status" : statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Sort</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (sortKey === "date") {
                        onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");
                      } else {
                        onSortKeyChange("date");
                        onSortDirectionChange("desc");
                      }
                    }}
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                      sortKey === "date"
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    Date {sortKey === "date" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortKey === "person") {
                        onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");
                      } else {
                        onSortKeyChange("person");
                        onSortDirectionChange("asc");
                      }
                    }}
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                      sortKey === "person"
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    Name {sortKey === "person" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
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
