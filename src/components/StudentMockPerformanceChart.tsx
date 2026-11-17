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

export type StudentMockPerformancePoint = {
  id: number;
  label: string;
  period: string;
  score: number | null;
};

export default function StudentMockPerformanceChart({
  rows,
  description,
}: {
  rows: StudentMockPerformancePoint[];
  description: string;
}) {
  const hasScores = rows.some((row) => row.score !== null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Mock performance trend
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {hasScores ? (
        <div className="h-64 min-w-0 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={rows}
              margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e9eef5"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                minTickGap={12}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                width={44}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(value: number) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as
                    | StudentMockPerformancePoint
                    | undefined;
                  if (!active || !point || point.score === null) return null;

                  return (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                      <p className="text-xs font-semibold text-slate-800">
                        {point.period} · {point.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-sky-700">
                        {point.score.toFixed(1)}%
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Average score"
                stroke="#0284c7"
                strokeWidth={3}
                connectNulls={false}
                dot={{ r: 4, fill: "#0284c7", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
          Mock performance will appear after scores are recorded.
        </div>
      )}
    </section>
  );
}
