import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import RoleShell from "@/components/dashboard/RoleShell";
import SectionCard from "@/components/dashboard/SectionCard";
import StatCard from "@/components/dashboard/StatCard";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import { ClipboardCheck, FileText, GraduationCap, MessageSquare, NotebookPen, Sparkles, Users } from "lucide-react";

const TeacherPage = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Your session is still loading. Please refresh if this continues.</p>
      </div>
    );
  }

  let teacher;
  try {
    teacher = await prisma.teacher.findUnique({
      where: { id: userId },
      include: { subjects: true },
    });
  } catch (error) {
    console.warn("Failed to load teacher dashboard data:", error);
    teacher = null;
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <RoleShell
      title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${teacher?.name ?? "Teacher"}!`}
      subtitle="Teach • Guide • Inspire"
      badge={<div className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-200">{currentDate}</div>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="My Classes" value="Basic 4" detail="4 classes assigned" accent="from-sky-500 to-blue-600" icon={<Users size={18} />} />
        <StatCard title="Total Students" value="120" detail="Across your teaching groups" accent="from-violet-500 to-indigo-600" icon={<GraduationCap size={18} />} />
        <StatCard title="Lesson Plans" value="8" detail="Prepared for the week" accent="from-emerald-500 to-teal-600" icon={<NotebookPen size={18} />} />
        <StatCard title="Assessments" value="6" detail="Pending review" accent="from-amber-500 to-orange-500" icon={<ClipboardCheck size={18} />} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="My Classes" subtitle="Review the classes attached to your teaching portfolio">
          <div className="grid gap-3 md:grid-cols-2">
            {["Basic 4", "Basic 5", "Basic 6", "Basic 7"].map((name) => (
              <div key={name} className="rounded-[22px] border border-slate-200/80 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{name}</p>
                    <p className="text-sm text-slate-500">{name === "Basic 4" ? "32 Students" : name === "Basic 5" ? "28 Students" : name === "Basic 6" ? "30 Students" : "30 Students"}</p>
                  </div>
                  <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">View</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Today's Schedule" subtitle="Your lessons for the day">
          <div className="space-y-3">
            {[
              ["08:00 – 09:00", "Basic 4 · English Language"],
              ["09:00 – 10:00", "Basic 5 · Mathematics"],
              ["10:30 – 11:30", "Basic 6 · Science"],
              ["12:00 – 01:00", "Basic 7 · Social Studies"],
            ].map(([time, lesson]) => (
              <div key={time} className="rounded-[20px] border border-slate-200/80 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{time}</p>
                <p className="mt-1 text-sm text-slate-500">{lesson}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Student Performance" subtitle="View progress for your assigned classes">
        <div className="rounded-[24px] border border-slate-200/70 bg-slate-50 p-4">
          <div className="flex flex-col gap-3">
            {[
              ["Basic 4", 84],
              ["Basic 5", 80],
              ["Basic 6", 87],
              ["Basic 7", 82],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                  <span>{label}</span>
                  <span className="font-semibold text-slate-900">{value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200">
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Quick Actions" subtitle="Daily teacher tasks">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { title: "Create Lesson Plan", description: "Plan upcoming teaching", href: "/list/lessons", icon: <NotebookPen size={18} /> },
              { title: "Record Assessment", description: "Track class progress", href: "/list/exams", icon: <ClipboardCheck size={18} /> },
              { title: "Enter Results", description: "Submit performance outcomes", href: "/list/results", icon: <FileText size={18} /> },
              { title: "Send Message", description: "Communicate with families", href: "/list/messages", icon: <MessageSquare size={18} /> },
            ].map((action, index) => (
              <QuickActionCard key={action.title} title={action.title} description={action.description} href={action.href} icon={action.icon} colorVariant={index as 0 | 1 | 2 | 3} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Activities" subtitle="Teaching updates and progress">
          <div className="space-y-3">
            {[
              ["Attendance recorded", "Basic 4", "10m ago"],
              ["Assessment submitted", "Science", "1h ago"],
              ["Lesson plan created", "English", "2h ago"],
            ].map(([activity, subject, time]) => (
              <div key={activity} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Sparkles size={16} /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{activity}</p>
                  <p className="text-sm text-slate-500">{subject}</p>
                </div>
                <span className="text-xs font-medium text-slate-400">{time}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_22px_45px_-24px_rgba(7,26,73,0.2)]">
          <BigCalendarContainer type="teacherId" id={userId} />
        </div>
        <div className="flex flex-col gap-5">
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_22px_45px_-24px_rgba(7,26,73,0.2)]">
            <EventCalendarContainer searchParams={searchParams} />
          </div>
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_22px_45px_-24px_rgba(7,26,73,0.2)]">
            <Announcements />
          </div>
        </div>
      </div>
    </RoleShell>
  );
};

export default TeacherPage;