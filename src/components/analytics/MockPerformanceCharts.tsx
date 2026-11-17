"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";

type MockPerformanceRow = {
  classId: number;
  className: string;
  academicYearId: number;
  academicYearLabel: string;
  termNumber: number;
  assessmentNumber: number;
  studentId: string;
  studentName: string;
  overallPercentage: number | null;
  overallGrade: string | null;
  subjectLines: { subjectId: number; subjectName: string; score: number }[];
};

const colors = [
  "#0284c7",
  "#7c3aed",
  "#059669",
  "#ea580c",
  "#db2777",
  "#4f46e5",
];
const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

export default function MockPerformanceCharts({
  rows,
}: {
  rows: MockPerformanceRow[];
}) {
  const [classId, setClassId] = useState("");
  const [termKey, setTermKey] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[] | null>(
    null
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedMockNumbers, setSelectedMockNumbers] = useState<number[] | null>(
    null
  );

  const availableClasses = useMemo(
    () =>
      Array.from(
        new Map(rows.map((row) => [row.classId, row.className])).entries()
      ).map(([id, name]) => ({ id, name })),
    [rows]
  );
  const selectedClassId = availableClasses.some(
    (cls) => String(cls.id) === classId
  )
    ? Number(classId)
    : availableClasses[0]?.id;
  const classRows = rows.filter((row) => row.classId === selectedClassId);
  const availableTerms = Array.from(
    new Map(
      classRows.map((row) => [
        `${row.academicYearId}:${row.termNumber}`,
        {
          key: `${row.academicYearId}:${row.termNumber}`,
          label: `${row.academicYearLabel} · Term ${row.termNumber}`,
        },
      ])
    ).values()
  );
  const selectedTermKey = availableTerms.some((term) => term.key === termKey)
    ? termKey
    : availableTerms[0]?.key ?? "";
  const [academicYearId, selectedTermNumber] = selectedTermKey
    .split(":")
    .map(Number);
  const selectedRows = classRows.filter(
    (row) =>
      row.academicYearId === academicYearId &&
      row.termNumber === selectedTermNumber
  );
  const students = Array.from(
    new Map(
      selectedRows.map((row) => [
        row.studentId,
        { id: row.studentId, name: row.studentName },
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
  const effectiveSelectedStudentIds =
    selectedStudentIds === null
      ? students.slice(0, 3).map((student) => student.id)
      : selectedStudentIds.filter((id) =>
          students.some((student) => student.id === id)
        );
  const selectedStudents = students.filter((student) =>
    effectiveSelectedStudentIds.includes(student.id)
  );
  const assessmentNumbers = Array.from(
    new Set(selectedRows.map((row) => row.assessmentNumber))
  ).sort((a, b) => a - b);

  const studentChartData = assessmentNumbers.map((assessmentNumber) => {
    const point: Record<string, string | number | null> = {
      mockLabel: `Mock ${assessmentNumber}`,
    };
    for (const student of selectedStudents) {
      const report = selectedRows.find(
        (row) =>
          row.studentId === student.id &&
          row.assessmentNumber === assessmentNumber
      );
      point[`student-${student.id}`] = report?.overallPercentage ?? null;
      point[`student-grade-${student.id}`] = report?.overallGrade ?? null;
    }
    return point;
  });

  const subjectStats = new Map<
    number,
    Map<number, { name: string; total: number; count: number }>
  >();
  for (const row of selectedRows) {
    const bySubject = subjectStats.get(row.assessmentNumber) ?? new Map();
    for (const line of row.subjectLines) {
      const stats = bySubject.get(line.subjectId) ?? {
        name: line.subjectName,
        total: 0,
        count: 0,
      };
      stats.total += line.score;
      stats.count += 1;
      bySubject.set(line.subjectId, stats);
    }
    subjectStats.set(row.assessmentNumber, bySubject);
  }
  const subjectNames = new Map<number, string>();
  for (const bySubject of subjectStats.values()) {
    for (const [subjectId, stats] of bySubject) {
      subjectNames.set(subjectId, stats.name);
    }
  }
  const subjectChartData = assessmentNumbers.map((assessmentNumber) => {
    const point: Record<string, string | number | null> = {
      mockLabel: `Mock ${assessmentNumber}`,
      assessmentNumber,
    };
    for (const subjectId of subjectNames.keys()) {
      const stats = subjectStats.get(assessmentNumber)?.get(subjectId);
      point[`subject-${subjectId}`] = stats
        ? stats.total / stats.count
        : null;
    }
    return point;
  });
  const availableSubjectEntries = Array.from(subjectNames.entries()).sort(
    (a, b) => a[1].localeCompare(b[1])
  );
  const visibleSubjectEntries =
    selectedSubjectId === "all"
      ? availableSubjectEntries
      : availableSubjectEntries.filter(
          ([subjectId]) => String(subjectId) === selectedSubjectId
        );
  const visibleMockNumbers =
    selectedMockNumbers === null
      ? assessmentNumbers
      : selectedMockNumbers.filter((number) =>
          assessmentNumbers.includes(number)
        );
  const visibleSubjectChartData = subjectChartData.filter((point) =>
    visibleMockNumbers.includes(Number(point.assessmentNumber))
  );

  const toggleStudent = (studentId: string) => {
    const selected = effectiveSelectedStudentIds;
    if (selected.includes(studentId)) {
      setSelectedStudentIds(selected.filter((id) => id !== studentId));
    } else if (selected.length < 6) {
      setSelectedStudentIds([...selected, studentId]);
    }
  };

  const toggleMock = (assessmentNumber: number) => {
    if (selectedMockNumbers === null) {
      setSelectedMockNumbers([assessmentNumber]);
      return;
    }

    setSelectedMockNumbers(
      selectedMockNumbers.includes(assessmentNumber)
        ? selectedMockNumbers.filter((number) => number !== assessmentNumber)
        : [...selectedMockNumbers, assessmentNumber].sort((a, b) => a - b)
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex sm:flex-wrap sm:items-end sm:p-4">
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-500 sm:min-w-48">
          Class
          <select
            className={`${selectClass} w-full`}
            value={selectedClassId ?? ""}
            onChange={(event) => {
              setClassId(event.target.value);
              setTermKey("");
              setSelectedStudentIds(null);
              setSelectedSubjectId("all");
              setSelectedMockNumbers(null);
            }}
            disabled={!availableClasses.length}
          >
            {availableClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-500 sm:min-w-48">
          Academic year · term
          <select
            className={`${selectClass} w-full`}
            value={selectedTermKey}
            onChange={(event) => {
              setTermKey(event.target.value);
              setSelectedStudentIds(null);
              setSelectedSubjectId("all");
              setSelectedMockNumbers(null);
            }}
            disabled={!availableTerms.length}
          >
            {availableTerms.map((term) => (
              <option key={term.key} value={term.key}>
                {term.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid min-w-0 gap-4">
        <article className="w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
              Student performance per mock
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Compare overall average scores across mock examinations.
            </p>
          </div>
          <fieldset className="mb-4">
            <legend className="mb-2 text-xs font-semibold text-slate-500">
              Students to compare (up to 6)
            </legend>
            <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
              {students.map((student) => (
                <label
                  key={student.id}
                  className="flex min-w-0 items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={effectiveSelectedStudentIds.includes(student.id)}
                    disabled={
                      !effectiveSelectedStudentIds.includes(student.id) &&
                      effectiveSelectedStudentIds.length >= 6
                    }
                    onChange={() => toggleStudent(student.id)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="truncate">{student.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {studentChartData.length && selectedStudents.length ? (
            <>
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={studentChartData}
                  margin={{ top: 8, right: 8, bottom: 4, left: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />
                  <XAxis
                    dataKey="mockLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    minTickGap={8}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={(value: number) => `${value}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0]?.payload;
                      return (
                        <div
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg"
                          style={tooltipStyle}
                        >
                          <p className="mb-2 text-xs font-semibold text-slate-700">
                            {label}
                          </p>
                          <div className="space-y-1.5">
                            {selectedStudents.map((student, index) => {
                              const percentage =
                                point?.[`student-${student.id}`];
                              const grade =
                                point?.[`student-grade-${student.id}`];
                              if (percentage == null) return null;
                              return (
                                <div
                                  key={student.id}
                                  className="flex items-center justify-between gap-5 text-xs"
                                >
                                  <span
                                    className="truncate"
                                    style={{
                                      color: colors[index % colors.length],
                                    }}
                                  >
                                    {student.name}
                                  </span>
                                  <span className="shrink-0 font-medium text-slate-700">
                                    {typeof percentage === "number"
                                      ? `${percentage.toFixed(1)}%`
                                      : percentage}
                                    {grade != null ? ` · Grade ${grade}` : ""}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }}
                  />
                  {selectedStudents.map((student, index) => (
                    <Line
                      key={student.id}
                      type="monotone"
                      dataKey={`student-${student.id}`}
                      name={student.name}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      connectNulls={false}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3">
                {selectedStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex min-w-0 items-center gap-2 text-xs text-slate-600"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="truncate">{student.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart
              message={
                selectedRows.length
                  ? "Select one or more students to compare."
                  : "Mock results will appear here when scores are entered."
              }
            />
          )}
        </article>

        <article className="w-full min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                Subject performance per mock
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Select a subject and one or more mocks to compare class-average trends.
              </p>
            </div>
            {subjectNames.size > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {visibleSubjectEntries.length} subject{visibleSubjectEntries.length === 1 ? "" : "s"}
                {" · "}
                {visibleMockNumbers.length} mock{visibleMockNumbers.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {subjectChartData.length && subjectNames.size ? (
            <>
              <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.8fr)]">
                <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-500">
                  Subject
                  <select
                    className={`${selectClass} w-full`}
                    value={selectedSubjectId}
                    onChange={(event) => setSelectedSubjectId(event.target.value)}
                  >
                    <option value="all">All subjects</option>
                    {availableSubjectEntries.map(([subjectId, name]) => (
                      <option key={subjectId} value={subjectId}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <div role="group" aria-label="Mocks to compare" className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Mocks to compare
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedMockNumbers(null)}
                      className="text-xs font-semibold text-sky-700 transition hover:text-sky-900"
                    >
                      All mocks
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assessmentNumbers.map((assessmentNumber) => {
                      const isSelected =
                        selectedMockNumbers === null ||
                        selectedMockNumbers.includes(assessmentNumber);
                      return (
                        <button
                          key={assessmentNumber}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => toggleMock(assessmentNumber)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            isSelected
                              ? "border-sky-200 bg-white text-sky-800 shadow-sm"
                              : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white"
                          }`}
                        >
                          Mock {assessmentNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {visibleMockNumbers.length > 0 && visibleSubjectEntries.length > 0 ? (
                <>
                  <div className="h-[280px] sm:h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={visibleSubjectChartData}
                        margin={{ top: 8, right: 8, bottom: 4, left: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eef2f7"
                        />
                        <XAxis
                          dataKey="mockLabel"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          minTickGap={8}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          width={50}
                          tick={{ fill: "#64748b", fontSize: 10 }}
                          tickFormatter={(value: number) => `${value}%`}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) =>
                            typeof value === "number"
                              ? `${value.toFixed(1)}%`
                              : value
                          }
                        />
                        {visibleSubjectEntries.map(([subjectId, name]) => {
                          const colorIndex = availableSubjectEntries.findIndex(
                            ([availableId]) => availableId === subjectId
                          );
                          return (
                            <Line
                              key={subjectId}
                              type="monotone"
                              dataKey={`subject-${subjectId}`}
                              name={name}
                              stroke={colors[colorIndex % colors.length]}
                              strokeWidth={2}
                              connectNulls={false}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 grid max-h-32 grid-cols-2 gap-x-3 gap-y-2 overflow-y-auto border-t border-slate-100 pt-3 sm:grid-cols-3">
                    {visibleSubjectEntries.map(([subjectId, name]) => {
                      const colorIndex = availableSubjectEntries.findIndex(
                        ([availableId]) => availableId === subjectId
                      );
                      return (
                        <div
                          key={subjectId}
                          className="flex min-w-0 items-center gap-2 text-xs text-slate-600"
                        >
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: colors[colorIndex % colors.length],
                            }}
                          />
                          <span className="truncate">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <EmptyChart
                  message={
                    visibleMockNumbers.length === 0
                      ? "Select at least one mock to compare performance."
                      : "No subject data is available for this selection."
                  }
                />
              )}
            </>
          ) : (
            <EmptyChart message="Subject trends will appear when mock scores are entered." />
          )}
        </article>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
