import Announcements from "@/components/Announcements";
import Avatar from "@/components/Avatar";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendar from "@/components/EventCalendar";
import FormContainer from "@/components/FormContainer";
import prisma from "@/lib/prisma";
import { getCurrentAuthContext } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleTeacherPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { role } = await getCurrentAuthContext();

  const [teacher, attendanceCount, presentAttendanceCount, classes] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id },
      include: {
        subjects: { select: { id: true, name: true } },
        assignedClasses: { select: { id: true, name: true } },
        _count: {
          select: {
            subjects: true,
            lessons: true,
            classes: true,
          },
        },
      },
    }),
    prisma.attendance.count({ where: { teacherId: id, isArchived: false } }),
    prisma.attendance.count({ where: { teacherId: id, present: true, isArchived: false } }),
    prisma.class.findMany({
      where: {
        OR: [
          { supervisorId: id },
          { assignedTeachers: { some: { id } } },
          { lessons: { some: { teacherId: id } } },
        ],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!teacher) {
    return notFound();
  }

  const attendanceRate = attendanceCount
    ? Math.round((presentAttendanceCount / attendanceCount) * 100)
    : null;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <section className="rounded-md bg-lamaSky px-4 py-4 shadow-sm lg:flex-[1.45] xl:min-w-[440px]">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="relative shrink-0">
                <Avatar
                  src={teacher.img ?? undefined}
                  name={`${teacher.name} ${teacher.surname}`}
                  alt={`${teacher.name} ${teacher.surname}`}
                  size={144}
                  className="h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36"
                />
                {role === "admin" && (
                  <div className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2">
                    <FormContainer table="teacher" type="update" data={teacher} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-600">Teacher profile</p>
                  <h1 className="text-base font-semibold text-slate-950 sm:text-lg lg:text-xl">
                    {teacher.name} {teacher.surname}
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 sm:text-sm">
                  <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/25 px-2 py-1.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs text-rose-700">BT</span>
                    <span className="min-w-0 break-words">{teacher.bloodType || "-"}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/25 px-2 py-1.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs text-sky-700">DOB</span>
                    <span className="min-w-0 break-words">{new Intl.DateTimeFormat("en-GB").format(teacher.birthday)}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/25 px-2 py-1.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs text-violet-700">@</span>
                    <span className="min-w-0 break-all">{teacher.email || "-"}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/25 px-2 py-1.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs text-amber-700">TEL</span>
                    <span className="min-w-0 break-words">{teacher.phone || "-"}</span>
                  </div>
                </div>

                <div className="mt-3 border-t border-white/60 pt-3 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">Address</p>
                  <p className="break-words">{teacher.address || "No address recorded"}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="w-full space-y-2 lg:ml-auto lg:max-w-[420px] lg:flex-1 xl:max-w-[480px]">
            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Account details</h2>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-500">Username</span>
                  <span className="truncate text-right font-semibold text-slate-700">{teacher.username || "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-500">Sex</span>
                  <span className="font-semibold capitalize text-slate-700">{teacher.sex.toLowerCase()}</span>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <MetricCard label="Subjects" value={teacher._count.subjects} tone="violet" />
              <MetricCard label="Lessons" value={teacher._count.lessons} tone="amber" />
              <MetricCard label="Classes" value={classes.length} tone="emerald" />
            </div>

            <section className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">%</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Staff attendance</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {attendanceRate === null ? "No attendance recorded" : `${attendanceRate}% present (${presentAttendanceCount}/${attendanceCount})`}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="mt-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <header className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Timetable</p>
              <h2 className="text-xl font-semibold text-slate-950">{teacher.name}&apos;s schedule</h2>
            </div>
            <span className="text-sm text-slate-500">Weekly lessons</span>
          </header>
          <BigCalendarContainer type="teacherId" id={teacher.id} />
        </section>

        <section className="mt-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Teaching portfolio</h2>
            <p className="text-sm text-slate-500">Subjects and classes currently linked to this teacher.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.length ? teacher.subjects.map((subject) => (
                  <span key={subject.id} className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800">{subject.name}</span>
                )) : <p className="text-sm text-slate-500">No subjects assigned.</p>}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Classes</h3>
              <div className="flex flex-wrap gap-2">
                {classes.length ? classes.map((classItem) => (
                  <span key={classItem.id} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">{classItem.name}</span>
                )) : <p className="text-sm text-slate-500">No classes assigned.</p>}
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside className="flex w-full flex-col gap-4 xl:w-1/3">
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Shortcuts</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-700">
            <Shortcut href={`/list/classes?supervisorId=${teacher.id}`} label="Teacher's classes" tone="sky" />
            <Shortcut href={`/list/students?teacherId=${teacher.id}`} label="Teacher's students" tone="violet" />
            <Shortcut href={`/list/lessons?teacherId=${teacher.id}`} label="Teacher's lessons" tone="amber" />
            <Shortcut href={`/list/exams?teacherId=${teacher.id}`} label="Teacher's exams" tone="rose" />
            <Shortcut href={`/list/assignments?teacherId=${teacher.id}`} label="Teacher's assignments" tone="emerald" />
          </div>
        </section>
        <EventCalendar />
        <Announcements />
      </aside>
    </div>
  );
};

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "violet" | "amber" | "emerald";
}) {
  const tones = {
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white p-1.5 shadow-sm sm:gap-2 sm:p-2">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tones[tone]}`}>{value}</span>
      <span className="truncate text-[10px] font-medium text-slate-600 sm:text-xs">{label}</span>
    </div>
  );
}

function Shortcut({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: "sky" | "violet" | "amber" | "rose" | "emerald";
}) {
  const tones = {
    sky: "bg-sky-50 text-sky-800 hover:bg-sky-100",
    violet: "bg-violet-50 text-violet-800 hover:bg-violet-100",
    amber: "bg-amber-50 text-amber-800 hover:bg-amber-100",
    rose: "bg-rose-50 text-rose-800 hover:bg-rose-100",
    emerald: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  };

  return <Link className={`rounded-md px-3 py-2 transition-colors ${tones[tone]}`} href={href}>{label}</Link>;
}

export default SingleTeacherPage;