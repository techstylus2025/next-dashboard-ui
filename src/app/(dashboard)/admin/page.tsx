import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import PasswordChangeApprovalPanel from "@/components/PasswordChangeApprovalPanel";
import RoleShell from "@/components/dashboard/RoleShell";
import SectionCard from "@/components/dashboard/SectionCard";
import StatCard from "@/components/dashboard/StatCard";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import EmptyState from "@/components/EmptyState";
import TermPerformanceToggle from "@/components/dashboard/TermPerformanceToggle";
import AdminDashboardAutoRefresh from "@/components/dashboard/AdminDashboardAutoRefresh";
import { getPendingPasswordChangeRequests } from "@/lib/profileActions";
import { loadAdminDashboardSummary } from "@/lib/dashboardStats";
import { CalendarDays, ChartColumn, GraduationCap, Megaphone, School, Sparkles, Users, ClipboardCheck, BookOpen, FileText, Bell, PlusCircle } from "lucide-react";

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
    <>
      <AdminDashboardAutoRefresh />
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value={summary.totalStudents.toLocaleString()} detail="Registered learners in the school" accent="from-sky-500 to-blue-600" icon={<GraduationCap size={18} />} />
        <StatCard title="Teachers" value={summary.totalTeachers.toLocaleString()} detail="Active teaching staff" accent="from-violet-500 to-indigo-600" icon={<Users size={18} />} />
        <StatCard title="Classes" value={summary.totalClasses.toLocaleString()} detail="Currently available classes" accent="from-emerald-500 to-teal-600" icon={<School size={18} />} />
        <StatCard title="Attendance Today" value={`${summary.attendanceTodayRate}%`} detail={`${summary.attendanceTodayPresent}/${summary.attendanceTodayTotal} marked`} accent="from-amber-500 to-orange-500" icon={<ChartColumn size={18} />} />
      </div>
      <SectionCard title="Quick Actions" subtitle="Move quickly across the most common school operations">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {quickActions.map((action, index) => (
            <QuickActionCard key={action.title} {...action} colorVariant={index as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7} />
          ))}
        </div>
      </SectionCard>
      <div className="grid gap-4">
        <SectionCard title="Student Performance" subtitle="Average academic performance by class">
          <div className="rounded-[14px] border border-slate-200/70 bg-slate-50 p-3">
            <TermPerformanceToggle
              terms={
                summary.performanceByTerm && summary.performanceByTerm.length > 0
                  ? summary.performanceByTerm
                  : [
                      {
                        termKey: "latest",
                        label: "Latest",
                        performanceByClass: summary.performanceByClass,
                      },
                    ]
              }
            />
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionCard title="Attendance Overview" subtitle="Daily present and absent split">
            <div className="rounded-[24px] border border-slate-200/70 bg-slate-50 p-4">
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
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
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
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

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
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
            </div>
          </SectionCard>

          <SectionCard title="Upcoming Events" subtitle="Important school milestones">
            <div className="space-y-3">
              {summary.upcomingEvents.length > 0 ? summary.upcomingEvents.map((event) => (
                <div key={event.title} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{event.timeLabel}</p>
                  <p className="mt-1 text-sm text-slate-500">{event.location}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No upcoming events are scheduled yet.</p>}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        <SectionCard title="Recent Activities" subtitle="Live school activity feed">
          <div className="space-y-3">
            {summary.recentActivities.map((activity) => (
              <div key={`${activity.title}-${activity.detail}`} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
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

        <SectionCard title="Upcoming Events" subtitle="Important school milestones">
          <div className="space-y-3">
            {summary.upcomingEvents.length > 0 ? summary.upcomingEvents.map((event) => (
              <div key={event.title} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{event.title}</p>
                <p className="mt-1 text-sm text-slate-500">{event.timeLabel}</p>
                <p className="mt-1 text-sm text-slate-500">{event.location}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No upcoming events are scheduled yet.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Announcements" subtitle="Latest school notices">
          <Announcements omitWrapper omitHeader />
        </SectionCard>
      </div>

      

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        <div className="rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-[0_22px_45px_-24px_rgba(7,26,73,0.2)]">
          <EventCalendarContainer searchParams={searchParams} />
        </div>
        <div className="rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-[0_22px_45px_-24px_rgba(7,26,73,0.2)]">
          <PasswordChangeApprovalPanel initialRequests={pendingRequests} />
        </div>
      </div>
    </>
  );
};

export default AdminPage;
