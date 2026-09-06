"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type PerformanceReport = {
  overallPercentage: number | null;
  overallGrade: string | null;
  resultStatus: string | null;
  academicYearLabel?: string;
  termNumber?: number;
  className?: string;
};

const Performance = ({ report }: { report?: PerformanceReport | null }) => {
  const percentage = Math.min(Math.max(report?.overallPercentage ?? 0, 0), 100);
  const safePercentage = Number.isFinite(percentage) ? percentage : 0;
  const remaining = Math.max(100 - safePercentage, 0);
  const balancedRemaining = remaining > 0 ? remaining / 2 : 0;
  const tertiary = remaining > 0 ? Math.max(remaining - balancedRemaining, 0) : 0;

  const chartData = [
    { name: "Overall %", value: safePercentage, fill: "#2563eb" },
    { name: "Remaining", value: balancedRemaining, fill: "#dbeafe" },
    { name: "Balance", value: tertiary, fill: "#93c5fd" },
  ];

  const resultStatus = (report?.resultStatus ?? "—").trim();
  const resultTone =
    resultStatus === "Passed" || resultStatus === "PASS" || resultStatus === "Pass"
      ? "bg-emerald-100 text-emerald-700"
      : resultStatus === "Failed" || resultStatus === "FAIL" || resultStatus === "Fail"
        ? "bg-rose-100 text-rose-700"
        : "bg-slate-100 text-slate-700";

  const summaryRows = [
    { label: "Overall %", value: report?.overallPercentage != null ? `${report.overallPercentage.toFixed(1)}%` : "—" },
    { label: "Overall Grade", value: report?.overallGrade ?? "—" },
    { label: "Result", value: resultStatus === "—" ? "—" : <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${resultTone}`}>{resultStatus}</span> },
  ];

  return (
    <div className="rounded-md bg-white p-4 shadow-sm border border-slate-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Performance</h1>
          <p className="text-xs text-slate-500">
            {report?.academicYearLabel ? `${report.academicYearLabel}` : "Latest term"}
            {report?.termNumber ? ` • Term ${report.termNumber}` : ""}
          </p>
        </div>
        {report?.className ? (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">
            {report.className}
          </span>
        ) : null}
      </div>

      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">
              {report?.overallPercentage != null ? `${report.overallPercentage.toFixed(1)}%` : "—"}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Score</div>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {summaryRows.map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{row.label}</p>
            <div className="mt-1 flex min-h-[1.75rem] items-center justify-center text-sm font-semibold text-slate-900">
              {typeof row.value === "string" ? row.value : row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Performance;
