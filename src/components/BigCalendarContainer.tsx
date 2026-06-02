import prisma from "@/lib/prisma";
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const dataRes = await prisma.lesson.findMany({
    where: {
      ...(type === "teacherId"
        ? { teacherId: id as string }
        : { classId: id as number }),
    },
    include: { subject: true },
  });

  const data = dataRes.map((lesson) => ({
    title: lesson.subject?.name ? `${lesson.subject.name} • ${lesson.name}` : lesson.name,
    start: lesson.startTime,
    end: lesson.endTime,
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="min-h-[24rem] md:min-h-[32rem] rounded-3xl bg-slate-50 p-2 md:p-4">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
