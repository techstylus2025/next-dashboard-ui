import Image from "next/image";
import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import StudentsByClass from "@/components/students/StudentsByClass";

import prisma from "@/lib/prisma";

import { auth } from "@clerk/nextjs/server";

type StudentListPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

const StudentListPage = async ({ searchParams }: StudentListPageProps) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const { page, ...queryParams } = await searchParams;
  const p = page ? parseInt(page) : 1;

  // Build optional query filters (search/teacherId)
  const studentQuery: any = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "teacherId":
            studentQuery.class = {
              lessons: { some: { teacherId: value } },
            };
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

  // Fetch classes with students grouped server-side
  const classRecords = await prisma.class.findMany({
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

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Students</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="icon-action w-8 h-8">
              <Image src="/filter.svg" alt="" width={14} height={14} />
            </button>
            <button className="icon-action w-8 h-8">
              <Image src="/sort.svg" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormContainer table="student" type="create" />}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <StudentsByClass groups={classes.map((c) => ({ id: c.id, name: c.name, students: c.students }))} allClasses={allClasses} />
      </div>
    </div>
  );
};

export default StudentListPage;
