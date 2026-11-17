"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  title: string;
  description: string;
  presentCount: number;
  totalCount: number;
  rate: number | null;
  accentColor: string;
  unit: "teacher" | "student";
};

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

export default function AttendanceRateCard({
  title,
  description,
  presentCount,
  totalCount,
  rate,
  accentColor,
  unit,
}: Props) {
  const chartData = [
    { name: "Present", value: presentCount },
    { name: "Not present", value: Math.max(totalCount - presentCount, 0) },
  ];

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="min-w-0">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        <p className="mt-4 text-sm font-medium text-slate-700">
          {totalCount
            ? `${presentCount.toLocaleString()} of ${totalCount.toLocaleString()} present`
            : "No attendance data available"}
        </p>
      </div>
      <div
        className="relative h-24 w-24 shrink-0"
        role="img"
        aria-label={`${title}: ${rate === null ? "no data" : `${rate}% present`}`}
      >
        {totalCount > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="72%"
                outerRadius="96%"
                paddingAngle={presentCount > 0 && presentCount < totalCount ? 3 : 0}
                stroke="none"
              >
                <Cell fill={accentColor} />
                <Cell fill="#e2e8f0" />
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [
                  `${Number(value).toLocaleString()} ${
                    Number(value) === 1 ? unit : `${unit}s`
                  }`,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-full border-[10px] border-slate-100" />
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-slate-900">
          {rate === null ? "—" : `${rate}%`}
        </span>
      </div>
    </article>
  );
}
