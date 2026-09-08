"use client";

import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, CartesianGrid } from "recharts";

export default function FeePaymentChart({ data }: { data: { className: string; paid: number; unpaid: number }[] }) {
  const chartData = data.map((d) => ({ name: d.className, Paid: d.paid, Unpaid: d.unpaid }));
  const hasData = chartData.length > 0 && chartData.some((d) => (d.Paid || d.Unpaid) > 0);

  if (!hasData) {
    return <div className="py-8 text-center text-sm text-slate-500">No fee payment data available for the active term.</div>;
  }

  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Paid" fill="#10b981" />
          <Bar dataKey="Unpaid" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
