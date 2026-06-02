"use client";

import { chartColors, chartPanelClass } from "@/lib/dashboardTheme";
import Image from "next/image";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type FinanceChartPoint = {
  month: string;
  collected: number;
};

const FinanceChart = ({ data }: { data: FinanceChartPoint[] }) => {
  return (
    <div className={`${chartPanelClass} ring-1 ring-violet-100/80`}>
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-slate-800">Finance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartColors.finance.grid}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tick={{ fill: "#94a3b8" }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "#94a3b8" }}
            tickLine={false}
            tickMargin={20}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              borderColor: "#e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          />
          <Legend
            align="center"
            verticalAlign="top"
            wrapperStyle={{ paddingTop: "10px", paddingBottom: "30px" }}
          />
          <Line
            type="monotone"
            dataKey="collected"
            name="Collected"
            stroke={chartColors.finance.income}
            strokeWidth={4}
            dot={{ fill: chartColors.finance.income, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinanceChart;
