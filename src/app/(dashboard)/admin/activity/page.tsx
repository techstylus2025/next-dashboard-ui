import { getCurrentAuthContext } from "@/lib/auth";
import { ITEM_PER_PAGE } from "@/lib/settings";
import prisma from "@/lib/prisma";
import { getDashboardPath } from "@/lib/dashboard";
import ActivityLogFilters from "@/components/activity/ActivityLogFilters";
import { Activity, CalendarClock, Eye, LogIn, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

type ActivityPageProps = {
  searchParams: Promise<{
    q?: string;
    period?: string;
    date?: string;
    role?: string;
    action?: string;
    page?: string;
  }>;
};

const periods = ["24h", "7d", "30d", "all"] as const;
const roles = ["admin", "teacher", "student", "parent"] as const;
const actions = ["PAGE_VIEW", "LOGIN", "LOGOUT"] as const;

function getSince(period: (typeof periods)[number]) {
  if (period === "all") return undefined;
  const hours = period === "24h" ? 24 : period === "7d" ? 24 * 7 : 24 * 30;
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function getSelectedDateRange(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const start = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== value) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function activityLabel(action: string) {
  if (action === "LOGIN") return "Signed in";
  if (action === "LOGOUT") return "Signed out";
  return "Viewed page";
}

function activityIcon(action: string) {
  if (action === "LOGIN") return <LogIn size={16} />;
  if (action === "LOGOUT") return <LogOut size={16} />;
  return <Eye size={16} />;
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export default async function ActivityLogPage({ searchParams }: ActivityPageProps) {
  const auth = await getCurrentAuthContext();
  if (!auth.userId || auth.role !== "admin") {
    redirect(auth.role ? getDashboardPath(auth.role) : "/sign-in");
  }

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const period = periods.find((value) => value === params.period) ?? "7d";
  const selectedDateRange = getSelectedDateRange(params.date);
  const selectedDate = selectedDateRange ? params.date ?? "" : "";
  const role = roles.find((value) => value === params.role);
  const action = actions.find((value) => value === params.action);
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const since = selectedDateRange ? undefined : getSince(period);
  const where = {
    ...(selectedDateRange
      ? { createdAt: { gte: selectedDateRange.start, lt: selectedDateRange.end } }
      : since
        ? { createdAt: { gte: since } }
        : {}),
    ...(role ? { role } : {}),
    ...(action ? { action } : {}),
    ...(query
      ? {
          OR: [
            { username: { contains: query, mode: "insensitive" as const } },
            { userId: { contains: query, mode: "insensitive" as const } },
            { path: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [total, eventsToday, pageViewsToday, activeUsers] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.activityLog.count({
      where: { action: "PAGE_VIEW", createdAt: { gte: todayStart } },
    }),
    prisma.activityLog.findMany({
      where: { createdAt: { gte: getSince("24h") } },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / ITEM_PER_PAGE));
  const currentPage = Math.min(requestedPage, pageCount);
  const entries = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ITEM_PER_PAGE,
    take: ITEM_PER_PAGE,
  });

  const filterParams = new URLSearchParams();
  if (query) filterParams.set("q", query);
  if (selectedDate) filterParams.set("date", selectedDate);
  else if (period !== "7d") filterParams.set("period", period);
  if (role) filterParams.set("role", role);
  if (action) filterParams.set("action", action);
  const paginationHref = (page: number) => {
    const nextParams = new URLSearchParams(filterParams);
    nextParams.set("page", String(page));
    return `/admin/activity?${nextParams.toString()}`;
  };
  const periodLabel = selectedDateRange
    ? `Logs for ${selectedDateRange.start.toLocaleDateString()}`
    : period === "24h" ? "Last 24 hours" : period === "all" ? "All time" : `Last ${period}`;

  return (
    <main className="min-h-full space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            <Activity size={15} /> Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Activity log</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review sign-ins, sign-outs, and the pages users visit across the app.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 sm:self-auto">
          <CalendarClock size={17} className="text-sky-600" />
          {periodLabel}
        </div>
      </header>

      <section aria-label="Activity summary" className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Events today"
          value={eventsToday.toLocaleString()}
          detail="Sign-ins, sign-outs, and page visits"
          icon={<Activity size={19} />}
          color="text-sky-700 bg-sky-50"
        />
        <SummaryCard
          label="Active users"
          value={activeUsers.length.toLocaleString()}
          detail="Users with activity in the last 24 hours"
          icon={<Users size={19} />}
          color="text-violet-700 bg-violet-50"
        />
        <SummaryCard
          label="Page visits today"
          value={pageViewsToday.toLocaleString()}
          detail="Dashboard pages opened today"
          icon={<Eye size={19} />}
          color="text-emerald-700 bg-emerald-50"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ActivityLogFilters
          query={query}
          period={period}
          date={selectedDate}
          role={role ?? ""}
          action={action ?? ""}
          maxDate={todayStart.toISOString().slice(0, 10)}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-slate-500">
          <span>{total.toLocaleString()} {total === 1 ? "event" : "events"} found</span>
          <span>Newest activity first</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">User</th>
                <th scope="col" className="px-5 py-3 font-semibold">Activity</th>
                <th scope="col" className="px-5 py-3 font-semibold">Page</th>
                <th scope="col" className="px-5 py-3 font-semibold">Date and time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{entry.username || entry.userId}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">{formatRole(entry.role)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {activityIcon(entry.action)}
                      {activityLabel(entry.action)}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">{entry.path || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {entry.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Activity size={22} />
                    </div>
                    <p className="mt-3 font-semibold text-slate-800">No activity found</p>
                    <p className="mt-1 text-sm text-slate-500">Try changing your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
          <span className="text-xs text-slate-500">
            Page {currentPage} of {pageCount}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link href={paginationHref(currentPage - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-100 px-3 py-1.5 text-sm text-slate-300">Previous</span>
            )}
            {currentPage < pageCount ? (
              <Link href={paginationHref(currentPage + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Next
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-100 px-3 py-1.5 text-sm text-slate-300">Next</span>
            )}
          </div>
        </footer>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
