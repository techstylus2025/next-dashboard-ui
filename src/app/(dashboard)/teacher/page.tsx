import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const TeacherPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId } = await auth();
  const teacher = await prisma.teacher.findUnique({
    where: { id: userId! },
    include: { subjects: true },
  });

  const teacherSubjectNames = teacher?.subjects?.map((subject) => subject.name) ?? [];

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        <div className="h-full bg-white p-4 rounded-3xl shadow-sm border border-slate-200/70">
          <header className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Schedule</p>
                <h1 className="text-2xl font-semibold text-slate-950">
                  {teacherSubjectNames.length > 0 ? teacherSubjectNames.join(" • ") : "My teaching schedule"}
                </h1>
              </div>
              {teacherSubjectNames.length > 0 && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {teacherSubjectNames.length} subject{teacherSubjectNames.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Lessons are filtered to the classes where you teach these subjects.
            </p>
          </header>

          <BigCalendarContainer type="teacherId" id={userId!} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendarContainer searchParams={searchParams} />
        <Announcements />
      </div>
    </div>
  );
};

export default TeacherPage;