import AnnouncementCreateForm from "@/components/announcements/AnnouncementCreateForm";
import AnnouncementRowActions from "@/components/announcements/AnnouncementRowActions";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { buildAnnouncementWhere } from "@/lib/announcementQueries";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Announcement, Class, Prisma, AcademicYear, AcademicTerm } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

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

  const columns = [
    { header: "Title", accessor: "title" },
    { header: "Class", accessor: "class" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
    ...(isAdmin ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const renderRow = (item: AnnouncementList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4 max-w-[200px] sm:max-w-none truncate">
        {item.title}
      </td>
      <td>{item.class?.name ?? "All school"}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.date)}
      </td>
      <td>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <AnnouncementRowActions id={item.id} announcement={item} />
          </div>
        )}
      </td>
    </tr>
  );

  const { page, search } = await searchParams;
  const p = page ? parseInt(page, 10) : 1;

  const query: Prisma.AnnouncementWhereInput = buildAnnouncementWhere(
    role,
    userId ?? undefined
  );

  if (search) {
    query.title = { contains: search, mode: "insensitive" };
  }

  const [academicYears, allAnnouncements, count, classes] = await Promise.all([
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
    prisma.announcement.count({ where: query }),
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

  return (
    <div className="flex-1 m-3 sm:m-4 mt-0 flex flex-col gap-4 min-h-0">
      {isAdmin && <AnnouncementCreateForm classes={classes} />}

      <div className="bg-white p-4 rounded-md flex-1 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-lg font-semibold">All Announcements</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <TableSearch />
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                className="icon-action w-8 h-8"
                aria-hidden
              >
                <Image src="/filter.svg" alt="" width={14} height={14} />
              </button>
              <button
                type="button"
                className="icon-action w-8 h-8"
                aria-hidden
              >
                <Image src="/sort.svg" alt="" width={14} height={14} />
              </button>
            </div>
          </div>
        </div>
        {/* GROUPED ANNOUNCEMENTS */}
        <div className="space-y-6">
          {groupedAnnouncements.length > 0 && (
            groupedAnnouncements.map((yearGroup) => (
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
                          Term {termGroup.termNumber} ({termGroup.announcements.length} announcements)
                        </h3>
                      </div>
                      <Table
                        columns={columns}
                        renderRow={renderRow}
                        data={termGroup.announcements}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {ungroupedAnnouncements.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Announcements outside current terms
                </h2>
                <p className="text-sm text-slate-600">
                  Some announcements do not fall inside the active academic term dates; they are shown here.
                </p>
              </div>
              <Table
                columns={columns}
                renderRow={renderRow}
                data={ungroupedAnnouncements}
              />
            </div>
          )}

          {groupedAnnouncements.length === 0 && ungroupedAnnouncements.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No announcements found for any term.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementListPage;
