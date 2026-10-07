import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import TeacherDirectoryCard from "@/components/teachers/TeacherDirectoryCard";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import { BookOpen, GraduationCap, School } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

type TeacherList = Teacher & {
  subjects: Subject[];
  classes: Class[];
  assignedClasses: Class[];
};

const TeacherListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const session = await auth();
  const role = (session.sessionClaims?.metadata as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin";
  const { page, ...queryParams } = await searchParams;
  const requestedPage = Number.parseInt(page ?? "1", 10);
  const p = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const filters: Prisma.TeacherWhereInput[] = [];
  const search = queryParams.search?.trim();

  if (search) {
    filters.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { surname: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const classId = Number.parseInt(queryParams.classId ?? "", 10);
  if (Number.isFinite(classId) && classId > 0) {
    filters.push({
      OR: [
        { lessons: { some: { classId } } },
        { assignedClasses: { some: { id: classId } } },
        { classes: { some: { id: classId } } },
      ],
    });
  }

  const query: Prisma.TeacherWhereInput = {
    isArchived: false,
    ...(filters.length ? { AND: filters } : {}),
  };
  const [data, count, activeTeacherCount, assignedClassCount, assignedSubjectCount] = await Promise.all([
    prisma.teacher.findMany({
      where: query,
      include: {
        subjects: true,
        classes: true,
        assignedClasses: true,
      },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.teacher.count({ where: query }),
    prisma.teacher.count({ where: { isArchived: false } }),
    prisma.class.count({
      where: {
        OR: [
          { assignedTeachers: { some: { isArchived: false } } },
          { lessons: { some: { teacher: { isArchived: false } } } },
          { supervisor: { isArchived: false } },
        ],
      },
    }),
    prisma.subject.count({ where: { teachers: { some: { isArchived: false } } } }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-3 sm:p-5 lg:p-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-100">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Faculty directory
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Teacher management</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isAdmin
                ? "Manage faculty profiles and get a clear view of teaching subjects and classroom assignments."
                : "Browse faculty profiles and see the subject and classroom assignments across the school."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[390px] sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <GraduationCap className="mb-3 h-5 w-5 text-violet-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{activeTeacherCount}</p>
              <p className="mt-1 text-xs text-slate-300">Active teachers</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <School className="mb-3 h-5 w-5 text-sky-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{assignedClassCount}</p>
              <p className="mt-1 text-xs text-slate-300">Classes with faculty</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur sm:col-span-1">
              <BookOpen className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{assignedSubjectCount}</p>
              <p className="mt-1 text-xs text-slate-300">Subjects covered</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Faculty directory</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search teachers by name, username, email, or phone number.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch initialValue={queryParams.search ?? ""} />
          {isAdmin ? (
            <div className="flex shrink-0 justify-end">
              <FormContainer table="teacher" type="create" />
            </div>
          ) : null}
        </div>
      </section>

      {data.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <GraduationCap className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No teachers found</h2>
          <p className="mt-1 text-sm text-slate-500">
            {search ? "Try adjusting your search terms." : "Add a teacher to start building your faculty directory."}
          </p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((teacher) => (
            <TeacherDirectoryCard
              key={teacher.id}
              teacher={teacher}
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

export default TeacherListPage;
