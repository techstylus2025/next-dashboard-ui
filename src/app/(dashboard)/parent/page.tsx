import Announcements from "@/components/Announcements";
import EventCalendar from "@/components/EventCalendar";
import ParentChildSelector from "@/components/ParentChildSelector";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import RoleShell from "@/components/dashboard/RoleShell";
import SectionCard from "@/components/dashboard/SectionCard";
import StatCard from "@/components/dashboard/StatCard";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { CalendarDays, ClipboardCheck, FileText, MessageSquare, School, Sparkles, Users } from "lucide-react";
import { notFound } from "next/navigation";

const ParentPage = async () => {
  const { userId } = await auth();

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

  return (
    <RoleShell
      title={`Welcome back, ${parent.name ?? "Parent"}!`}
      subtitle="Stay close to your child’s learning journey"
      badge={<div className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-200">{currentDate}</div>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Children" value={String(students.length)} detail="Assigned to your profile" accent="from-sky-500 to-blue-600" icon={<Users size={18} />} />
        <StatCard title="Classes" value={students.length > 0 ? students[0]?.class?.name ?? "-" : "-"} detail="Current class overview" accent="from-violet-500 to-indigo-600" icon={<School size={18} />} />
        <StatCard title="Upcoming Events" value="3" detail="School activities this week" accent="from-emerald-500 to-teal-600" icon={<CalendarDays size={18} />} />
        <StatCard title="Attendance" value="96%" detail="This term so far" accent="from-amber-500 to-orange-500" icon={<ClipboardCheck size={18} />} />
      </div>

      <SectionCard title="Your children" subtitle="Track the students linked to your account">
        {students.length > 0 ? (
          <div className="grid gap-4">
            {students.map((student) => (
              <div key={student.id} className="rounded-[22px] border border-slate-200/80 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{student.name} {student.surname}</p>
                    <p className="text-sm text-slate-600">{student.class?.name ?? "No class assigned"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{student.class?.name ?? "Unassigned"}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Birthday</p>
                    <p className="mt-1">{new Intl.DateTimeFormat("en-GB").format(student.birthday)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Contact</p>
                    <p className="mt-1">{student.phone || "-"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No students are currently assigned to your profile.
          </div>
        )}
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Family tools" subtitle="Helpful actions for staying informed">
          <div className="grid gap-3 md:grid-cols-2">
            {([
              ["View Reports", "Monitor academic progress", "/list/grades", <FileText key="reports" size={18} />],
              ["Check Attendance", "See recent attendance", "/list/attendance", <ClipboardCheck key="attendance" size={18} />],
              ["View Timetable", "Plan around school routines", "/list/lessons", <CalendarDays key="timetable" size={18} />],
              ["Message School", "Contact the school quickly", "/list/messages", <MessageSquare key="message" size={18} />],
            ] as Array<[string, string, string, JSX.Element]>).map(([title, description, href, icon], index) => (
              <QuickActionCard key={title} title={title} description={description} href={href} icon={icon} colorVariant={index as 0 | 1 | 2 | 3} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Parent updates" subtitle="Recent school communication">
          <div className="space-y-3">
            {[
              ["Science fair reminder", "A reminder was sent about the upcoming event", "10m ago"],
              ["Report card release", "Your child’s report card is now available", "1h ago"],
              ["School assembly", "The next assembly is scheduled for Friday", "2h ago"],
            ].map(([activity, description, time]) => (
              <div key={activity} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Sparkles size={16} /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{activity}</p>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
                <span className="text-xs font-medium text-slate-400">{time}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_22px_45px_-24px_rgba(7,26,73,0.2)]">
          <ParentChildSelector students={students} />
        </div>
        <div className="flex flex-col gap-5">
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_22px_45px_-24px_rgba(7,26,73,0.2)]">
            <EventCalendar />
          </div>
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_22px_45px_-24px_rgba(7,26,73,0.2)]">
            <Announcements />
          </div>
        </div>
      </div>
    </RoleShell>
  );
};

export default ParentPage;