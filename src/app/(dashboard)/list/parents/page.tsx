import ParentCreateFormAccordion from "@/components/parents/ParentCreateFormAccordion";
import ParentDirectoryCard from "@/components/parents/ParentDirectoryCard";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import { ContactRound, Users } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

const ParentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isAdmin = role === "admin";
  const { page, ...queryParams } = await searchParams;
  const requestedPage = Number.parseInt(page ?? "1", 10);
  const p = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const query: Prisma.ParentWhereInput = {};

  const search = queryParams.search?.trim() ?? "";
  if (search) {
    query.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { surname: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }

  const activeParentWhere = { isArchived: false };
  const [data, count, totalParents, linkedStudents, totalStudents] = await Promise.all([
    prisma.parent.findMany({
      where: { ...query, isArchived: false },
      include: {
        students: {
          where: { isArchived: false },
          select: { id: true, name: true, surname: true, class: { select: { name: true } } },
          orderBy: [{ surname: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.parent.count({ where: { ...query, isArchived: false } }),
    prisma.parent.count({ where: activeParentWhere }),
    prisma.student.count({
      where: { isArchived: false, parent: { isArchived: false } },
    }),
    prisma.student.count({ where: { isArchived: false } }),
  ]);
  const familyCoverage = totalStudents > 0
    ? Math.round((linkedStudents / totalStudents) * 100)
    : 0;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-3 sm:p-5 lg:p-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-rose-400/20 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-100">
              <ContactRound className="h-4 w-4" aria-hidden="true" />
              Family engagement
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Parent management</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Keep parent contacts and student-family links organized with a clear directory for the school community.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[390px] sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <ContactRound className="mb-3 h-5 w-5 text-rose-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{totalParents}</p>
              <p className="mt-1 text-xs text-slate-300">Active parents</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <Users className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{linkedStudents}</p>
              <p className="mt-1 text-xs text-slate-300">Students linked</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur sm:col-span-1">
              <Users className="mb-3 h-5 w-5 text-sky-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{familyCoverage}%</p>
              <p className="mt-1 text-xs text-slate-300">Family coverage</p>
            </div>
          </div>
        </div>
      </section>

      {isAdmin ? <ParentCreateFormAccordion /> : null}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Parent directory</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search parents by name, username, contact details, or address.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch initialValue={queryParams.search ?? ""} />
        </div>
      </section>

      {data.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <ContactRound className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No parents found</h2>
          <p className="mt-1 text-sm text-slate-500">
            {queryParams.search ? "Try adjusting your search terms." : "Register a parent to start building your family directory."}
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <ParentDirectoryCard
              key={item.id}
              parent={{
                ...item,
                email: item.email,
                occupation: item.occupation,
              }}
              isAdmin={isAdmin}
            />
          ))}
        </section>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default ParentListPage;
