import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Event, Prisma, AcademicYear, AcademicTerm } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

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
  const currentUserId = userId;

  const columns = [
    {
      header: "Title",
      accessor: "title",
    },
    {
      header: "Class",
      accessor: "class",
    },
    {
      header: "Date",
      accessor: "date",
      className: "hidden md:table-cell",
    },
    {
      header: "Start Time",
      accessor: "startTime",
      className: "hidden md:table-cell",
    },
    {
      header: "End Time",
      accessor: "endTime",
      className: "hidden md:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];

  const renderRow = (item: EventList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">{item.title}</td>
      <td>{item.class?.name || "-"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.startTime)}
      </td>
      <td className="hidden md:table-cell">
        {item.startTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td className="hidden md:table-cell">
        {item.endTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}
      </td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              <FormContainer table="event" type="update" data={item} />
              <FormContainer table="event" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const { page, search } = await searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.EventWhereInput = {};

  if (search) {
    query.title = { contains: search, mode: "insensitive" };
  }

  // ROLE CONDITIONS

  const roleConditions = {
    teacher: { lessons: { some: { teacherId: currentUserId! } } },
    student: { students: { some: { id: currentUserId! } } },
    parent: { students: { some: { parentId: currentUserId! } } },
  };

  query.OR = [
    { classId: null },
    {
      class: roleConditions[role as keyof typeof roleConditions] || {},
    },
  ];

  // Fetch academic years and terms to group events
  const [academicYears, allEvents, count] = await Promise.all([
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
      orderBy: { startTime: "desc" },
    }),
    prisma.event.count({ where: query }),
  ]);

  // Function to find which term an event belongs to
  const getTermForDate = (
    date: Date,
    year: { terms: { termNumber: number; startDate: Date; endDate: Date }[] }
  ) => {
    const term = year.terms.find((t) => date >= t.startDate && date <= t.endDate);
    return term?.termNumber ?? null;
  };

  // Group events by academic year and term
  const groupedEvents: GroupedEvent[] = academicYears
    .map((year) => ({
      academicYearLabel: year.label,
      terms: Array.from({ length: year.numberOfTerms }, (_, i) => ({
        termNumber: i + 1,
        events: allEvents.filter(event => {
          const term = getTermForDate(event.startTime, year);
          return term === i + 1;
        }),
      })).filter(t => t.events.length > 0),
    }))
    .filter(y => y.terms.length > 0);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Events</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            {role === "admin" && <FormContainer table="event" type="create" />}
          </div>
        </div>
      </div>

      {/* GROUPED EVENTS */}
      <div className="mt-6 space-y-8">
        {groupedEvents.length > 0 ? (
          groupedEvents.map((yearGroup) => (
            <div key={yearGroup.academicYearLabel} className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {yearGroup.academicYearLabel}
                </h2>
              </div>
              <div className="space-y-6">
                {yearGroup.terms.map((termGroup) => (
                  <div key={termGroup.termNumber} className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <h3 className="font-semibold text-slate-800">
                        Term {termGroup.termNumber} ({termGroup.events.length} events)
                      </h3>
                    </div>
                    <Table columns={columns} renderRow={renderRow} data={termGroup.events} />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No events found for any term.
          </div>
        )}
      </div>
    </div>
  );
};

export default EventListPage;
