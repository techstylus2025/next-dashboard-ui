import AnnouncementCreateForm from "@/components/announcements/AnnouncementCreateForm";
import AnnouncementRowActions from "@/components/announcements/AnnouncementRowActions";
import TableSearch from "@/components/TableSearch";
import { buildAnnouncementWhere } from "@/lib/announcementQueries";
import prisma from "@/lib/prisma";
import { Announcement, Class, Prisma, AcademicYear, AcademicTerm } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { CalendarDays, Megaphone, School, Users } from "lucide-react";

type AnnouncementList = Announcement & { class: Class | null };

type GroupedAnnouncement = {
  academicYearLabel: string;
  terms: Array<{
    termNumber: number;
    announcements: AnnouncementList[];
  }>;
};

const AnnouncementListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isAdmin = role === "admin";

  const { search } = await searchParams;

  const query: Prisma.AnnouncementWhereInput = buildAnnouncementWhere(
    role,
    userId ?? undefined
  );

  if (search) {
    query.title = { contains: search, mode: "insensitive" };
  }

  const [academicYears, allAnnouncements, classes] = await Promise.all([
    prisma.academicYear.findMany({
      include: { terms: { orderBy: { termNumber: "asc" } } },
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.announcement.findMany({
      where: query,
      include: { class: true },
      orderBy: { date: "desc" },
    }),
    isAdmin
      ? prisma.class.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const getTermForDate = (
    date: Date,
    year: AcademicYear & { terms: AcademicTerm[] }
  ) => {
    const term = year.terms.find((t) => date >= t.startDate && date <= t.endDate);
    return term?.termNumber ?? null;
  };

  const groupedAnnouncements: GroupedAnnouncement[] = academicYears
    .map((year) => ({
      academicYearLabel: year.label,
      terms: Array.from({ length: year.numberOfTerms }, (_, i) => ({
        termNumber: i + 1,
        announcements: allAnnouncements.filter((announcement) => {
          const term = getTermForDate(announcement.date, year);
          return term === i + 1;
        }),
      })).filter((t) => t.announcements.length > 0),
    }))
    .filter((y) => y.terms.length > 0);

  const ungroupedAnnouncements = allAnnouncements.filter((announcement) => {
    return !academicYears.some((year) => getTermForDate(announcement.date, year) !== null);
  });
  const schoolwideCount = allAnnouncements.filter((announcement) => announcement.classId === null).length;
  const targetedCount = allAnnouncements.length - schoolwideCount;
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);

  const renderAnnouncementCard = (item: AnnouncementList) => (
    <article
      key={item.id}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md sm:p-6"
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 to-indigo-500 opacity-80" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 pl-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              item.classId === null
                ? "bg-indigo-50 text-indigo-700"
                : "bg-sky-50 text-sky-700"
            }`}>
              {item.classId === null
                ? <Users className="h-3.5 w-3.5" aria-hidden="true" />
                : <School className="h-3.5 w-3.5" aria-hidden="true" />}
              {item.class?.name ?? "All school"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(item.date)}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900">{item.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
            <AnnouncementRowActions id={item.id} announcement={item} />
          </div>
        )}
      </div>
    </article>
  );

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-5 p-3 sm:p-5 lg:p-6">
      {isAdmin && <AnnouncementCreateForm classes={classes} />}

      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8">
        <div className="absolute -right-10 -top-14 -z-10 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 -z-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-sky-100">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              School broadcast channel
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Announcements</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
              Important updates and notices for the school community, organized by academic period.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px] sm:gap-3">
            {[
              { label: "Total notices", value: allAnnouncements.length, icon: Megaphone },
              { label: "School-wide", value: schoolwideCount, icon: Users },
              { label: "Class updates", value: targetedCount, icon: School },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur sm:p-4">
                <Icon className="mb-3 h-4 w-4 text-sky-200" aria-hidden="true" />
                <p className="text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-300 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Broadcast feed</h2>
            <p className="mt-1 text-sm text-slate-500">
              {search ? `Results matching “${search}”` : "Browse current and previous school notices."}
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <TableSearch />
          </div>
        </div>

        <div className="space-y-7">
          {groupedAnnouncements.length > 0 && (
            groupedAnnouncements.map((yearGroup) => (
              <section key={yearGroup.academicYearLabel} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{yearGroup.academicYearLabel}</h2>
                    <p className="text-xs text-slate-500">Academic year</p>
                  </div>
                </div>
                <div className="space-y-5 border-l-2 border-slate-100 pl-4 sm:ml-5 sm:pl-6">
                  {yearGroup.terms.map((termGroup) => (
                    <section key={termGroup.termNumber} className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-700">Term {termGroup.termNumber}</h3>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                          {termGroup.announcements.length} {termGroup.announcements.length === 1 ? "notice" : "notices"}
                        </span>
                      </div>
                      <div className="grid gap-3 xl:grid-cols-2">
                        {termGroup.announcements.map(renderAnnouncementCard)}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            ))
          )}

          {ungroupedAnnouncements.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Outside academic terms</h2>
                  <p className="text-xs text-slate-500">Notices outside configured term dates</p>
                </div>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {ungroupedAnnouncements.map(renderAnnouncementCard)}
              </div>
            </section>
          )}

          {groupedAnnouncements.length === 0 && ungroupedAnnouncements.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <Megaphone className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-800">No announcements found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {search ? "Try a different search term." : "There are no notices available for this account yet."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AnnouncementListPage;
