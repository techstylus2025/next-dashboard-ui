"use client";

import { chartColors } from "@/lib/dashboardTheme";
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

const AttendanceChart = ({
  data,
}: {
  data: { name: string; present: number; absent: number }[];
}) => {
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={20}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={chartColors.attendance.grid}
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tick={{ fill: "#94a3b8" }}
            tickLine={false}
          />
          <YAxis axisLine={false} tick={{ fill: "#94a3b8" }} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              borderColor: "#e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          />
          <Legend
            align="left"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "20px", paddingBottom: "40px" }}
          />
          <Bar
            dataKey="present"
            fill={chartColors.attendance.present}
            legendType="circle"
            radius={[10, 10, 0, 0]}
          />
          <Bar
            dataKey="absent"
            fill={chartColors.attendance.absent}
            legendType="circle"
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
