import AnnouncementCreateForm from "@/components/announcements/AnnouncementCreateForm";
import AnnouncementRowActions from "@/components/announcements/AnnouncementRowActions";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { buildAnnouncementWhere } from "@/lib/announcementQueries";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Announcement, Class, Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type AnnouncementList = Announcement & { class: Class | null };

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
            <AnnouncementRowActions id={item.id} />
          </div>
        )}
      </td>
    </tr>
  );

  const { page, ...queryParams } = await searchParams;
  const p = page ? parseInt(page, 10) : 1;

  const query: Prisma.AnnouncementWhereInput = buildAnnouncementWhere(
    role,
    userId ?? undefined
  );

  if (queryParams?.search) {
    query.title = { contains: queryParams.search, mode: "insensitive" };
  }

  const [data, count, classes] = await Promise.all([
    prisma.announcement.findMany({
      where: query,
      include: { class: true },
      orderBy: { date: "desc" },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.announcement.count({ where: query }),
    isAdmin
      ? prisma.class.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

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
        <Table columns={columns} renderRow={renderRow} data={data} />
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default AnnouncementListPage;
