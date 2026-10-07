import FormContainer from "@/components/FormContainer";
import ClassroomCard from "@/components/classes/ClassroomCard";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import type { ClassReportData } from "@/components/ClassReportButton";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { GRADING_LEVEL_LABELS } from "@/lib/gradingUtils";
import { Class, Prisma, Teacher } from "@prisma/client";
import { GraduationCap, School, Users } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

type ClassList = Class & {
  supervisor: Teacher | null;
  grade: { level: string } | null;
  _count: { students: number };
  lessons: { subject: { name: string } }[];
};

const buildClassReport = async (
  classItem: ClassList,
  schoolSettings: {
    name: string | null;
    address: string | null;
    telephone: string | null;
    location: string | null;
    email: string | null;
    logoUrl: string | null;
  }
): Promise<ClassReportData> => {
  const [classStudents, activeYear, activeTerm, subjectRows] = await Promise.all([
    prisma.student.findMany({
      where: { classId: classItem.id },
      include: {
        results: true,
        attendances: { where: { present: true } },
      },
    }),
    prisma.academicYear.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.academicTerm.findFirst({
      where: { academicYear: { isActive: true } },
      orderBy: { termNumber: "asc" },
    }),
    prisma.subject.findMany({
      where: { lessons: { some: { classId: classItem.id } } },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalStudents = classStudents.length;
  const totalMale = classStudents.filter((student) => student.sex === "MALE").length;
  const totalFemale = classStudents.filter((student) => student.sex === "FEMALE").length;

  const averageAge = totalStudents
    ? classStudents.reduce((sum, student) => {
        const age = Math.max(0, new Date().getFullYear() - new Date(student.birthday).getFullYear());
        return sum + age;
      }, 0) / totalStudents
    : 0;

  const averageAttendance = totalStudents
    ? classStudents.reduce((sum, student) => {
        const attendanceCount = student.attendances.length;
        return sum + Math.min(100, attendanceCount > 0 ? (attendanceCount / 20) * 100 : 0);
      }, 0) / totalStudents
    : 0;

  const averageScore = totalStudents
    ? classStudents.reduce((sum, student) => {
        const scores = student.results.map((result) => Number(result.score ?? 0));
        const averageStudentScore = scores.length ? scores.reduce((inner, value) => inner + value, 0) / scores.length : 0;
        return sum + averageStudentScore;
      }, 0) / totalStudents
    : 0;

  const topStudents = classStudents
    .map((student) => ({
      name: student.name,
      surname: student.surname,
      score:
        student.results.length > 0
          ? student.results.reduce((sum, result) => sum + Number(result.score ?? 0), 0) / student.results.length
          : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    className: classItem.name,
    gradingLevel: classItem.grade ? GRADING_LEVEL_LABELS[classItem.grade.level as keyof typeof GRADING_LEVEL_LABELS] ?? classItem.grade.level : "Unassigned",
    supervisor: classItem.supervisor ? `${classItem.supervisor.name} ${classItem.supervisor.surname}` : "Unassigned",
    subjects: subjectRows.map((subject) => subject.name),
    totalStudents,
    totalMale,
    totalFemale,
    averageAge,
    averageAttendance,
    averageScore,
    academicYear: activeYear?.label ?? "No active year",
    term: activeTerm ? `Term ${activeTerm.termNumber}` : "No active term",
    topStudents,
    schoolSettings,
  };
};

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
  const { page, ...queryParams } = await searchParams;
  const parsedPage = Number.parseInt(page ?? "1", 10);
  const p = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filters: Prisma.ClassWhereInput[] = [];

  if (queryParams.search?.trim()) {
    filters.push({ name: { contains: queryParams.search.trim(), mode: "insensitive" } });
  }
  if (role === "admin" && queryParams.supervisorId) {
    filters.push({ supervisorId: queryParams.supervisorId });
  }
  if (role === "teacher" && userId) {
    filters.push({
      OR: [
        { supervisorId: userId },
        { assignedTeachers: { some: { id: userId } } },
        { lessons: { some: { teacherId: userId } } },
      ],
    });
  } else if (role !== "admin") {
    filters.push({ id: { in: [] } });
  }

  const query: Prisma.ClassWhereInput =
    filters.length > 1 ? { AND: filters } : filters[0] ?? {};

  const [data, count, schoolSettings, studentCount, capacityTotal] = await Promise.all([
    prisma.class.findMany({
      where: query,
      include: {
        supervisor: true,
        grade: { select: { level: true } },
        _count: { select: { students: { where: { isArchived: false } } } },
        lessons: { select: { subject: { select: { name: true } } } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.class.count({ where: query }),
    prisma.schoolSetting.findFirst({
      select: {
        name: true,
        address: true,
        telephone: true,
        location: true,
        email: true,
        logoUrl: true,
      },
    }),
    prisma.student.count({ where: { isArchived: false, class: query } }),
    prisma.class.aggregate({ where: query, _sum: { capacity: true } }),
  ]);

  const reportMap =
    role === "admin"
      ? Object.fromEntries(
          await Promise.all(
            data.map(async (classItem) => [
              classItem.id,
              await buildClassReport(
                classItem,
                schoolSettings ?? {
                  name: null,
                  address: null,
                  telephone: null,
                  location: null,
                  email: null,
                  logoUrl: null,
                }
              ),
            ] as const)
          )
        ) as Record<number, ClassReportData>
      : {};
  const totalCapacity = capacityTotal._sum.capacity ?? 0;
  const occupancy = totalCapacity > 0 ? Math.min(100, Math.round((studentCount / totalCapacity) * 100)) : 0;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-3 sm:p-5 lg:p-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
              <School className="h-4 w-4" aria-hidden="true" />
              Classroom management
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {role === "admin" ? "Class management" : "My classrooms"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {role === "admin"
                ? "Organize class rosters, academic levels, supervisors, and classroom capacity in one place."
                : "View the classrooms assigned to you or supervised by you, and open each student roster."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[390px] sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <School className="mb-3 h-5 w-5 text-cyan-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{count}</p>
              <p className="mt-1 text-xs text-slate-300">Classrooms</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <Users className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{studentCount}</p>
              <p className="mt-1 text-xs text-slate-300">Enrolled students</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur sm:col-span-1">
              <GraduationCap className="mb-3 h-5 w-5 text-violet-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{occupancy}%</p>
              <p className="mt-1 text-xs text-slate-300">Capacity in use</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Class directory</h2>
          <p className="mt-1 text-sm text-slate-500">
            {role === "admin"
              ? "Search and manage school classrooms and student placement."
              : "Search your assigned or supervised classrooms and access their student lists."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <TableSearch initialValue={queryParams.search ?? ""} />
          {role === "admin" ? (
            <div className="flex shrink-0 justify-end">
              <FormContainer table="class" type="create" />
            </div>
          ) : null}
        </div>
      </section>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <School className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No classrooms found</h2>
          <p className="mt-1 text-sm text-slate-500">
            {role === "teacher"
              ? "No classes are assigned to you yet. Contact an administrator if this doesn’t look right."
              : "Try another search, or create a class to get started."}
          </p>
          {role === "admin" ? (
            <div className="mt-5 inline-flex">
              <FormContainer table="class" type="create" />
            </div>
          ) : null}
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((classItem) => {
            const gradeLabel = classItem.grade
              ? GRADING_LEVEL_LABELS[classItem.grade.level as keyof typeof GRADING_LEVEL_LABELS] ?? classItem.grade.level
              : "Unassigned";
            const supervisorName = classItem.supervisor
              ? `${classItem.supervisor.name} ${classItem.supervisor.surname}`.trim()
              : "Unassigned";
            const subjects = [...new Set(classItem.lessons.map((lesson) => lesson.subject.name))];

            return (
              <ClassroomCard
                key={classItem.id}
                classItem={{
                  id: classItem.id,
                  name: classItem.name,
                  capacity: classItem.capacity,
                  gradeId: classItem.gradeId,
                  supervisorId: classItem.supervisorId,
                  studentCount: classItem._count.students,
                  gradeLabel,
                  supervisorName,
                  subjects,
                }}
                isAdmin={role === "admin"}
                report={reportMap[classItem.id]}
              />
            );
          })}
        </section>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default ClassListPage;
