import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import ClassReportButton, { ClassReportData } from "@/components/ClassReportButton";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { GRADING_LEVEL_LABELS } from "@/lib/gradingUtils";
import { Class, Prisma, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type ClassList = Class & {
  supervisor: Teacher | null;
  grade: { level: string } | null;
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

  let role: string | undefined;
  try {
    const { sessionClaims } = await auth();
    role = (sessionClaims?.metadata as { role?: string })?.role;
  } catch {
    role = undefined;
  }


const columns = [
  {
    header: "Class Name",
    accessor: "name",
  },
  {
    header: "Capacity",
    accessor: "capacity",
    className: "hidden md:table-cell",
  },
  {
    header: "Grading Level",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Supervisor",
    accessor: "supervisor",
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

const renderRow = (item: ClassList) => {
  const gradeLabel = item.grade
    ? GRADING_LEVEL_LABELS[item.grade.level as keyof typeof GRADING_LEVEL_LABELS] ?? item.grade.level
    : "Unassigned";
  const supervisorName = item.supervisor
    ? `${item.supervisor.name} ${item.supervisor.surname}`
    : "Unassigned";

  return (
  <tr
    key={item.id}
    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
  >
    <td className="flex items-center gap-4 p-4">{item.name}</td>
    <td className="hidden md:table-cell">{item.capacity}</td>
    <td className="hidden md:table-cell">{gradeLabel}</td>
    <td className="hidden md:table-cell">{supervisorName}</td>
    <td>
      <div className="flex items-center gap-2">
        {role === "admin" && (
          <>
            <ClassReportButton report={reportMap[item.id]} />
            <FormContainer table="class" type="update" data={item} />
            <FormContainer table="class" type="delete" id={item.id} />
          </>
        )}
      </div>
    </td>
  </tr>
  );
};

  const { page, ...queryParams } = await searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.ClassWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "supervisorId":
            query.supervisorId = value;
            break;
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  const [data, count, schoolSettings] = await Promise.all([
    prisma.class.findMany({
      where: query,
      include: {
        supervisor: true,
        grade: { select: { level: true } },
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
  ]);

  const reportMap = Object.fromEntries(
    await Promise.all(
      data.map(async (classItem) => [classItem.id, await buildClassReport(classItem, schoolSettings ?? {
        name: null,
        address: null,
        telephone: null,
        location: null,
        email: null,
        logoUrl: null,
      })] as const)
    )
  ) as Record<number, ClassReportData>;

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Classes</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="icon-action w-8 h-8">
              <Image src="/filter.svg" alt="" width={14} height={14} />
            </button>
            <button className="icon-action w-8 h-8">
              <Image src="/sort.svg" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="class" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ClassListPage;
