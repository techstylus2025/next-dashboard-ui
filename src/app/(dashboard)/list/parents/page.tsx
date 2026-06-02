import ParentCreateFormAccordion from "@/components/parents/ParentCreateFormAccordion";
import ParentRowActions from "@/components/parents/ParentRowActions";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Parent, Prisma, Student } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type ParentList = Parent & { students: Student[] };

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isAdmin = role === "admin";

  const columns = [
    { header: "Info", accessor: "info" },
    {
      header: "Student Names",
      accessor: "students",
      className: "hidden md:table-cell",
    },
    { header: "Phone", accessor: "phone", className: "hidden lg:table-cell" },
    { header: "Address", accessor: "address", className: "hidden lg:table-cell" },
    ...(isAdmin ? [{ header: "Actions", accessor: "action" }] : []),
  ];

  const renderRow = (item: ParentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col min-w-0">
          <h3 className="font-semibold truncate">
            {item.name} {item.surname}
          </h3>
          <p className="text-xs text-gray-500 truncate">{item.email ?? "—"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {item.students.length > 0
          ? item.students.map((s) => `${s.name} ${s.surname}`).join(", ")
          : "—"}
      </td>
      <td className="hidden lg:table-cell">{item.phone}</td>
      <td className="hidden lg:table-cell max-w-[200px] truncate">
        {item.address}
      </td>
      <td>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <ParentRowActions parent={{ ...item, email: item.email ?? undefined }} />
          </div>
        )}
      </td>
    </tr>
  );

  const { page, ...queryParams } = await searchParams;
  const p = page ? parseInt(page, 10) : 1;

  const query: Prisma.ParentWhereInput = {};

  if (queryParams?.search) {
    query.OR = [
      { name: { contains: queryParams.search, mode: "insensitive" } },
      { surname: { contains: queryParams.search, mode: "insensitive" } },
      { email: { contains: queryParams.search, mode: "insensitive" } },
      { phone: { contains: queryParams.search, mode: "insensitive" } },
    ];
  }

  const [data, count] = await prisma.$transaction([
    prisma.parent.findMany({
      where: query,
      include: { students: true },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.parent.count({ where: query }),
  ]);

  return (
    <div className="flex-1 m-3 sm:m-4 mt-0 flex flex-col gap-4 min-h-0">
      {isAdmin && <ParentCreateFormAccordion />}

      <div className="bg-white p-4 rounded-md flex-1 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-lg font-semibold">All Parents</h1>
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

export default ParentListPage;
