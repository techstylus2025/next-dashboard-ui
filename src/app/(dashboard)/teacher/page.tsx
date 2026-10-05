import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import { getCurrentAuthContext } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Day } from "@prisma/client";
import Link from "next/link";
import { ClipboardCheck, FileText, GraduationCap, MessageSquare, NotebookPen, Users } from "lucide-react";

const TeacherPage = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const { userId } = await getCurrentAuthContext();

  if (!userId) {
    return (
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Your session is still loading. Please refresh if this continues.</p>
      </div>
    );
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  const today = new Date();
  const todayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(today).toUpperCase();
  
  const validDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const isWeekday = validDays.includes(todayName);

  const [classes, lessonCount, examCount, assignmentCount, todayLessons] = await Promise.all([
    prisma.class.findMany({
      where: {
        OR: [
          { supervisorId: userId },
          { assignedTeachers: { some: { id: userId } } },
          { lessons: { some: { teacherId: userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        _count: { select: { students: { where: { isArchived: false } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.lesson.count({ where: { teacherId: userId } }),
    prisma.exam.count({ where: { isArchived: false, lesson: { teacherId: userId } } }),
    prisma.assignment.count({ where: { isArchived: false, lesson: { teacherId: userId } } }),
    isWeekday
      ? prisma.lesson.findMany({
          where: { teacherId: userId, day: todayName as Day },
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            class: { select: { name: true } },
            subject: { select: { name: true } },
          },
          orderBy: { startTime: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const classIds = classes.map((classItem) => classItem.id);
  const [performance, recentAttendance] = await Promise.all([
    Promise.all(classes.map(async (classItem) => {
      const reportStats = await prisma.termlyReport.aggregate({
        where: {
          classId: classItem.id,
          overallPercentage: { not: null },
          student: { isArchived: false },
        },
        _avg: { overallPercentage: true },
        _count: { _all: true },
      });
      return {
        classId: classItem.id,
        className: classItem.name,
        averagePercentage: reportStats._avg.overallPercentage,
        reportCount: reportStats._count._all,
      };
    })),
    classIds.length
      ? prisma.attendance.findMany({
          where: {
            isArchived: false,
            studentId: { not: null },
            student: { classId: { in: classIds }, isArchived: false },
            date: { lte: today },
          },
          select: {
            id: true,
            date: true,
            present: true,
            student: {
              select: {
                name: true,
                surname: true,
                class: { select: { name: true } },
              },
            },
          },
          orderBy: { date: "desc" },
          take: 4,
        })
      : Promise.resolve([]),
  ]);

  const totalStudents = classes.reduce((total, classItem) => total + classItem._count.students, 0);
  const assessments = examCount + assignmentCount;
  const performanceRows = performance.filter((item) => item.reportCount > 0 && item.averagePercentage !== null);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const teacherFirstName = teacher?.name?.trim().split(/\s+/)[0] || "there";
  const teacherActions = [
    { title: "Plan a lesson", description: "Prepare upcoming teaching", href: "/list/lessons", icon: <NotebookPen size={18} />, color: "bg-sky-100 text-sky-700" },
    { title: "Create an assessment", description: "Set exams and assignments", href: "/list/exams", icon: <ClipboardCheck size={18} />, color: "bg-amber-100 text-amber-700" },
    { title: "Enter results", description: "Record student progress", href: "/list/results", icon: <FileText size={18} />, color: "bg-emerald-100 text-emerald-700" },
    { title: "Message families", description: "Contact parents and students", href: "/list/messages", icon: <MessageSquare size={18} />, color: "bg-rose-100 text-rose-700" },
  ];

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Teacher workspace
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {teacherFirstName}</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
              Your classes, teaching day, and student progress at a glance.
            </p>
          </div>
          <div className="border-t border-white/15 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-200">Today</p>
            <p className="mt-1 text-sm font-medium text-white">{currentDate}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Teaching overview">
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700"><Users size={20} /></div>
          <div><p className="text-sm text-slate-500">Classes</p><p className="mt-0.5 text-2xl font-semibold text-slate-950">{classes.length}</p></div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><GraduationCap size={20} /></div>
          <div><p className="text-sm text-slate-500">Active students</p><p className="mt-0.5 text-2xl font-semibold text-slate-950">{totalStudents}</p></div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><NotebookPen size={20} /></div>
          <div><p className="text-sm text-slate-500">Teaching lessons</p><p className="mt-0.5 text-2xl font-semibold text-slate-950">{lessonCount}</p></div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700"><ClipboardCheck size={20} /></div>
          <div>
            <p className="text-sm text-slate-500">Assessments</p>
            <p className="mt-0.5 text-2xl font-semibold text-slate-950">{assessments}</p>
            <p className="mt-0.5 text-xs text-slate-500">{examCount} exams · {assignmentCount} assignments</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="today-heading">
          <div className="mb-4">
            <h2 id="today-heading" className="text-lg font-semibold text-slate-950">Today&apos;s schedule</h2>
            <p className="mt-1 text-sm text-slate-500">{today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          {todayLessons.length ? (
            <ol className="space-y-1">
              {todayLessons.map((lesson) => (
                <li key={lesson.id} className="flex gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50">
                  <div className="w-[4.5rem] shrink-0 pt-0.5 text-xs font-semibold text-slate-600">
                    {lesson.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    <span className="mt-1 block font-normal text-slate-400">{lesson.endTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                  <div className="min-w-0 flex-1 border-l-2 border-amber-300 pl-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{lesson.subject.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{lesson.class.name}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-lg bg-slate-50 px-4 py-7 text-center">
              <NotebookPen className="mx-auto text-slate-400" size={22} />
              <p className="mt-3 text-sm font-medium text-slate-700">No lessons on your schedule today.</p>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="classes-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="classes-heading" className="text-lg font-semibold text-slate-950">Your classes</h2>
              <p className="mt-1 text-sm text-slate-500">Classes you teach or supervise</p>
            </div>
            <span className="text-sm font-medium text-slate-500">{classes.length} total</span>
          </div>
          {classes.length ? (
            <ul className="divide-y divide-slate-100">
              {classes.map((classItem) => (
                <li key={classItem.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800"><Users size={18} /></div>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{classItem.name}</p>
                  <span className="shrink-0 text-xs text-slate-500">{classItem._count.students} students</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-slate-50 px-4 py-7 text-center text-sm text-slate-500">No classes are currently assigned to you.</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="performance-heading">
          <div className="mb-4">
            <h2 id="performance-heading" className="text-lg font-semibold text-slate-950">Student performance</h2>
            <p className="mt-1 text-sm text-slate-500">Average term report percentage by class</p>
          </div>
          {performanceRows.length ? (
            <div className="space-y-4">
              {performanceRows.map((row) => (
                <div key={row.classId}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-slate-600">{row.className}</span>
                    <span className="shrink-0 font-semibold text-slate-900">{Number(row.averagePercentage).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.min(100, Math.max(0, Number(row.averagePercentage)))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 px-4 py-7 text-center text-sm text-slate-500">Student results will appear here when they are recorded.</p>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="attendance-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="attendance-heading" className="text-lg font-semibold text-slate-950">Recent attendance</h2>
              <p className="mt-1 text-sm text-slate-500">Latest records across your classes</p>
            </div>
            <Link href="/list/attendance" className="shrink-0 text-sm font-medium text-emerald-800 hover:text-emerald-950">View attendance</Link>
          </div>
          {recentAttendance.length ? (
            <ul className="divide-y divide-slate-100">
              {recentAttendance.map((record) => (
                <li key={record.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${record.present ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {record.present ? "P" : "A"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{record.student?.name} {record.student?.surname}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{record.student?.class.name} · {record.present ? "Present" : "Absent"}</p>
                  </div>
                  <time className="shrink-0 text-xs text-slate-500">{record.date.toLocaleDateString()}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-slate-50 px-4 py-7 text-center text-sm text-slate-500">No recent attendance records for your classes.</p>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="actions-heading">
        <div className="mb-4">
          <h2 id="actions-heading" className="text-lg font-semibold text-slate-950">Quick access</h2>
          <p className="mt-1 text-sm text-slate-500">Common teaching tasks</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {teacherActions.map((action) => (
            <Link key={action.title} href={action.href} className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}>{action.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">{action.title}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{action.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Teaching calendar">
          <BigCalendarContainer type="teacherId" id={userId} />
        </section>
        <div className="flex min-w-0 flex-col gap-6">
          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="School events">
            <EventCalendarContainer searchParams={searchParams} />
          </section>
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;