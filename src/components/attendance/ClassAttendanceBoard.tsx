"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CalendarDays, Users } from "lucide-react";
import { createAttendance } from "@/lib/actions";

type StudentRow = {
  id: string;
  name: string;
  surname: string;
  attendances: { id: number; present: boolean }[];
};

type ClassGroup = {
  id: number;
  name: string;
  students: StudentRow[];
};

type TeacherRow = {
  id: string;
  name: string;
  surname: string;
  attendances: { id: number; present: boolean }[];
};

type TermSummaryRow = {
  id: string;
  name: string;
  surname: string;
  className?: string;
  subjects?: string[];
  presentCount: number;
  markedCount: number;
};

function TermAttendanceSummary({
  title,
  termLabel,
  personLabel,
  rows,
}: {
  title: string;
  termLabel: string | null;
  personLabel: string;
  rows: TermSummaryRow[];
}) {
  const totalPresent = rows.reduce((total, row) => total + row.presentCount, 0);
  const fullyMarked = rows.filter((row) => row.markedCount > 0).length;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
      <header className="border-b border-slate-200 p-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{termLabel ?? "No active academic term"}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md bg-emerald-50 p-2">
            <p className="text-[11px] text-emerald-800">Present days</p>
            <p className="mt-0.5 text-lg font-semibold text-emerald-900">{totalPresent}</p>
          </div>
          <div className="rounded-md bg-slate-100 p-2">
            <p className="text-[11px] text-slate-600">{personLabel} marked</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-900">{fullyMarked}/{rows.length}</p>
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100">
        {rows.length ? rows.map((row) => {
          const rate = row.markedCount ? Math.round((row.presentCount / row.markedCount) * 100) : null;
          return (
            <div key={row.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <p className="truncate text-sm font-medium text-slate-900">{row.name} {row.surname}</p>
                <p className="truncate text-xs text-slate-500">{row.className ?? row.subjects?.join(", ") ?? "Subjects not assigned"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs sm:gap-4">
                <span className="text-slate-600"><span className="hidden md:inline">Present </span><strong className="text-emerald-700">{row.presentCount}</strong></span>
                <span className="text-slate-600"><span className="hidden md:inline">Marked </span><strong className="text-slate-800">{row.markedCount}</strong></span>
                <span className={`font-semibold ${rate === null ? "text-slate-400" : rate >= 75 ? "text-emerald-700" : "text-amber-700"}`}>
                  {rate === null ? "—" : `${rate}%`}
                </span>
              </div>
            </div>
          );
        }) : (
          <p className="p-4 text-sm text-slate-500">No {personLabel.toLowerCase()} records for this term.</p>
        )}
      </div>
    </section>
  );
}

export default function ClassAttendanceBoard({
  role,
  selectedDate,
  classes,
  teachers = [],
  studentTermSummary = [],
  teacherTermSummary = [],
  termSummaryLabel = null,
  attendanceRestriction = null,
}: {
  role: "admin" | "teacher";
  selectedDate: string;
  classes: ClassGroup[];
  teachers?: TeacherRow[];
  studentTermSummary?: TermSummaryRow[];
  teacherTermSummary?: TermSummaryRow[];
  termSummaryLabel?: string | null;
  attendanceRestriction?: string | null;
}) {
  const router = useRouter();
  const [date, setDate] = useState(selectedDate);
  const [search, setSearch] = useState("");
  const [pendingClassId, setPendingClassId] = useState<number | null>(null);
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);
  const [pendingTeacherId, setPendingTeacherId] = useState<string | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Record<number, boolean>>({});
  const [adminTab, setAdminTab] = useState<"students" | "teachers">("students");

  useEffect(() => setDate(selectedDate), [selectedDate]);

  const checkingAttendanceDate = date !== selectedDate;
  const markingBlocked = checkingAttendanceDate || Boolean(attendanceRestriction);
  const markingBlockMessage = checkingAttendanceDate
    ? "Checking the school calendar for this date..."
    : attendanceRestriction;

  const visibleClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return classes;
    return classes
      .map((classGroup) => ({
        ...classGroup,
        students: classGroup.students.filter((student) =>
          `${student.name} ${student.surname}`.toLowerCase().includes(query)
        ),
      }))
      .filter((classGroup) => classGroup.name.toLowerCase().includes(query) || classGroup.students.length > 0);
  }, [classes, search]);

  const visibleTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teachers;
    return teachers.filter((teacher) => `${teacher.name} ${teacher.surname}`.toLowerCase().includes(query));
  }, [teachers, search]);

  const totalStudents = classes.reduce((count, classGroup) => count + classGroup.students.length, 0);
  const presentCount = classes.reduce((count, classGroup) => count + classGroup.students.filter((student) => student.attendances[0]?.present).length, 0);
  const absentCount = classes.reduce((count, classGroup) => count + classGroup.students.filter((student) => student.attendances.length > 0 && !student.attendances[0].present).length, 0);
  const unmarkedCount = totalStudents - presentCount - absentCount;

  const setClassAttendance = async (classGroup: ClassGroup, present: boolean) => {
    if (markingBlocked) return;
    if (!classGroup.students.length || pendingStudentId || pendingClassId !== null) return;
    setPendingClassId(classGroup.id);
    try {
      const result = await createAttendance({ success: false, error: false }, {
        type: "student",
        date,
        present,
        studentIds: classGroup.students.map((student) => student.id),
      } as any);
      if (!result.success) {
        toast.error("Unable to save class attendance.");
        return;
      }
      toast.success(`${classGroup.name} attendance saved.`);
      router.refresh();
    } catch {
      toast.error("Unable to save class attendance.");
    } finally {
      setPendingClassId(null);
    }
  };

  const setStudentAttendance = async (student: StudentRow, present: boolean) => {
    if (markingBlocked) return;
    if (pendingStudentId || pendingClassId !== null) return;
    setPendingStudentId(student.id);
    try {
      const result = await createAttendance({ success: false, error: false }, {
        type: "student",
        date,
        present,
        studentIds: [student.id],
      } as any);
      if (!result.success) {
        toast.error(`Unable to save attendance for ${student.name}.`);
        return;
      }
      toast.success(`${student.name}'s attendance saved.`);
      router.refresh();
    } catch {
      toast.error(`Unable to save attendance for ${student.name}.`);
    } finally {
      setPendingStudentId(null);
    }
  };

  const setTeacherAttendance = async (teacherIds: string[], present: boolean) => {
    if (markingBlocked) return;
    if (!teacherIds.length) return;
    setPendingTeacherId(teacherIds.length === 1 ? teacherIds[0] : "all");
    try {
      const result = await createAttendance({ success: false, error: false }, {
        type: "teacher",
        date,
        present,
        teacherIds,
      } as any);
      if (!result.success) {
        toast.error("Unable to save teacher attendance.");
        return;
      }
      toast.success(teacherIds.length === 1 ? "Teacher attendance saved." : "Teacher attendance saved for all staff.");
      router.refresh();
    } catch {
      toast.error("Unable to save teacher attendance.");
    } finally {
      setPendingTeacherId(null);
    }
  };

  const studentMarkingPanel = (
    <section aria-label="Student attendance marking" className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Mark student attendance</h2>
          <p className="mt-0.5 text-xs text-slate-500">Mark an entire class or individual students.</p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a class or student"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>
      </div>
      {markingBlockMessage ? <p role="alert" className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{markingBlockMessage}</p> : null}
      <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-200 overscroll-contain">
        {visibleClasses.length ? visibleClasses.map((classGroup) => {
          const markedPresent = classGroup.students.filter((student) => student.attendances[0]?.present).length;
          const markedAbsent = classGroup.students.filter((student) => student.attendances.length > 0 && !student.attendances[0].present).length;
          const isExpanded = expandedClasses[classGroup.id] ?? false;
          const isSaving = pendingClassId === classGroup.id || pendingClassId !== null || pendingStudentId !== null;

          return (
            <section key={classGroup.id}>
              <div className="flex flex-col gap-3 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <button
                  type="button"
                  onClick={() => setExpandedClasses((current) => ({ ...current, [classGroup.id]: !isExpanded }))}
                  className="flex min-w-0 items-center gap-3 text-left"
                  aria-expanded={isExpanded}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-800"><Users size={17} /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{classGroup.name}</span>
                    <span className="block text-xs text-slate-500">{classGroup.students.length} students · {markedPresent} present · {markedAbsent} absent</span>
                  </span>
                  <span className="text-xs text-slate-400" aria-hidden="true">{isExpanded ? "Collapse" : "Expand"}</span>
                </button>
                <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
                  <button type="button" disabled={markingBlocked || isSaving || !classGroup.students.length} onClick={() => void setClassAttendance(classGroup, true)} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <span aria-hidden="true">✓</span>{isSaving ? "Saving..." : "Mark all present"}
                  </button>
                  <button type="button" disabled={markingBlocked || isSaving || !classGroup.students.length} onClick={() => void setClassAttendance(classGroup, false)} className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
                    <span aria-hidden="true">×</span>Mark all absent
                  </button>
                </div>
              </div>
              <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`} aria-hidden={!isExpanded} inert={!isExpanded}>
                <div className="min-h-0 overflow-hidden divide-y divide-slate-100">
                  {classGroup.students.map((student) => {
                    const attendance = student.attendances[0];
                    return (
                      <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 pl-16">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{student.name} {student.surname}</p>
                          <p className="text-xs text-slate-500">{attendance ? "Marked for this date" : "Not marked yet"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${attendance ? attendance.present ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                            {attendance ? attendance.present ? "✓" : "×" : null}{attendance ? attendance.present ? "Present" : "Absent" : "Unmarked"}
                          </span>
                          <button type="button" disabled={markingBlocked || isSaving} onClick={() => void setStudentAttendance(student, true)} aria-label={`Mark ${student.name} ${student.surname} present`} aria-pressed={attendance?.present === true} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${attendance?.present === true ? "bg-emerald-700 text-white" : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"}`}>Present</button>
                          <button type="button" disabled={markingBlocked || isSaving} onClick={() => void setStudentAttendance(student, false)} aria-label={`Mark ${student.name} ${student.surname} absent`} aria-pressed={attendance?.present === false} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${attendance?.present === false ? "bg-rose-700 text-white" : "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"}`}>Absent</button>
                        </div>
                      </div>
                    );
                  })}
                  {classGroup.students.length === 0 ? <p className="px-4 py-3 pl-16 text-sm text-slate-500">No active students in this class.</p> : null}
                </div>
              </div>
            </section>
          );
        }) : (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Users size={18} /></div>
            <p className="mt-3 text-sm font-medium text-slate-800">No classes found</p>
            <p className="mt-1 text-sm text-slate-500">There are no assigned classes or students matching this search.</p>
          </div>
        )}
      </div>
    </section>
  );

  const teacherMarkingPanel = (
    <section aria-label="Teacher attendance marking" className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
      <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Mark teacher attendance</h2>
          <p className="mt-0.5 text-xs text-slate-500">Mark staff for the selected date.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={markingBlocked || !visibleTeachers.length || pendingTeacherId !== null} onClick={() => void setTeacherAttendance(visibleTeachers.map((teacher) => teacher.id), true)} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Mark all present</button>
          <button type="button" disabled={markingBlocked || !visibleTeachers.length || pendingTeacherId !== null} onClick={() => void setTeacherAttendance(visibleTeachers.map((teacher) => teacher.id), false)} className="rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">Mark all absent</button>
        </div>
      </header>
      {markingBlockMessage ? <p role="alert" className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{markingBlockMessage}</p> : null}
      <div className="border-b border-slate-200 p-3">
        <label className="sr-only" htmlFor="teacher-attendance-search">Find a teacher</label>
        <input id="teacher-attendance-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a teacher" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
        {visibleTeachers.length ? visibleTeachers.map((teacher) => {
          const attendance = teacher.attendances[0];
          const isSaving = pendingTeacherId === teacher.id || pendingTeacherId === "all";
          return (
            <div key={teacher.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{teacher.name} {teacher.surname}</p>
                <p className="text-xs text-slate-500">{attendance ? "Marked for this date" : "Not marked yet"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${attendance ? attendance.present ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{attendance ? attendance.present ? "Present" : "Absent" : "Unmarked"}</span>
                <button type="button" disabled={markingBlocked || isSaving} onClick={() => void setTeacherAttendance([teacher.id], true)} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Present</button>
                <button type="button" disabled={markingBlocked || isSaving} onClick={() => void setTeacherAttendance([teacher.id], false)} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">Absent</button>
              </div>
            </div>
          );
        }) : <p className="p-6 text-center text-sm text-slate-500">No active teachers found.</p>}
      </div>
    </section>
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Daily register</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">{role === "admin" ? "Attendance management" : "Student attendance"}</h1>
          <p className="mt-1 text-sm text-slate-600">{role === "admin" ? "Review and record attendance by class." : "Review and record attendance for your supervised classes."}</p>
        </div>
        <label className="text-xs font-medium text-slate-600">
          Attendance date
          <span className="relative mt-1 block">
            <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                router.replace(`/list/attendance?date=${event.target.value}`);
              }}
              className="rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900"
            />
          </span>
        </label>
      </header>

      {role === "admin" ? (
        <>
          <div role="tablist" aria-label="Attendance type" className="flex w-fit gap-1 rounded-md border border-slate-200 bg-white p-1">
            <button id="students-attendance-tab" type="button" role="tab" aria-selected={adminTab === "students"} aria-controls="admin-attendance-panel" onClick={() => setAdminTab("students")} className={`rounded px-4 py-2 text-sm font-medium transition-colors ${adminTab === "students" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              Students
            </button>
            <button id="teachers-attendance-tab" type="button" role="tab" aria-selected={adminTab === "teachers"} aria-controls="admin-attendance-panel" onClick={() => setAdminTab("teachers")} className={`rounded px-4 py-2 text-sm font-medium transition-colors ${adminTab === "teachers" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              Teachers
            </button>
          </div>
          <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="h-[min(68vh,720px)] min-h-[360px] min-w-0" id="admin-attendance-panel" role="tabpanel" aria-labelledby={adminTab === "students" ? "students-attendance-tab" : "teachers-attendance-tab"}>
              {adminTab === "students" ? studentMarkingPanel : teacherMarkingPanel}
            </div>
            <div className="h-[min(68vh,720px)] min-h-[360px] min-w-0">
              {adminTab === "students" ? (
                <TermAttendanceSummary title="Student attendance summary" termLabel={termSummaryLabel} personLabel="Students" rows={studentTermSummary} />
              ) : (
                <TermAttendanceSummary title="Teacher attendance summary" termLabel={termSummaryLabel} personLabel="Teachers" rows={teacherTermSummary} />
              )}
            </div>
          </div>
        </>
      ) : (
      <>
      <section aria-label="Daily attendance summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Classes" value={classes.length} tone="sky" />
        <SummaryCard label="Students" value={totalStudents} tone="slate" />
        <SummaryCard label="Present" value={presentCount} tone="green" />
        <SummaryCard label="Absent" value={`${absentCount} · ${unmarkedCount} unmarked`} tone="rose" />
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Classes and student register</h2>
            <p className="mt-0.5 text-xs text-slate-500">Mark an entire class present or absent for the selected date.</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a class or student"
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

        <div className="divide-y divide-slate-200">
          {visibleClasses.length ? visibleClasses.map((classGroup) => {
            const markedPresent = classGroup.students.filter((student) => student.attendances[0]?.present).length;
            const markedAbsent = classGroup.students.filter((student) => student.attendances.length > 0 && !student.attendances[0].present).length;
            const isExpanded = expandedClasses[classGroup.id] ?? false;
            const isSaving = pendingClassId === classGroup.id || pendingClassId !== null || pendingStudentId !== null;

            return (
              <section key={classGroup.id}>
                <div className="flex flex-col gap-3 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <button
                    type="button"
                    onClick={() => setExpandedClasses((current) => ({ ...current, [classGroup.id]: !isExpanded }))}
                    className="flex min-w-0 items-center gap-3 text-left"
                    aria-expanded={isExpanded}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-800"><Users size={17} /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">{classGroup.name}</span>
                      <span className="block text-xs text-slate-500">{classGroup.students.length} students · {markedPresent} present · {markedAbsent} absent</span>
                    </span>
                    <span className="text-xs text-slate-400" aria-hidden="true">{isExpanded ? "Collapse" : "Expand"}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
                    <button
                      type="button"
                      disabled={isSaving || !classGroup.students.length}
                      onClick={() => void setClassAttendance(classGroup, true)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                    >
                      <span aria-hidden="true">✓</span>
                      {isSaving ? "Saving..." : "Mark all present"}
                    </button>
                    <button
                      type="button"
                      disabled={isSaving || !classGroup.students.length}
                      onClick={() => void setClassAttendance(classGroup, false)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      <span aria-hidden="true">×</span>
                      Mark all absent
                    </button>
                  </div>
                </div>

                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`} aria-hidden={!isExpanded} inert={!isExpanded}>
                  <div className="min-h-0 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {classGroup.students.map((student) => {
                        const attendance = student.attendances[0];
                        return (
                          <div key={student.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 pl-16">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">{student.name} {student.surname}</p>
                              <p className="text-xs text-slate-500">{attendance ? "Marked for this date" : "Not marked yet"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${attendance ? attendance.present ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                                {attendance ? attendance.present ? "✓" : "×" : null}
                                {attendance ? attendance.present ? "Present" : "Absent" : "Unmarked"}
                              </span>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void setStudentAttendance(student, true)}
                                aria-label={`Mark ${student.name} ${student.surname} present`}
                                aria-pressed={attendance?.present === true}
                                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:cursor-wait disabled:opacity-50 ${attendance?.present === true ? "bg-emerald-700 text-white" : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"}`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void setStudentAttendance(student, false)}
                                aria-label={`Mark ${student.name} ${student.surname} absent`}
                                aria-pressed={attendance?.present === false}
                                className={`rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:cursor-wait disabled:opacity-50 ${attendance?.present === false ? "bg-rose-700 text-white" : "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50"}`}
                              >
                                Absent
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {classGroup.students.length === 0 ? <p className="px-4 py-3 pl-16 text-sm text-slate-500">No active students in this class.</p> : null}
                    </div>
                  </div>
                </div>
              </section>
            );
          }) : (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Users size={18} /></div>
              <p className="mt-3 text-sm font-medium text-slate-800">No classes found</p>
              <p className="mt-1 text-sm text-slate-500">There are no assigned classes or students matching this search.</p>
            </div>
          )}
        </div>
      </section>

      </>)}
    </main>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number | string; tone: "sky" | "slate" | "green" | "rose" }) {
  const tones = {
    sky: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
      <p className="text-sm text-slate-600">{label}</p>
      <span className={`rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${tones[tone]}`}>{value}</span>
    </div>
  );
}
