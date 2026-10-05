"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";

type Props = {
  studentsByClass: { className: string; studentCount: number }[];
  topAttendants: { name: string; count: number }[];
  topStudentsByClass: {
    termKey: string;
    classId: number;
    className: string;
    topStudents: {
      studentId: string;
      studentName: string;
      overallPercentage: number;
    }[];
  }[];
  subjectPerformanceSummary: {
    termKey: string;
    classId: number;
    className: string;
    subjectId: number;
    subjectName: string;
    gradingLevel: string;
    averageMarks: number;
    lowPerformanceCount: number;
    studentCount: number;
  }[];
  performanceTerms: {
    key: string;
    label: string;
    academicYearId: number;
    termNumber: number;
    isActive: boolean;
  }[];
  activePerformanceTermKey: string;
  classes: { id: number; name: string }[];
};

const chartCard =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm";
const chartHeight = { height: 300 };
const axisTick = { fill: "#64748b", fontSize: 11 };
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};
const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

export default function ChartsSummary({
  studentsByClass,
  topAttendants,
  topStudentsByClass,
  subjectPerformanceSummary,
  performanceTerms,
  activePerformanceTermKey,
  classes,
}: Props) {
  const [termKey, setTermKey] = useState(activePerformanceTermKey);
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const selectedTermKey = performanceTerms.some((term) => term.key === termKey)
    ? termKey
    : performanceTerms[0]?.key ?? "";
  const availableSubjects = useMemo(
    () =>
      subjectPerformanceSummary.filter(
        (row) =>
          row.termKey === selectedTermKey &&
          (classFilter === "all" || row.classId === Number(classFilter))
      ),
    [subjectPerformanceSummary, selectedTermKey, classFilter]
  );
  const selectedSubjectFilter = availableSubjects.some(
    (row) => String(row.subjectId) === subjectFilter
  )
    ? subjectFilter
    : "all";
  const visibleSubjectRows = availableSubjects.filter(
    (row) =>
      selectedSubjectFilter === "all" ||
      row.subjectId === Number(selectedSubjectFilter)
  ).map((row) => ({
    ...row,
    chartLabel:
      classFilter === "all"
        ? `${row.subjectName} · ${row.className}`
        : row.subjectName,
  }));
  const visibleTopStudents = topStudentsByClass
    .filter(
      (entry) =>
        entry.termKey === selectedTermKey &&
        (classFilter === "all" || entry.classId === Number(classFilter))
    )
    .flatMap((entry) =>
      entry.topStudents.map((student) => ({
        ...student,
        label:
          classFilter === "all"
            ? `${entry.className}: ${student.studentName}`
            : student.studentName,
      }))
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <label className="flex min-w-48 flex-col gap-1.5 text-xs font-semibold text-slate-500">
          Academic year · term
          <select
            className={selectClass}
            value={selectedTermKey}
            onChange={(event) => setTermKey(event.target.value)}
            disabled={performanceTerms.length === 0}
          >
            {performanceTerms.map((term) => (
              <option key={term.key} value={term.key}>
                {term.label}{term.isActive ? " · Active" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-48 flex-col gap-1.5 text-xs font-semibold text-slate-500">
          Class
          <select
            className={selectClass}
            value={classFilter}
            onChange={(event) => {
              setClassFilter(event.target.value);
              setSubjectFilter("all");
            }}
          >
            <option value="all">All classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
      <article className={chartCard}>
        <div className="mb-5">
          <h3 className="font-semibold text-slate-900">Students by class</h3>
          <p className="mt-1 text-sm text-slate-500">
            Current student distribution across classes
          </p>
        </div>
        {studentsByClass.length ? (
          <div style={{ height: Math.max(260, studentsByClass.length * 42) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={studentsByClass}
                layout="vertical"
                margin={{ top: 4, right: 18, bottom: 4, left: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="#eef2f7" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="className"
                  type="category"
                  width={104}
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
                <Bar
                  dataKey="studentCount"
                  name="Students"
                  fill="#0ea5e9"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="No class data is available yet." />
        )}
      </article>

      <article className={chartCard}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Subject performance</h3>
            <p className="mt-1 text-sm text-slate-500">
              Average marks and number of low-performing results
            </p>
          </div>
          <label className="flex min-w-40 flex-col gap-1 text-xs font-semibold text-slate-500">
            Subject
            <select
              className={selectClass}
              value={selectedSubjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
            >
              <option value="all">All subjects</option>
              {Array.from(
                new Map(
                  availableSubjects.map((row) => [row.subjectId, row.subjectName])
                )
              ).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {visibleSubjectRows.length ? (
          <div style={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={visibleSubjectRows}
                margin={{ top: 8, right: 8, bottom: 26, left: -18 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis
                  dataKey="chartLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={58}
                />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#475569" }} />
                <Bar
                  dataKey="averageMarks"
                  name="Average marks"
                  fill="#6366f1"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="lowPerformanceCount"
                  name="Low results"
                  fill="#f97316"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Subject performance will appear as scores are entered for the selected term." />
        )}
      </article>

      <article className={`${chartCard} xl:col-span-2`}>
        <div className="mb-5">
          <h3 className="font-semibold text-slate-900">Top students by class</h3>
          <p className="mt-1 text-sm text-slate-500">
            Highest averages from entered subject results
          </p>
        </div>
        {visibleTopStudents.length ? (
          <div style={{ height: Math.max(340, visibleTopStudents.length * 38) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={visibleTopStudents}
                layout="vertical"
                margin={{ top: 8, right: 18, bottom: 8, left: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="#eef2f7" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(value: number) => `${value}%`} />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={150}
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(value) => value}
                  formatter={(value) =>
                    typeof value === "number" ? `${value.toFixed(1)}%` : value
                  }
                />
                <Bar dataKey="overallPercentage" name="Average marks" fill="#0ea5e9" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Student rankings will appear as results are entered for the selected term." />
        )}
      </article>

      <article className={chartCard}>
        <div className="mb-5">
          <h3 className="font-semibold text-slate-900">Attendance leaders</h3>
          <p className="mt-1 text-sm text-slate-500">
            Most present days recorded in the last 30 days
          </p>
        </div>
        {topAttendants.length ? (
          <div style={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topAttendants}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="#eef2f7" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={125}
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
                <Bar
                  dataKey="count"
                  name="Days present"
                  fill="#10b981"
                  radius={[0, 6, 6, 0]}
                  barSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="Attendance leaders will appear as records are added." />
        )}
      </article>

      <article className={chartCard}>
        <div className="mb-5">
          <h3 className="font-semibold text-slate-900">Class honours</h3>
          <p className="mt-1 text-sm text-slate-500">
            Top reported students, grouped by class
          </p>
        </div>
        {visibleTopStudents.length ? (
          <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
            {topStudentsByClass
              .filter(
                (entry) =>
                  entry.termKey === selectedTermKey &&
                  (classFilter === "all" || entry.classId === Number(classFilter))
              )
              .map((entry) => (
              <section
                key={entry.classId}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
              >
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {entry.className}
                </h4>
                {entry.topStudents.length ? (
                  <ol className="mt-2 divide-y divide-slate-200/70">
                    {entry.topStudents.map((student, index) => (
                      <li
                        key={`${entry.classId}-${student.studentName}`}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate text-slate-700">
                          <span className="mr-2 text-xs font-semibold text-slate-400">
                            {index + 1}
                          </span>
                          {student.studentName}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                          {student.overallPercentage.toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No ranked students yet.</p>
                )}
              </section>
            ))}
          </div>
        ) : (
          <EmptyChart message="Class honours will appear as results are entered for the selected term." />
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
