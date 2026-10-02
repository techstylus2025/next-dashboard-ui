import Announcements from "@/components/Announcements";
import EventCalendar from "@/components/EventCalendar";
import ParentChildSelector from "@/components/ParentChildSelector";
import { getCurrentAuthContext } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { CalendarDays, ClipboardCheck, FileText, MessageSquare, School, Users } from "lucide-react";
import { notFound } from "next/navigation";

const ParentPage = async () => {
  const { userId } = await getCurrentAuthContext();

  if (!userId) {
    return (
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Your session is still loading. Please refresh if this continues.</p>
      </div>
    );
  }

  let parent;
  try {
    parent = await prisma.parent.findUnique({
      where: { id: userId },
      include: {
        students: {
          include: { class: true },
          orderBy: { name: "asc" },
        },
      },
    });
  } catch (error) {
    console.warn("Failed to load parent dashboard data:", error);
    parent = null;
  }

  if (!parent) {
    return notFound();
  }

  const students = parent.students ?? [];
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const parentFirstName = parent.name?.trim().split(/\s+/)[0] || "there";
  const classCount = new Set(
    students.map((student) => student.class?.id).filter((classId): classId is number => classId !== undefined)
  ).size;
  const scheduledStudentCount = students.filter((student) => student.class).length;

  const parentActions = [
    { title: "Academic reports", description: "Review learning progress", href: "/list/grades", icon: <FileText size={18} />, color: "bg-sky-100 text-sky-700" },
    { title: "Attendance", description: "Check recent records", href: "/list/attendance", icon: <ClipboardCheck size={18} />, color: "bg-emerald-100 text-emerald-700" },
    { title: "Messages", description: "Contact the school", href: "/list/messages", icon: <MessageSquare size={18} />, color: "bg-amber-100 text-amber-700" },
    { title: "School calendar", description: "See dates and events", href: "/list/events", icon: <CalendarDays size={18} />, color: "bg-rose-100 text-rose-700" },
  ];

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> Family dashboard
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back, {parentFirstName}</h1>
            <p className="mt-2 max-w-xl text-sm text-emerald-50/80 sm:text-base">
              A clear view of your children&apos;s school life, all in one place.
            </p>
          </div>
          <div className="border-t border-white/15 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-200">Today</p>
            <p className="mt-1 text-sm font-medium text-white">{currentDate}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Family overview">
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700"><Users size={20} /></div>
          <div>
            <p className="text-sm text-slate-500">Children</p>
            <p className="mt-0.5 text-2xl font-semibold text-slate-950">{students.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><School size={20} /></div>
          <div>
            <p className="text-sm text-slate-500">Classes</p>
            <p className="mt-0.5 text-2xl font-semibold text-slate-950">{classCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700"><CalendarDays size={20} /></div>
          <div>
            <p className="text-sm text-slate-500">Class schedules</p>
            <p className="mt-0.5 text-2xl font-semibold text-slate-950">{scheduledStudentCount}<span className="ml-1 text-sm font-normal text-slate-500">of {students.length}</span></p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="children-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="children-heading" className="text-lg font-semibold text-slate-950">Your children</h2>
              <p className="mt-1 text-sm text-slate-500">Students connected to your parent account</p>
            </div>
            <span className="text-sm font-medium text-slate-500">{students.length} total</span>
          </div>
          {students.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {students.map((student) => (
                <li key={student.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-800">
                    {student.name.charAt(0)}{student.surname.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{student.name} {student.surname}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{student.class?.name ?? "No class assigned"}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${student.class ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {student.class ? "Enrolled" : "Unassigned"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <Users className="mx-auto text-slate-400" size={24} />
              <p className="mt-3 text-sm font-medium text-slate-700">No students are linked to your account yet.</p>
              <p className="mt-1 text-sm text-slate-500">Contact the school office to connect your family profile.</p>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="actions-heading">
          <div className="mb-4">
            <h2 id="actions-heading" className="text-lg font-semibold text-slate-950">Quick access</h2>
            <p className="mt-1 text-sm text-slate-500">The things families check most</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {parentActions.map((action) => (
              <Link key={action.title} href={action.href} className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}>{action.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{action.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{action.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <section className="min-w-0" aria-label="Children's class schedules">
          <ParentChildSelector students={students} />
        </section>
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="calendar-heading">
            <div className="mb-3">
              <h2 id="calendar-heading" className="text-lg font-semibold text-slate-950">School calendar</h2>
              <p className="mt-1 text-sm text-slate-500">Plan ahead for school dates and events</p>
            </div>
            <EventCalendar />
          </section>
          <Announcements />
        </div>
      </div>
    </div>
  );
};

export default ParentPage;