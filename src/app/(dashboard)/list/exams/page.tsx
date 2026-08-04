import ExamQuestionUploadsPanel from "@/components/exams/ExamQuestionUploadsPanel";
import ExamTimetableModal from "@/components/exams/ExamTimetableModal";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { getActiveAcademicPeriod } from "@/lib/academicContext";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Exam, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type ExamList = Exam & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
};

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const adminClasses =
    role === "admin"
      ? await prisma.class.findMany({
          select: { id: true, name: true, gradingLevel: true },
          orderBy: { name: "asc" },
        })
      : [];

  const adminLessons =
    role === "admin"
      ? await prisma.lesson.findMany({
          select: {
            id: true,
            name: true,
            classId: true,
            subject: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        })
      : [];

const columns = [
  {
    header: "Subject Name",
    accessor: "name",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    className: "hidden md:table-cell",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  ...(role === "admin" || role === "teacher"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const renderRow = (item: ExamList) => {
  const teacherName = item.lesson?.teacher
    ? `${item.lesson.teacher.name ?? ""} ${item.lesson.teacher.surname ?? ""}`.trim() || "Unknown teacher"
    : "Unknown teacher";

  return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{item.lesson?.subject?.name ?? "Unknown subject"}</td>
      <td className="p-4">{item.lesson?.class?.name ?? "Unknown class"}</td>
      <td className="hidden p-4 md:table-cell">{teacherName}</td>
      <td className="hidden p-4 md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.startTime)}
      </td>
      {(role === "admin" || role === "teacher") && (
        <td className="p-4">
          <div className="flex items-center gap-2">
            <FormContainer table="exam" type="update" data={item} />
            <FormContainer table="exam" type="delete" id={item.id} />
          </div>
        </td>
      )}
    </tr>
  );
};

  const { page, ...queryParams } = await searchParams;

  const p = page ? parseInt(page) : 1;
  const activePeriod = await getActiveAcademicPeriod();
  const activeTermBadge =
    activePeriod.yearLabel && activePeriod.termNumber !== null
      ? `${activePeriod.yearLabel} · Term ${activePeriod.termNumber}`
      : null;

  const examQuery: Prisma.ExamWhereInput = {};
  if (activePeriod.termStart && activePeriod.termEnd) {
    examQuery.startTime = {
      gte: activePeriod.termStart,
      lte: activePeriod.termEnd,
    };
  }

  examQuery.lesson = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            examQuery.lesson.classId = parseInt(value);
            break;
          case "teacherId":
            examQuery.lesson.teacherId = value;
            break;
          case "search":
            examQuery.lesson.subject = {
              name: { contains: value, mode: "insensitive" },
            };
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS

  switch (role) {
    case "admin":
      break;
    case "teacher":
      examQuery.lesson.teacherId = currentUserId!;
      break;
    case "student":
      examQuery.lesson.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
    case "parent":
      examQuery.lesson.class = {
        students: {
          some: {
            parentId: currentUserId!,
          },
        },
      };
      break;

    default:
      break;
  }

  const pendingUploadWhere: Prisma.ExamQuestionUploadWhereInput =
    activePeriod.yearLabel && activePeriod.termNumber !== null
      ? {
          academicYearLabel: activePeriod.yearLabel,
          termNumber: activePeriod.termNumber,
          status: "PENDING",
          ...(role === "teacher" ? { uploadedById: currentUserId! } : {}),
        }
      : { id: -1 };

  const approvedUploadWhere: Prisma.ExamQuestionUploadWhereInput =
    activePeriod.yearLabel && activePeriod.termNumber !== null
      ? {
          academicYearLabel: activePeriod.yearLabel,
          termNumber: activePeriod.termNumber,
          status: "APPROVED",
          ...(role === "teacher" ? { uploadedById: currentUserId! } : {}),
        }
      : { id: -1 };

  const [data, count, pendingUploads, approvedUploads] = await Promise.all([
    prisma.exam.findMany({
      where: examQuery,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
            class: { select: { name: true } },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.exam.count({ where: examQuery }),
    prisma.examQuestionUpload.findMany({
      where: pendingUploadWhere,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        uploadedBy: { select: { name: true, surname: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.examQuestionUpload.findMany({
      where: approvedUploadWhere,
      include: {
        lesson: {
          select: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        uploadedBy: { select: { name: true, surname: true } },
      },
      orderBy: { approvedAt: "desc" },
    }),
  ]);

  const lessonOptions =
    role === "teacher"
      ? await prisma.lesson.findMany({
          where: {
            OR: [
              { teacherId: currentUserId! },
              { class: { supervisorId: currentUserId! } },
            ],
          },
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        })
      : [];

  const serializedPendingUploads = pendingUploads.map((upload) => ({
    id: upload.id,
    title: upload.title,
    fileName: upload.fileName,
    fileUrl: upload.fileUrl,
    status: upload.status,
    lesson: upload.lesson,
    uploadedBy: upload.uploadedBy,
    createdAt: upload.createdAt.toISOString(),
  }));

  const serializedApprovedUploads = approvedUploads.map((upload) => ({
    id: upload.id,
    title: upload.title,
    fileName: upload.fileName,
    fileUrl: upload.fileUrl,
    status: upload.status,
    lesson: upload.lesson,
    uploadedBy: upload.uploadedBy,
    approvedBy: upload.approvedBy,
    createdAt: upload.createdAt.toISOString(),
    approvedAt: upload.approvedAt?.toISOString() ?? null,
  }));

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Exams</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="icon-action w-8 h-8">
              <Image src="/filter.svg" alt="" width={14} height={14} />
            </button>
            <button className="icon-action w-8 h-8">
              <Image src="/sort.svg" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <ExamTimetableModal classes={adminClasses} lessons={adminLessons} />
            )}
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="exam" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
      {(role === "admin" || role === "teacher") && (
        <ExamQuestionUploadsPanel
          role={role}
          lessons={lessonOptions}
          pendingUploads={serializedPendingUploads}
          approvedUploads={serializedApprovedUploads}
          activeTermBadge={activeTermBadge}
        />
      )}
    </div>
  );
};

export default ExamListPage;
