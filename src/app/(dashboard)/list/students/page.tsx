import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import StudentsByClass from "@/components/students/StudentsByClass";
import { getCurrentAuthContext } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { GraduationCap, School, Users } from "lucide-react";

type StudentListPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

const StudentListPage = async ({ searchParams }: StudentListPageProps) => {
  const { role, userId } = await getCurrentAuthContext();

  const queryParams = await searchParams;
  const requestedClassId = Number.parseInt(queryParams.classId ?? "", 10);
  const hasClassFilter = Number.isFinite(requestedClassId) && requestedClassId > 0;

  // Build optional query filters (search/teacherId)
  const studentQuery: Prisma.StudentWhereInput = { isArchived: false };
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "teacherId":
            if (role === "admin") {
              studentQuery.class = { lessons: { some: { teacherId: value } } };
            }
            break;
          case "search":
            studentQuery.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const classScope: Prisma.ClassWhereInput = role === "admin"
    ? hasClassFilter ? { id: requestedClassId } : {}
    : role === "teacher" && userId
      ? hasClassFilter
        ? {
            AND: [
              {
                OR: [
                  { supervisorId: userId },
                  { assignedTeachers: { some: { id: userId } } },
                  { lessons: { some: { teacherId: userId } } },
                ],
              },
              { id: requestedClassId },
            ],
          }
        : {
            OR: [
              { supervisorId: userId },
              { assignedTeachers: { some: { id: userId } } },
              { lessons: { some: { teacherId: userId } } },
            ],
          }
      : { id: { in: [] } };

  // Fetch classes with students grouped server-side
  const classRecords = await prisma.class.findMany({
    where: classScope,
    include: {
      students: {
        where: studentQuery,
        orderBy: { name: "asc" },
        include: {
          parent: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const classes = classRecords.map((classItem) => ({
    id: classItem.id,
    name: classItem.name,
    students: classItem.students.map((student) => ({
      ...student,
      birthday: student.birthday.toISOString(),
      createdAt: student.createdAt.toISOString(),
    })),
  }));

  const allClasses = classes.map((c) => ({ id: c.id, name: c.name }));
  const totalStudents = classes.reduce((total, classItem) => total + classItem.students.length, 0);
  const linkedParents = new Set(
    classes.flatMap((classItem) =>
      classItem.students.map((student) => student.parentId).filter(Boolean)
    )
  ).size;
  const searchValue = queryParams.search ?? "";

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-3 sm:p-5 lg:p-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Student information system
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {role === "admin" ? "Student management" : "Students"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {role === "admin"
                ? "A clear overview of student records, class placement, and family connections."
                : "View student records for the classes available to you."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[390px] sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <Users className="mb-3 h-5 w-5 text-sky-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="mt-1 text-xs text-slate-300">Students found</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <School className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{classes.filter((classItem) => classItem.students.length > 0).length}</p>
              <p className="mt-1 text-xs text-slate-300">Classes with students</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur sm:col-span-1">
              <Users className="mb-3 h-5 w-5 text-violet-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{linkedParents}</p>
              <p className="mt-1 text-xs text-slate-300">Linked families</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Student directory</h2>
          <p className="mt-1 text-sm text-slate-500">
            {hasClassFilter ? "Viewing the selected classroom roster." : "Search students or expand a class to view records."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch initialValue={searchValue} />
          {role === "admin" ? (
            <div className="flex shrink-0 justify-end">
              <FormContainer table="student" type="create" />
            </div>
          ) : null}
        </div>
      </section>

      <div>
        <StudentsByClass
          groups={classes.map((c) => ({ id: c.id, name: c.name, students: c.students }))}
          allClasses={allClasses}
          canManage={role === "admin"}
        />
      </div>
    </div>
  );
};

export default StudentListPage;
