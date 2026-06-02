"use client";

import { FormEvent, startTransition, useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createAttendance } from "@/lib/actions";
import AttendanceCalendar from "./AttendanceCalendar";

export type AttendancePerson = {
  id: string;
  name: string;
  surname: string;
  classId?: number;
  className?: string;
};

export type AttendanceRecord = {
  id: number;
  date: string;
  present: boolean;
  recordType: "student" | "teacher";
  personName: string;
  className?: string;
};

interface AttendanceManagerProps {
  role: string;
  selectedDate: string;
  records: AttendanceRecord[];
  students?: AttendancePerson[];
  teachers?: AttendancePerson[];
}

const AttendanceManager = ({
  role,
  selectedDate,
  records,
  students = [],
  teachers = [],
}: AttendanceManagerProps) => {
  const router = useRouter();
  const [recordType, setRecordType] = useState<"student" | "teacher">("student");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ""
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || ""
  );
  const [date, setDate] = useState<string>(selectedDate);

  useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);
  const [present, setPresent] = useState("true");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "student" | "teacher">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "present" | "absent">("all");
  const [sortKey, setSortKey] = useState<"date" | "person">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [state, createAttendanceAction] = useActionState(createAttendance, {
    success: false,
    error: false,
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      type: recordType,
      date,
      present,
      studentIds:
        role === "teacher" && recordType === "student"
          ? selectedStudentIds
          : undefined,
      studentId:
        role !== "teacher" && recordType === "student"
          ? selectedStudentId
          : undefined,
      teacherId: recordType === "teacher" ? selectedTeacherId : undefined,
    };

    startTransition(() => {
      createAttendanceAction(payload as any);
    });
  };

  useEffect(() => {
    if (state.success) {
      toast("Attendance record saved.");
      router.refresh();
    }

    if (state.error) {
      toast.error("Unable to save attendance. Check the selection and try again.");
    }
  }, [state, router]);

  const studentOptions = useMemo(
    () => [...students].sort((a, b) =>
      `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`)
    ),
    [students]
  );

  const teacherOptions = useMemo(
    () => [...teachers].sort((a, b) =>
      `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`)
    ),
    [teachers]
  );

  const hasRecordPermission =
    role === "admin" || (role === "teacher" && students.length > 0);

  const allStudentOptions = studentOptions;
  const allTeacherOptions = teacherOptions;

  const filteredRecords = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();

    return [...records]
      .filter((record) => {
        if (filterType !== "all" && record.recordType !== filterType) {
          return false;
        }

        if (filterStatus !== "all") {
          const isPresent = record.present;
          if (filterStatus === "present" && !isPresent) return false;
          if (filterStatus === "absent" && isPresent) return false;
        }

        if (!lowerSearch) {
          return true;
        }

        return [record.personName, record.className ?? "", record.date, record.recordType]
          .some((value) => value.toLowerCase().includes(lowerSearch));
      })
      .sort((a, b) => {
        if (sortKey === "person") {
          const result = a.personName.localeCompare(b.personName);
          return sortDirection === "asc" ? result : -result;
        }

        const dateResult = a.date.localeCompare(b.date);
        return sortDirection === "asc" ? dateResult : -dateResult;
      });
  }, [records, searchTerm, filterType, filterStatus, sortKey, sortDirection]);

  const studentPresentCount = records.filter(
    (record) => record.recordType === "student" && record.present
  ).length;
  const studentAbsentCount = records.filter(
    (record) => record.recordType === "student" && !record.present
  ).length;
  const teacherPresentCount = records.filter(
    (record) => record.recordType === "teacher" && record.present
  ).length;
  const teacherAbsentCount = records.filter(
    (record) => record.recordType === "teacher" && !record.present
  ).length;

  // moved to testable helpers in lib; keep fallback implementations for safety
  const getInitials = (name: string) => {
    try {
      const parts = name.trim().split(" ");
      if (parts.length === 0) return "";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } catch {
      return "";
    }
  };

  const avatarColor = (name: string) => {
    try {
      const code = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const colors = ["bg-sky-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-yellow-500", "bg-violet-500"];
      return colors[code % colors.length];
    } catch {
      return "bg-sky-500";
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-950 shadow-lg rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-500">
              Attendance
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Attendance Records
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage daily attendance quickly — modern, clear controls for
              teachers and administrators.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 p-4 text-white shadow-md transform transition-transform hover:-translate-y-1">
              <p className="text-xs opacity-90">Total records</p>
              <p className="mt-2 text-2xl font-semibold">{records.length}</p>
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white dark:bg-slate-950 p-4 shadow-md border border-slate-100 dark:border-slate-800">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Students
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Present</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {studentPresentCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Absent</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {studentAbsentCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-md border border-slate-100">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Teachers
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Present</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {teacherPresentCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Absent</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {teacherAbsentCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-2xl bg-slate-50 p-5 shadow-sm border border-slate-200">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Showing attendance for
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {selectedDate}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Select a different date on the calendar to view past records.
            </p>
          </div>
          <AttendanceCalendar selectedDate={selectedDate} />
        </div>
      </section>

      {hasRecordPermission && (
        <section className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Record attendance
              </h2>
              <p className="text-sm text-slate-500">
                Create a new attendance entry for a student or teacher.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Type
                </label>
                <div className="inline-flex rounded-full bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setRecordType("student")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      recordType === "student"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-700"
                    }`}
                  >
                    Student
                  </button>
                  {role === "admin" && (
                    <button
                      type="button"
                      onClick={() => setRecordType("teacher")}
                      className={`ml-1 px-4 py-2 rounded-full text-sm font-medium transition ${
                        recordType === "teacher"
                          ? "bg-white shadow text-slate-900"
                          : "text-slate-700"
                      }`}
                    >
                      Teacher
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  name="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-sky-500/10 transition focus:border-sky-300 focus:ring"
                />
              </div>
            </div>

            {recordType === "student" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Student
                  </label>
                  <select
                    name={role === "teacher" ? "studentIds" : "studentId"}
                    value={role === "teacher" ? selectedStudentIds : selectedStudentId}
                    onChange={(event) => {
                      if (role === "teacher") {
                        const values = Array.from(
                          event.target.selectedOptions,
                          (option) => option.value
                        );
                        setSelectedStudentIds(values);
                      } else {
                        setSelectedStudentId(event.target.value);
                      }
                    }}
                    multiple={role === "teacher"}
                    className={`min-h-[180px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-sky-500/10 ${
                      role === "teacher" ? "resize-none" : ""
                    }`}
                  >
                    {role !== "teacher" && <option value="">Select student</option>}
                    {studentOptions.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} {student.surname}
                        {student.className ? ` — ${student.className}` : ""}
                      </option>
                    ))}
                  </select>
                  {role === "teacher" && (
                    <p className="text-xs text-slate-500">
                      {selectedStudentIds.length === 0
                        ? "Choose one or more students to mark attendance."
                        : `${selectedStudentIds.length} student${
                            selectedStudentIds.length > 1 ? "s" : ""
                          } selected.`}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Attendance
                  </label>
                  <div className="inline-flex rounded-full bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setPresent("true")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        present === "true"
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-700"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresent("false")}
                      className={`ml-1 px-4 py-2 rounded-full text-sm font-medium transition ${
                        present === "false"
                          ? "bg-rose-600 text-white shadow"
                          : "text-slate-700"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-1" />
              </div>
            )}

            {recordType === "teacher" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Teacher
                  </label>
                  <select
                    name="teacherId"
                    value={selectedTeacherId}
                    onChange={(event) => setSelectedTeacherId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-sky-500/10"
                  >
                    <option value="">Select teacher</option>
                    {teacherOptions.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} {teacher.surname}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Attendance
                  </label>
                  <div className="inline-flex rounded-full bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setPresent("true")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        present === "true"
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-700"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresent("false")}
                      className={`ml-1 px-4 py-2 rounded-full text-sm font-medium transition ${
                        present === "false"
                          ? "bg-rose-600 text-white shadow"
                          : "text-slate-700"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                  <input type="hidden" name="present" value={present} />
                </div>

                <div className="sm:col-span-1" />
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={
                  (recordType === "student" &&
                    (role === "teacher"
                      ? selectedStudentIds.length === 0
                      : !selectedStudentId)) ||
                  (recordType === "teacher" && !selectedTeacherId)
                }
                className="inline-flex items-center gap-2 justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition transform hover:-translate-y-0.5 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016.803 4H3.197a2 2 0 00-1.194.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Save attendance
              </button>
              <p className="text-sm text-slate-500">
                Records created here are visible to all authorized users.
              </p>
            </div>
          </form>
        </section>
      )}

      <section className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-6 overflow-x-auto">
        <div className="mb-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent attendance history
              </h2>
              <p className="text-sm text-slate-500">
                Search, filter, and sort the attendance records shown below.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, class, date, type"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="button"
                onClick={() => {
                  if (sortKey === "date") {
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortKey("date");
                    setSortDirection("desc");
                  }
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
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
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortKey("person");
                    setSortDirection("asc");
                  }
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  sortKey === "person"
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Name {sortKey === "person" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "student", "teacher"] as const).map((typeOption) => (
                <button
                  key={typeOption}
                  type="button"
                  onClick={() => setFilterType(typeOption)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filterType === typeOption
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {typeOption === "all" ? "All types" : typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "present", "absent"] as const).map((statusOption) => (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => setFilterStatus(statusOption)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filterStatus === statusOption
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {statusOption === "all"
                    ? "All status"
                    : statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="min-w-full overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No attendance records match your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{record.date}</td>
                    <td className="px-4 py-4 uppercase tracking-[0.16em] text-slate-500">
                      {record.recordType}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(record.personName)}`}>
                          {getInitials(record.personName)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{record.personName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {record.className ?? (record.recordType === "teacher" ? "Staff" : "-")}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          record.present
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {record.present ? "Present" : "Absent"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AttendanceManager;
