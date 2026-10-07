import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import SubjectDirectoryCard from "@/components/subjects/SubjectDirectoryCard";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import { BookOpen, GraduationCap, Layers3, School } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

const SubjectListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const session = await auth();
  const role = (session?.sessionClaims?.metadata as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin";
  const { page, ...queryParams } = await searchParams;
  const requestedPage = Number.parseInt(page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const search = queryParams.search?.trim() ?? "";
  const subjectQuery: Prisma.SubjectWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { grade: { is: { label: { contains: search, mode: "insensitive" } } } },
        ],
      }
    : {};

  const [
    matchingSubjectNames,
    totalSubjectNames,
    totalSubjectEntries,
    gradeLevelCount,
    classesWithSubjects,
  ] = await Promise.all([
    prisma.subject.groupBy({ by: ["name"], where: subjectQuery, orderBy: { name: "asc" } }),
    prisma.subject.groupBy({ by: ["name"] }),
    prisma.subject.count(),
    prisma.grade.count({ where: { subjects: { some: {} } } }),
    prisma.class.count({ where: { subjects: { some: {} } } }),
  ]);
  const resultCount = matchingSubjectNames.length;
  const pageSubjectNames = matchingSubjectNames
    .slice(ITEM_PER_PAGE * (currentPage - 1), ITEM_PER_PAGE * currentPage)
    .map(({ name }) => name);
  const subjects = pageSubjectNames.length
    ? await prisma.subject.findMany({
        where: { name: { in: pageSubjectNames } },
        include: {
          teachers: {
            select: { id: true, name: true, surname: true },
            orderBy: [{ surname: "asc" }, { name: "asc" }],
          },
          grade: { select: { level: true, label: true } },
          classes: { select: { id: true, name: true }, orderBy: { name: "asc" } },
          _count: { select: { lessons: true } },
        },
        orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
      })
    : [];
  const subjectsByName = new Map<string, typeof subjects>();
  for (const subject of subjects) {
    const variants = subjectsByName.get(subject.name) ?? [];
    variants.push(subject);
    subjectsByName.set(subject.name, variants);
  }
  const subjectGroups = [...subjectsByName.entries()];

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-3 sm:p-5 lg:p-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Curriculum management
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">School subjects</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Organize curriculum subjects by grading level and keep teacher, class, and lesson assignments easy to review.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[390px] sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <BookOpen className="mb-3 h-5 w-5 text-amber-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{totalSubjectEntries}</p>
              <p className="mt-1 text-xs text-slate-300">Subject entries</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <GraduationCap className="mb-3 h-5 w-5 text-sky-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{gradeLevelCount}</p>
              <p className="mt-1 text-xs text-slate-300">Grading levels</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur sm:col-span-1">
              <Layers3 className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{totalSubjectNames.length}</p>
              <p className="mt-1 text-xs text-slate-300">Unique subjects</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Subject directory</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search subjects or grading levels and review their classroom assignments.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch initialValue={search} />
          {isAdmin ? (
            <div className="flex shrink-0 justify-end">
              <FormContainer table="subject" type="create" />
            </div>
          ) : null}
        </div>
      </section>

      {subjects.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No subjects found</h2>
          <p className="mt-1 text-sm text-slate-500">
            {search ? "Try another subject name or grading level." : "Create a subject to start organizing the curriculum."}
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjectGroups.map(([name, variants]) => (
            <SubjectDirectoryCard
              key={name}
              name={name}
              variants={variants}
              isAdmin={isAdmin}
            />
          ))}
        </section>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Pagination page={currentPage} count={resultCount} />
      </div>
      <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <School className="h-3.5 w-3.5" aria-hidden="true" />
        {classesWithSubjects} {classesWithSubjects === 1 ? "class has" : "classes have"} at least one subject assigned.
      </p>
    </div>
  );
};

export default SubjectListPage;
