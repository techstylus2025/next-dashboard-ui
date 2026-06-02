"use client";

import {
  generateTermlyReportsBulk,
  generateTermlyReportsForSupervisorClass,
  generateTermlyReportForSingleStudent,
} from "@/lib/termlyReportActions";
import type { ResultsPageContext, TermlyReportRow } from "@/lib/resultsData";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import ReportEditorCard from "./ReportEditorCard";
import ReportPreviewModal from "./ReportPreviewModal";
import { ITEM_PER_PAGE } from "@/lib/settings";

type SortKey =
  | "name"
  | "completion"
  | "students"
  | "generated"
  | "student"
  | "class"
  | "percentage";

function TermSelect({
  yearId,
  academicYears,
  value,
  onChange,
}: {
  yearId: string;
  academicYears: ResultsPageContext["academicYears"];
  value: string;
  onChange: (v: string) => void;
}) {
  const year = academicYears.find((y) => String(y.id) === yearId);
  return (
    <select
      className="rounded-lg border border-slate-300 px-3 py-2.5 w-full text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {year?.terms.map((t) => (
        <option key={t.termNumber} value={t.termNumber}>
          Term {t.termNumber}
        </option>
      )) ?? (
        <>
          <option value="1">Term 1</option>
          <option value="2">Term 2</option>
          <option value="3">Term 3</option>
        </>
      )}
    </select>
  );
}

export default function ResultsManagement(ctx: ResultsPageContext) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"reports" | "generate">(
    ctx.canManageReports ? "generate" : "reports"
  );

  const [genClassId, setGenClassId] = useState(
    ctx.classes[0]?.id ? String(ctx.classes[0].id) : ""
  );
  const [genYearId, setGenYearId] = useState(
    ctx.activeYearId ? String(ctx.activeYearId) : ""
  );
  const [genTerm, setGenTerm] = useState("1");
  const [genStudentId, setGenStudentId] = useState("");
  const [supervisorClassId, setSupervisorClassId] = useState(
    ctx.supervisedClasses[0]?.id ? String(ctx.supervisedClasses[0].id) : ""
  );

  const [filterClass, setFilterClass] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>(
    ctx.isAdmin ? "name" : "student"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"reports" | "class-progress">
    (ctx.isAdmin ? "class-progress" : "reports");
  const [previewReport, setPreviewReport] = useState<TermlyReportRow | null>(
    null
  );
  const [classStudents, setClassStudents] = useState<
    Array<{ id: string; name: string; surname: string }>
  >([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const activeYearLabel = useMemo(() => {
    const y = ctx.academicYears.find((a) => a.id === ctx.activeYearId);
    return y?.label ?? "active academic year";
  }, [ctx.academicYears, ctx.activeYearId]);

  const shouldGroupRecords = ctx.role === "student" || ctx.role === "parent";

  const filteredReports = useMemo(() => {
    return ctx.reports.filter((r) => {
      if (filterClass && String(r.classId) !== filterClass) return false;
      if (filterYear && String(r.academicYearId) !== filterYear) return false;
      if (filterTerm && String(r.termNumber) !== filterTerm) return false;
      if (
        search &&
        !r.studentName.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [ctx.reports, filterClass, filterYear, filterTerm, search]);

  const groupedReports = useMemo(() => {
    if (!shouldGroupRecords) return [];

    const years = new Map<
      string,
      Map<string, Map<number, TermlyReportRow[]>>
    >();

    for (const report of filteredReports) {
      const yearGroup = years.get(report.academicYearLabel) ?? new Map();
      years.set(report.academicYearLabel, yearGroup);

      const classGroup = yearGroup.get(report.className) ?? new Map();
      yearGroup.set(report.className, classGroup);

      const termGroup = classGroup.get(report.termNumber) ?? [];
      classGroup.set(report.termNumber, termGroup);

      termGroup.push(report);
    }

    return Array.from(years.entries())
      .map(([academicYearLabel, classMap]) => ({
        academicYearLabel,
        classes: Array.from(classMap.entries())
          .map(([className, termMap]) => ({
            className,
            terms: Array.from(termMap.entries())
              .map(([termNumber, reports]) => ({
                termNumber,
                reports,
              }))
              .sort((a, b) => a.termNumber - b.termNumber),
          }))
          .sort((a, b) => a.className.localeCompare(b.className)),
      }))
      .sort((a, b) => b.academicYearLabel.localeCompare(a.academicYearLabel));
  }, [filteredReports, shouldGroupRecords]);

  const classProgressItems = useMemo(() => {
    return ctx.classes
      .filter((cls) => {
        if (search && !cls.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        if (filterClass && String(cls.id) !== filterClass) return false;
        return true;
      })
      .map((cls) => {
        const relevantReports = ctx.reports.filter((report) => {
          if (report.classId !== cls.id) return false;
          if (filterYear && String(report.academicYearId) !== filterYear)
            return false;
          if (filterTerm && String(report.termNumber) !== filterTerm)
            return false;
          return true;
        });
        const generated = relevantReports.length;
        const totalStudents = cls.studentCount || 0;
        const completion = totalStudents
          ? Math.round((generated / totalStudents) * 100)
          : 0;
        return {
          classId: cls.id,
          className: cls.name,
          totalStudents,
          generated,
          completion,
        };
      });
  }, [ctx.classes, ctx.reports, search, filterClass, filterYear, filterTerm]);

  const sortedReports = useMemo(() => {
    const sorted = [...filteredReports];
    if (sortKey === "student") {
      sorted.sort((a, b) => a.studentName.localeCompare(b.studentName));
    } else if (sortKey === "class") {
      sorted.sort((a, b) => a.className.localeCompare(b.className));
    } else if (sortKey === "percentage") {
      sorted.sort((a, b) => {
        const aVal = a.overallPercentage ?? 0;
        const bVal = b.overallPercentage ?? 0;
        return aVal - bVal;
      });
    }
    if (sortDirection === "desc") sorted.reverse();
    return sorted;
  }, [filteredReports, sortKey, sortDirection]);

  const sortedClassProgress = useMemo(() => {
    const sorted = [...classProgressItems];
    if (sortKey === "students") {
      sorted.sort((a, b) => a.totalStudents - b.totalStudents);
    } else if (sortKey === "generated") {
      sorted.sort((a, b) => a.generated - b.generated);
    } else if (sortKey === "completion") {
      sorted.sort((a, b) => a.completion - b.completion);
    } else {
      sorted.sort((a, b) => a.className.localeCompare(b.className));
    }
    if (sortDirection === "desc") sorted.reverse();
    return sorted;
  }, [classProgressItems, sortKey, sortDirection]);

  const paginatedReports = useMemo(() => {
    return sortedReports.slice(
      (page - 1) * ITEM_PER_PAGE,
      page * ITEM_PER_PAGE
    );
  }, [sortedReports, page]);

  const paginatedClassProgress = useMemo(() => {
    return sortedClassProgress.slice(
      (page - 1) * ITEM_PER_PAGE,
      page * ITEM_PER_PAGE
    );
  }, [sortedClassProgress, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filterClass, filterYear, filterTerm, sortKey, sortDirection, viewMode]);

  useEffect(() => {
    // Fetch students for the selected class
    if (genClassId && ctx.isAdmin) {
      setLoadingStudents(true);
      setGenStudentId(""); // Reset student selection when class changes
      
      // Get students from the reports and class info
      const students = ctx.reports
        .filter(r => String(r.classId) === genClassId)
        .map(r => ({
          id: r.studentId,
          name: r.studentName.split(" ").slice(0, -1).join(" "),
          surname: r.studentName.split(" ").pop() || "",
        }))
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
        .sort((a, b) => a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name));
      
      setClassStudents(students);
      setLoadingStudents(false);
    }
  }, [genClassId, ctx.isAdmin, ctx.reports]);

  const refresh = () => router.refresh();

  const parseGenParams = () => {
    const termNumber = parseInt(genTerm, 10);
    const academicYearId = genYearId ? parseInt(genYearId, 10) : undefined;
    if (!termNumber) return null;
    return { termNumber, academicYearId };
  };

  const handleGenerateAll = () => {
    const params = parseGenParams();
    if (!params) {
      toast.error("Select term and academic year.");
      return;
    }
    if (
      !confirm(
        `Generate termly reports for ALL students in ALL classes for Term ${params.termNumber}?`
      )
    ) {
      return;
    }
    startTransition(() => {
      void (async () => {
        const res = await generateTermlyReportsBulk({
          scope: "all",
          termNumber: params.termNumber,
          academicYearId: params.academicYearId,
        });
        if (res.success) {
          toast.success(
            `Created ${res.created ?? 0} report(s) across ${res.classesProcessed ?? 0} class(es).`
          );
          refresh();
          setTab("reports");
        } else {
          toast.error(res.error || "Bulk generation failed.");
        }
      })();
    });
  };

  const handleGenerateAdminClass = () => {
    const params = parseGenParams();
    const classId = parseInt(genClassId, 10);
    if (!params || !classId) {
      toast.error("Select class and term.");
      return;
    }
    startTransition(() => {
      void (async () => {
        const res = await generateTermlyReportsBulk({
          scope: "class",
          classId,
          termNumber: params.termNumber,
          academicYearId: params.academicYearId,
        });
        if (res.success) {
          toast.success(
            res.created
              ? `Created ${res.created} report(s) for the selected class.`
              : "Reports already exist; dates were synced from the academic calendar."
          );
          refresh();
          setTab("reports");
        } else {
          toast.error(res.error || "Generation failed.");
        }
      })();
    });
  };

  const handleSupervisorGenerateClass = () => {
    const params = parseGenParams();
    const classId = parseInt(supervisorClassId, 10);
    if (!params || !classId) {
      toast.error("Select your class and term.");
      return;
    }
    startTransition(() => {
      void (async () => {
        const res = await generateTermlyReportsForSupervisorClass({
          classId,
          termNumber: params.termNumber,
          academicYearId: params.academicYearId,
        });
        if (res.success) {
          toast.success(
            res.created
              ? `Created ${res.created} report(s) for your class.`
              : "All students already have reports; dates were updated."
          );
          refresh();
          setTab("reports");
        } else {
          toast.error(res.error || "Generation failed.");
        }
      })();
    });
  };

  const handleGenerateSingleStudent = () => {
    const params = parseGenParams();
    const classId = parseInt(genClassId, 10);
    if (!params || !classId || !genStudentId) {
      toast.error("Select class, student, and term.");
      return;
    }
    startTransition(() => {
      void (async () => {
        const res = await generateTermlyReportForSingleStudent({
          studentId: genStudentId,
          classId,
          termNumber: params.termNumber,
          academicYearId: params.academicYearId,
        });
        if (res.success) {
          if (res.alreadyExists) {
            toast.info("Report already exists for this student.");
          } else {
            toast.success("Report created successfully for the student.");
          }
          refresh();
          setTab("reports");
        } else {
          toast.error(res.error || "Generation failed.");
        }
      })();
    });
  };

  const canManageMetaForReport = (report: TermlyReportRow) =>
    ctx.isAdmin || ctx.supervisedClassIds.includes(report.classId);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Results & Reports
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Manage termly report cards with preview and PDF export capabilities. Vacation and reopening
              dates are taken from the active academic year calendar.
            </p>
          </div>
          {ctx.isAdmin && tab === "reports" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setViewMode("reports")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === "reports"
                    ? "bg-sky-100 text-sky-700 shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Student progress
              </button>
              <button
                type="button"
                onClick={() => setViewMode("class-progress")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  viewMode === "class-progress"
                    ? "bg-sky-100 text-sky-700 shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Class progress
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {(ctx.canManageReports || ctx.canRecordScores) && (
        <div className="flex gap-1 border-b-2 border-slate-200 overflow-x-auto">
          {ctx.canManageReports && (
            <button
              type="button"
              onClick={() => setTab("generate")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === "generate"
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Generate
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab("reports")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === "reports"
                ? "border-sky-600 text-sky-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Reports
          </button>
        </div>
      )}

      {tab === "generate" && ctx.canManageReports && (
        <section className="rounded-2xl border border-white/60 bg-white/95 p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/80 space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Generate termly reports
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Uses <strong>{activeYearLabel}</strong> when no year is selected.
              Reopening date = start of the next term in that year.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Academic year</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={genYearId}
                onChange={(e) => setGenYearId(e.target.value)}
              >
                <option value="">Active year ({activeYearLabel})</option>
                {ctx.academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                    {y.id === ctx.activeYearId ? " (active)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Term</span>
              <TermSelect
                yearId={genYearId || String(ctx.activeYearId ?? "")}
                academicYears={ctx.academicYears}
                value={genTerm}
                onChange={setGenTerm}
              />
            </label>
            {ctx.isAdmin && (
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Class</span>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={genClassId}
                  onChange={(e) => setGenClassId(e.target.value)}
                >
                  <option value="">Select class</option>
                  {ctx.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {ctx.isAdmin && (
            <>
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Generation options
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={handleGenerateAll}
                      className="w-full rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50 hover:shadow-lg transition-shadow"
                    >
                      Generate for all students (all classes)
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={pending || !genClassId}
                      onClick={handleGenerateAdminClass}
                      className="w-full rounded-lg bg-gradient-to-r from-sky-600 to-sky-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-50 hover:shadow-lg transition-shadow"
                    >
                      Generate for all students in selected class
                    </button>
                  </div>
                </div>
              </div>

              {genClassId && classStudents.length > 0 && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">
                    Or generate for a single student
                  </h3>
                  <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-2 text-sm">
                      <span className="font-medium text-slate-700">Student</span>
                      <select
                        className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        value={genStudentId}
                        onChange={(e) => setGenStudentId(e.target.value)}
                        disabled={loadingStudents}
                      >
                        <option value="">Select a student</option>
                        {classStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.surname} {student.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={pending || !genStudentId}
                      onClick={handleGenerateSingleStudent}
                      className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-800 px-4 py-3 text-sm font-medium text-white disabled:opacity-50 hover:shadow-lg transition-shadow"
                    >
                      Generate report for this student
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {ctx.isSupervisor && !ctx.isAdmin && (
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-sky-900">
                Class supervisor
              </h3>
              <label className="flex flex-col gap-1 text-sm max-w-md">
                Your class
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 bg-white"
                  value={supervisorClassId}
                  onChange={(e) => setSupervisorClassId(e.target.value)}
                >
                  {ctx.supervisedClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={pending || !supervisorClassId}
                onClick={handleSupervisorGenerateClass}
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-sky-600 to-sky-800 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Generate reports for all students in my class
              </button>
            </div>
          )}
        </section>
      )}

      {(tab === "reports" || !ctx.canManageReports) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Filter section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Filters & search
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Search</label>
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder={
                    ctx.isAdmin && viewMode === "class-progress"
                      ? "Search class..."
                      : "Search student..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Class</label>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  <option value="">All classes</option>
                  {ctx.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Year</label>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="">All years</option>
                  {ctx.academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-700">Term</label>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
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
            </div>
            <div className="flex items-center gap-2 mt-4">
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={sortDirection}
                onChange={(e) =>
                  setSortDirection(e.target.value as "asc" | "desc")
                }
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <span className="text-xs text-slate-500">Sort order</span>
            </div>
          </div>

          {ctx.isAdmin && viewMode === "class-progress" ? (
            <>
              {paginatedClassProgress.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">No classes match the current filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                          Students
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                          Reports generated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">
                          Completion
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paginatedClassProgress.map((item) => (
                        <tr key={item.classId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {item.className}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {item.totalStudents}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {item.generated}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 w-32">
                                <div className="w-full rounded-full bg-slate-200 h-2">
                                  <div
                                    className="h-2 rounded-full bg-gradient-to-r from-sky-600 to-sky-800"
                                    style={{ width: `${item.completion}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs font-medium text-slate-600">
                                {item.completion}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 border-t border-slate-200 pt-4">
                <div className="font-medium">
                  Showing {paginatedClassProgress.length} of {sortedClassProgress.length} classes
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <span className="font-medium">
                    Page {page} of {Math.max(1, Math.ceil(sortedClassProgress.length / ITEM_PER_PAGE))}
                  </span>
                  <button
                    disabled={page >= Math.ceil(sortedClassProgress.length / ITEM_PER_PAGE)}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : filteredReports.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">
                No termly reports found.
                {ctx.canManageReports &&
                  " Open the Generate tab to create them for a class or the whole school."}
              </p>
            </div>
          ) : shouldGroupRecords ? (
            groupedReports.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">
                  No termly reports found for this student.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedReports.map((yearGroup) => (
                  <div key={yearGroup.academicYearLabel} className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {yearGroup.academicYearLabel}
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {yearGroup.classes.map((classGroup) => (
                        <div key={classGroup.className} className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h4 className="text-base font-semibold text-slate-800">
                              {classGroup.className}
                            </h4>
                          </div>
                          <div className="space-y-6">
                            {classGroup.terms.map((termGroup) => (
                              <div key={termGroup.termNumber} className="space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                  <h5 className="text-sm font-semibold text-slate-800">
                                    Term {termGroup.termNumber}
                                  </h5>
                                </div>
                                <div className="space-y-4">
                                  {termGroup.reports.map((report) => (
                                    <ReportEditorCard
                                      key={report.id}
                                      report={report}
                                      canManageMeta={canManageMetaForReport(report)}
                                      canDelete={ctx.isAdmin}
                                      onPreview={() => setPreviewReport(report)}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-4">
              {paginatedReports.map((report) => (
                <ReportEditorCard
                  key={report.id}
                  report={report}
                  canManageMeta={canManageMetaForReport(report)}
                  canDelete={ctx.isAdmin}
                  onPreview={() => setPreviewReport(report)}
                />
              ))}
            </div>
          )}
          {!(ctx.isAdmin && viewMode === "class-progress") && !shouldGroupRecords && filteredReports.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 border-t border-slate-200 pt-4">
              <div className="font-medium">
                Showing {paginatedReports.length} of {filteredReports.length} reports
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
                >
                  Prev
                </button>
                <span className="font-medium">
                  Page {page} of {Math.max(1, Math.ceil(filteredReports.length / ITEM_PER_PAGE))}
                </span>
                <button
                  disabled={page >= Math.ceil(filteredReports.length / ITEM_PER_PAGE)}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </div>
  );
}
