import Announcements from "@/components/Announcements";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import PasswordChangeApprovalPanel from "@/components/PasswordChangeApprovalPanel";
import SectionCard from "@/components/dashboard/SectionCard";
import StatCard from "@/components/dashboard/StatCard";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import PerformanceComparePanel from "@/components/dashboard/PerformanceComparePanel";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import FeePaymentChart from "@/components/dashboard/FeePaymentChart";
import AdminDashboardAutoRefresh from "@/components/dashboard/AdminDashboardAutoRefresh";
import { getPendingPasswordChangeRequests } from "@/lib/profileActions";
import { loadAdminDashboardSummary } from "@/lib/dashboardStats";
import { CalendarDays, ChartColumn, GraduationCap, Megaphone, School, Sparkles, Users, ClipboardCheck, BookOpen, FileText, Bell, PlusCircle } from "lucide-react";
import Link from "next/link";

const AdminPage = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const [pendingRequests, summary] = await Promise.all([
    getPendingPasswordChangeRequests(),
    loadAdminDashboardSummary(),
  ]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  const attendanceDonutStyle = {
    background: `conic-gradient(#0ea5e9 0 ${summary.attendanceTodayRate}%, #e2e8f0 ${summary.attendanceTodayRate}% 100%)`,
  };

  const quickActions = [
    { title: "Add Student", description: "Register a new learner", href: "/list/students", icon: <PlusCircle size={18} /> },
    { title: "Add Teacher", description: "Add a new staff member", href: "/list/teachers", icon: <Users size={18} /> },
    { title: "Create Book", description: "Add new book stock", href: "/list/purchase-books", icon: <BookOpen size={18} /> },
    { title: "Enter Results", description: "Record student performance", href: "/list/results", icon: <ClipboardCheck size={18} /> },
    { title: "Generate Report", description: "Prepare academic reports", href: "/list/exams", icon: <FileText size={18} /> },
    { title: "Record Attendance", description: "Mark daily class attendance", href: "/list/attendance", icon: <CalendarDays size={18} /> },
    { title: "Send Announcement", description: "Share updates with the school", href: "/list/announcements", icon: <Megaphone size={18} /> },
    { title: "Create Event", description: "Set up a school activity", href: "/list/events", icon: <Bell size={18} /> },
  ];

  return (
    <main className="min-h-full space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <AdminDashboardAutoRefresh />
      <header className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 right-1/3 -z-10 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              School administration
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting}, Admin
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Your school at a glance. Review today&apos;s activity and keep learning, operations, and families moving forward.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/15 text-sky-200">
                <CalendarDays size={19} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Today</p>
                <p className="mt-0.5 text-sm font-medium text-white">{currentDate}</p>
              </div>
            </div>
            <Link
              href="/list/students"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/20 transition hover:bg-sky-300"
            >
              <PlusCircle size={17} />
              Add a student
            </Link>
          </div>
        </div>
      </header>

      <section aria-label="School overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={summary.totalStudents.toLocaleString()} detail="Registered learners in the school" accent="from-sky-500 to-blue-600" icon={<GraduationCap size={18} />} />
        <StatCard title="Teachers" value={summary.totalTeachers.toLocaleString()} detail="Active teaching staff" accent="from-violet-500 to-indigo-600" icon={<Users size={18} />} />
        <StatCard title="Classes" value={summary.totalClasses.toLocaleString()} detail="Currently available classes" accent="from-emerald-500 to-teal-600" icon={<School size={18} />} />
        <StatCard title="Attendance Today" value={`${summary.attendanceTodayRate}%`} detail={`${summary.attendanceTodayPresent}/${summary.attendanceTodayTotal} marked`} accent="from-amber-500 to-orange-500" icon={<ChartColumn size={18} />} />
      </section>
      <SectionCard title="Quick Actions" subtitle="Move quickly across the most common school operations">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action, index) => (
            <QuickActionCard key={action.title} {...action} colorVariant={index as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7} />
          ))}
        </div>
      </SectionCard>
      <section className="space-y-4" aria-label="Academic performance">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Academic insights</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Learning performance</h2>
          </div>
        </div>
        <SectionCard title="Student Performance" subtitle="Average academic performance by class">
          <PerformanceComparePanel initialTerms={
            summary.performanceByTerm && summary.performanceByTerm.length > 0
              ? summary.performanceByTerm.map((t) => ({
                  termKey: t.termKey,
                  label: t.label,
                  classes: t.performanceByClass.map((c, idx) => ({ classId: idx + 1, className: c.className, subjects: [] })),
                }))
              : undefined
          } />
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SectionCard title="Attendance Overview" subtitle="Daily present and absent split">
            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
              <div className="flex items-center justify-center">
                <div className="h-32 w-32 rounded-full flex items-center justify-center" style={attendanceDonutStyle}>
                  <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-slate-950">{summary.attendanceTodayRate}%</p>
                      <p className="text-xs text-slate-500">Students Present</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-3">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Students</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Present</p>
                          <p className="text-sm text-slate-500">{summary.attendanceTodayPresent} ({summary.attendanceTodayRate}%)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="inline-block h-3 w-3 rounded-full bg-rose-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Absent</p>
                          <p className="text-sm text-slate-500">{Math.max(summary.attendanceTodayTotal - summary.attendanceTodayPresent, 0)} ({summary.attendanceTodayTotal ? Math.round(((summary.attendanceTodayTotal - summary.attendanceTodayPresent) / summary.attendanceTodayTotal) * 100) : 0}%)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {summary.teacherAttendance ? (
                    <div className="rounded-2xl bg-white p-3">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Teachers</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Present</p>
                            <p className="text-sm text-slate-500">{summary.teacherAttendance.present} ({summary.teacherAttendance.rate}%)</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Absent</p>
                            <p className="text-sm text-slate-500">{Math.max(summary.teacherAttendance.total - summary.teacherAttendance.present, 0)} ({summary.teacherAttendance.total ? 100 - summary.teacherAttendance.rate : 0}%)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl bg-white p-3">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Class Attendance</p>
                  <div className="space-y-3">
                    {summary.classAttendanceRates.map((item) => (
                      <div key={item.className}>
                        <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                          <span>{item.className}</span>
                          <span className="font-semibold text-slate-900">{item.rate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600" style={{ width: `${item.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Upcoming Events" subtitle="Important school milestones">
            <UpcomingEvents events={summary.upcomingEvents} />
          </SectionCard>
        </div>
      </section>

      <section className="space-y-4" aria-label="School operations">
        <div className="px-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">School operations</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Stay on top of the day</h2>
        </div>
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        <SectionCard title="Recent Activities" subtitle="Live school activity feed">
          <div className="space-y-3">
            {summary.recentActivities.map((activity) => (
              <div key={`${activity.title}-${activity.detail}`} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Sparkles size={16} /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                  <p className="text-sm text-slate-500">{activity.detail}</p>
                </div>
                <span className="text-xs font-medium text-slate-400">{activity.timeLabel}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Fee Payments by Class" subtitle="Students paid vs unpaid (active term)">
          <div className="rounded-2xl bg-white p-3">
              <FeePaymentChart data={summary.feePaymentByClass ?? []} />
          </div>
        </SectionCard>

        <SectionCard title="Announcements" subtitle="Latest school notices">
          <Announcements omitWrapper omitHeader />
        </SectionCard>
      </div>

      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <EventCalendarContainer searchParams={searchParams} />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <PasswordChangeApprovalPanel initialRequests={pendingRequests} />
        </div>
      </div>
      </section>
    </main>
  );
};

export default AdminPage;
