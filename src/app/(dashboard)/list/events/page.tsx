import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Event, Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  School,
  Sparkles,
  Users,
} from "lucide-react";

type EventList = Event & { class: Class | null };

type GroupedEvent = {
  academicYearLabel: string;
  terms: Array<{
    termNumber: number;
    events: EventList[];
  }>;
};

const EventListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const { search } = await searchParams;

  const query: Prisma.EventWhereInput = {};
  if (search) {
    query.title = { contains: search, mode: "insensitive" };
  }

  const roleConditions = {
    teacher: { lessons: { some: { teacherId: userId! } } },
    student: { students: { some: { id: userId! } } },
    parent: { students: { some: { parentId: userId! } } },
  };

  query.OR = [
    { classId: null },
    {
      class: roleConditions[role as keyof typeof roleConditions] || {},
    },
  ];

  const [academicYears, allEvents] = await Promise.all([
    prisma.academicYear.findMany({
      include: {
        terms: {
          orderBy: { termNumber: "asc" },
          select: { id: true, termNumber: true, startDate: true, endDate: true },
        },
      },
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findMany({
      where: query,
      include: { class: true },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const getTermForDate = (
    date: Date,
    year: { terms: { termNumber: number; startDate: Date; endDate: Date }[] }
  ) => {
    const term = year.terms.find((item) => date >= item.startDate && date <= item.endDate);
    return term?.termNumber ?? null;
  };

  const groupedEvents: GroupedEvent[] = academicYears
    .map((year) => ({
      academicYearLabel: year.label,
      terms: Array.from({ length: year.numberOfTerms }, (_, index) => ({
        termNumber: index + 1,
        events: allEvents.filter(
          (event) => getTermForDate(event.startTime, year) === index + 1
        ),
      })).filter((term) => term.events.length > 0),
    }))
    .filter((year) => year.terms.length > 0);

  const groupedEventIds = new Set(
    groupedEvents.flatMap((year) =>
      year.terms.flatMap((term) => term.events.map((event) => event.id))
    )
  );
  const ungroupedEvents = allEvents.filter((event) => !groupedEventIds.has(event.id));
  const now = new Date();
  const schoolwideCount = allEvents.filter((event) => event.classId === null).length;
  const upcomingCount = allEvents.filter((event) => event.endTime >= now).length;

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);

  const renderEventCard = (item: EventList) => {
    const status =
      item.startTime > now
        ? { label: "Upcoming", className: "bg-sky-50 text-sky-700" }
        : item.endTime >= now
          ? { label: "In progress", className: "bg-emerald-50 text-emerald-700" }
          : { label: "Past", className: "bg-slate-100 text-slate-600" };

    return (
      <article
        key={item.id}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md sm:p-4"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 to-indigo-500 opacity-80" />
        <div className="flex items-start justify-between gap-3 pl-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  item.classId === null
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-sky-50 text-sky-700"
                }`}
              >
                {item.classId === null ? (
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <School className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {item.class?.name ?? "School-wide"}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
                {status.label}
              </span>
            </div>
            <h3 className="mt-2 text-base font-semibold leading-snug text-slate-900 sm:text-lg">
              {item.title}
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-slate-600">
              {item.description || "No description provided."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-2.5 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                {formatDate(item.startTime)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                {formatTime(item.startTime)} – {formatTime(item.endTime)}
              </span>
            </div>
          </div>
          {role === "admin" && (
            <div className="flex shrink-0 items-center gap-2">
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-5 p-3 sm:p-5 lg:p-6">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-5 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-10 -top-14 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-sky-100">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              School calendar
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Events
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
              Keep up with important dates and activities across the school community.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px] sm:gap-3">
            {[
              { label: "Total events", value: allEvents.length, icon: CalendarDays },
              { label: "Upcoming", value: upcomingCount, icon: Clock3 },
              { label: "School-wide", value: schoolwideCount, icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur sm:p-4"
              >
                <Icon className="mb-3 h-4 w-4 text-sky-200" aria-hidden="true" />
                <p className="text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-300 sm:text-xs">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Event schedule</h2>
            <p className="mt-1 text-sm text-slate-500">
              {search
                ? `Showing events matching “${search}”.`
                : "Browse events by academic year and term."}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-xs">
              <TableSearch initialValue={search ?? ""} />
            </div>
            {role === "admin" && (
              <div className="flex shrink-0 justify-end">
                <FormContainer table="event" type="create" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-7">
          {groupedEvents.map((yearGroup) => (
            <section key={yearGroup.academicYearLabel} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {yearGroup.academicYearLabel}
                  </h2>
                  <p className="text-xs text-slate-500">Academic year</p>
                </div>
              </div>
              <div className="space-y-5 border-l-2 border-slate-100 pl-4 sm:ml-5 sm:pl-6">
                {yearGroup.terms.map((termGroup) => (
                  <details key={termGroup.termNumber} className="group smooth-disclosure">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-sky-200 hover:bg-sky-50/60 [&::-webkit-details-marker]:hidden">
                      <span>Term {termGroup.termNumber}</span>
                      <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                        {termGroup.events.length}{" "}
                        {termGroup.events.length === 1 ? "event" : "events"}
                      </span>
                      <ChevronDown
                        className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="smooth-disclosure-panel">
                      <div className="smooth-disclosure-panel-inner">
                        <div className="pt-3">
                          <div className="grid gap-3 xl:grid-cols-2">
                            {termGroup.events.map(renderEventCard)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          {ungroupedEvents.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Outside academic terms
                  </h2>
                  <p className="text-xs text-slate-500">
                    Events outside configured term dates
                  </p>
                </div>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {ungroupedEvents.map(renderEventCard)}
              </div>
            </section>
          )}

          {allEvents.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <CalendarDays className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-800">
                {search ? "No matching events" : "No events scheduled"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try another search term."
                  : "School events will appear here when they are added."}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default EventListPage;
