import { chartPanelClass } from "@/lib/dashboardTheme";
import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import prisma from "@/lib/prisma";

const AttendanceChartContainer = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysSinceMonday);

  const weekDays = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const startDate = new Date(weekDays[0]);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(weekDays[4]);
  endDate.setHours(23, 59, 59, 999);

  const resData = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      present: true,
    },
  });

  const attendanceMap: Record<string, { present: number; absent: number }> = {};

  weekDays.forEach((date) => {
    attendanceMap[date.toISOString().slice(0, 10)] = {
      present: 0,
      absent: 0,
    };
  });

  resData.forEach((item) => {
    const dateKey = new Date(item.date).toISOString().slice(0, 10);
    if (!attendanceMap[dateKey]) return;

    if (item.present) {
      attendanceMap[dateKey].present += 1;
    } else {
      attendanceMap[dateKey].absent += 1;
    }
  });

  const data = weekDays.map((date) => {
    const dateKey = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    });

    return {
      name: label,
      present: attendanceMap[dateKey].present,
      absent: attendanceMap[dateKey].absent,
    };
  });

  return (
    <div className={`${chartPanelClass} ring-1 ring-emerald-100/80`}>
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-slate-800">Attendance</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      <AttendanceChart data={data} />
    </div>
  );
};

export default AttendanceChartContainer;
