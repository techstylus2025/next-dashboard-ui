import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendar from "@/components/EventCalendar";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import PasswordChangeApprovalPanel from "@/components/PasswordChangeApprovalPanel";
import UserCard from "@/components/UserCard";
import DashboardStatCard from "@/components/DashboardStatCard";
import { getPendingPasswordChangeRequests } from "@/lib/profileActions";
import { loadAdminDashboardSummary } from "@/lib/dashboardStats";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const [pendingRequests, summary] = await Promise.all([
    getPendingPasswordChangeRequests(),
    loadAdminDashboardSummary(),
  ]);

  return (
    <div className="p-4 grid gap-8 xl:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <UserCard type="admin" />
          <UserCard type="student" />
          <UserCard type="teacher" />
          <UserCard type="parent" />
          <DashboardStatCard
            label="Classes"
            value={String(summary.totalClasses)}
            detail="Active classes in the current term"
            className="bg-gradient-to-br from-sky-400 to-blue-600 shadow-md shadow-sky-500/35 ring-2 ring-white/20 text-white"
          />
          <DashboardStatCard
            label="Friday event"
            value={summary.currentFridayEvent?.title ?? "No Friday event"}
            badge="Friday"
            detail={
              summary.currentFridayEvent
                ? `${summary.currentFridayEvent.className ?? "General"} · ${summary.currentFridayEvent.startTime} - ${summary.currentFridayEvent.endTime}`
                : "No Friday event scheduled for this week"
            }
            className="bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/35 ring-2 ring-white/20 text-white"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="h-[450px] min-h-[320px] rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm p-4">
            <CountChartContainer />
          </div>
          <div className="h-[450px] min-h-[320px] rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm p-4">
            <AttendanceChartContainer />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm h-[500px]">
          <FinanceChart data={summary.monthlyPayments} />
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
          <EventCalendarContainer searchParams={searchParams} />
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
          <Announcements />
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
          <PasswordChangeApprovalPanel initialRequests={pendingRequests} />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
