import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const StudentPage = async () => {
  const { userId } = await auth();

  const student = await prisma.student.findUnique({
    where: { id: userId! },
    include: { class: true },
  });

  if (!student?.class) {
    return (
      <div className="p-4 flex gap-4 flex-col xl:flex-row">
        <div className="w-full xl:w-2/3">
          <div className="h-full bg-white p-4 rounded-3xl shadow-sm border border-slate-200/70">
            <header className="mb-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Schedule</p>
              <h1 className="text-2xl font-semibold text-slate-950">
                {student?.name ? `${student.name} ${student.surname}` : "My schedule"}
              </h1>
            </header>
            <p className="text-sm text-slate-500">No class schedule available yet.</p>
          </div>
        </div>
        <div className="w-full xl:w-1/3 flex flex-col gap-8">
          <EventCalendar />
          <Announcements />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-3xl shadow-sm border border-slate-200/70">
          <header className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Schedule</p>
                <h1 className="text-2xl font-semibold text-slate-950">
                  {`${student.name} ${student.surname}`}
                </h1>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {student.class.name}
              </span>
            </div>
            <p className="text-sm text-slate-500">Lessons are shown for your enrolled class and subjects.</p>
          </header>

          <BigCalendarContainer type="classId" id={student.class.id} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;