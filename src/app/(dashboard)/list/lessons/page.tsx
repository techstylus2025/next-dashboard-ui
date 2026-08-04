import LessonUploadsPanel from "@/components/lessons/LessonUploadsPanel";
import LessonCalendar from "@/components/LessonCalendar";
import TableSearch from "@/components/TableSearch";
import TimetableManagement from "@/components/TimetableManagement";
import prisma from "@/lib/prisma";
import { getActiveAcademicPeriod } from "@/lib/academicContext";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

type FilterOption = {
  id: number;
  name: string;
};

type UploadRecord = {
  id: number;
  title: string;
  fileName: string;
  fileUrl: string;
  status: string;
  academicYearLabel: string;
  termNumber: number;
  weekNumber: number;
  lessonId: number;
  lesson: {
    subject: { name: string };
    class: { name: string };
  };
  uploadedBy: {
    id: string;
    name: string;
    surname: string;
  };
  approvedBy?: string | null;
  createdAt: string;
  approvedAt?: string | null;
};

type LessonRow = {
  id: number;
  name: string;
  day: string;
  startTime: Date;
  endTime: Date;
  subject: { id: number; name: string };
  class: { id: number; name: string };
  teacher: { id: string; name: string; surname: string };
};

type SimpleOption = {
  id: number;
  name: string;
};

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  const activePeriod = await getActiveAcademicPeriod();
  const activeAcademicYear = activePeriod.yearLabel ?? null;
  const activeTermBadge =
    activeAcademicYear && activePeriod.termNumber !== null
      ? `${activeAcademicYear} · Term ${activePeriod.termNumber}`
      : null;

  const params = await searchParams;
  const { page, ...queryParams } = params;

  const uploadFilter: Prisma.ExamQuestionUploadWhereInput = {};

  if (activePeriod.yearLabel && activePeriod.termNumber !== null) {
    uploadFilter.academicYearLabel = activePeriod.yearLabel;
    uploadFilter.termNumber = activePeriod.termNumber;
  } else {
    uploadFilter.id = -1;
  }

  const lessonFilter: Prisma.LessonWhereInput = {};
  if (queryParams.classId) {
    lessonFilter.classId = parseInt(queryParams.classId);
  }
  if (queryParams.subjectId) {
    lessonFilter.subjectId = parseInt(queryParams.subjectId);
  }

  if (queryParams.search) {
    uploadFilter.OR = [
      { title: { contains: queryParams.search, mode: "insensitive" } },
      {
        lesson: {
          subject: { name: { contains: queryParams.search, mode: "insensitive" } },
        },
      },
      {
        lesson: {
          class: { name: { contains: queryParams.search, mode: "insensitive" } },
        },
      },
      {
        uploadedBy: { name: { contains: queryParams.search, mode: "insensitive" } },
      },
      {
        uploadedBy: { surname: { contains: queryParams.search, mode: "insensitive" } },
      },
    ];
  }

  if (Object.keys(lessonFilter).length > 0) {
    uploadFilter.lesson = lessonFilter;
  }

  if (queryParams.status && ["PENDING", "APPROVED"].includes(queryParams.status)) {
    uploadFilter.status = queryParams.status as "PENDING" | "APPROVED";
  }

  if (role === "teacher") {
    uploadFilter.uploadedById = currentUserId!;
  }

  const sortBy = queryParams.sortBy ?? "default";
  const uploadOrder = [
    sortBy === "year" ? { academicYearLabel: "desc" } : undefined,
    sortBy === "term" ? { termNumber: "asc" } : undefined,
    sortBy === "class" ? { lesson: { class: { name: "asc" } } } : undefined,
    sortBy === "subject" ? { lesson: { subject: { name: "asc" } } } : undefined,
    sortBy === "week" ? { weekNumber: "asc" } : undefined,
    { academicYearLabel: "desc" },
    { termNumber: "asc" },
    { lesson: { class: { name: "asc" } } },
    { lesson: { subject: { name: "asc" } } },
    { weekNumber: "asc" },
  ].filter(Boolean) as Prisma.Enumerable<Prisma.ExamQuestionUploadOrderByWithRelationInput>;

  const lessonOptions =
    role === "teacher"
      ? await prisma.lesson.findMany({
          where: {
            OR: [
              { teacherId: currentUserId!, teacher: { isArchived: false } },
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

  const teacherClassFilters = lessonOptions.reduce<FilterOption[]>((acc, lesson) => {
    if (!acc.some((item) => item.id === lesson.classId)) {
      acc.push({ id: lesson.classId, name: lesson.class.name });
    }
    return acc;
  }, []);

  const teacherSubjectFilters = lessonOptions.reduce<FilterOption[]>((acc, lesson) => {
    if (!acc.some((item) => item.id === lesson.subjectId)) {
      acc.push({ id: lesson.subjectId, name: lesson.subject.name });
    }
    return acc;
  }, []);

  const classFilters =
    role === "admin"
      ? await prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : teacherClassFilters;

  const subjectFilters =
    role === "admin"
      ? await prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : teacherSubjectFilters;

  const lessonRows: LessonRow[] =
    role === "admin"
      ? await prisma.lesson.findMany({
          include: {
            subject: { select: { id: true, name: true } },
            class: { select: { id: true, name: true } },
            teacher: { select: { id: true, name: true, surname: true } },
          },
          orderBy: [
            { day: "asc" },
            { startTime: "asc" },
          ],
        })
      : [];

  const teacherOptions =
    role === "admin"
      ? await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
          orderBy: { name: "asc" },
        })
      : [];

  const classOptions: SimpleOption[] =
    role === "admin"
      ? await prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : [];

  const subjectOptions: SimpleOption[] =
    role === "admin"
      ? await prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : [];

  const [pendingUploads, approvedUploads] = await prisma.$transaction([
    prisma.examQuestionUpload.findMany({
      where: { ...uploadFilter, status: "PENDING" },
      include: {
        lesson: {
          select: {
            id: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        uploadedBy: { select: { id: true, name: true, surname: true } },
      },
      orderBy: uploadOrder,
    }),
    prisma.examQuestionUpload.findMany({
      where: { ...uploadFilter, status: "APPROVED" },
      include: {
        lesson: {
          select: {
            id: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        uploadedBy: { select: { id: true, name: true, surname: true } },
      },
      orderBy: uploadOrder,
    }),
  ]);

  const serializedPendingUploads = pendingUploads.map((upload) => ({
    id: upload.id,
    title: upload.title,
    fileName: upload.fileName,
    fileUrl: upload.fileUrl,
    status: upload.status,
    academicYearLabel: upload.academicYearLabel,
    termNumber: upload.termNumber,
    weekNumber: upload.weekNumber,
    lessonId: upload.lesson.id,
    lesson: upload.lesson,
    uploadedBy: upload.uploadedBy,
    approvedBy: upload.approvedBy,
    createdAt: upload.createdAt.toISOString(),
    approvedAt: upload.approvedAt?.toISOString() ?? null,
  }));

  const serializedApprovedUploads = approvedUploads.map((upload) => ({
    id: upload.id,
    title: upload.title,
    fileName: upload.fileName,
    fileUrl: upload.fileUrl,
    status: upload.status,
    academicYearLabel: upload.academicYearLabel,
    termNumber: upload.termNumber,
    weekNumber: upload.weekNumber,
    lessonId: upload.lesson.id,
    lesson: upload.lesson,
    uploadedBy: upload.uploadedBy,
    approvedBy: upload.approvedBy,
    createdAt: upload.createdAt.toISOString(),
    approvedAt: upload.approvedAt?.toISOString() ?? null,
  }));

  return (
    <div className="flex-1 space-y-6">
      {role === "admin" && (
        <>
          <LessonCalendar lessons={lessonRows} subjects={subjectOptions} classes={classOptions} />
          <TimetableManagement
            lessons={lessonRows}
            teachers={teacherOptions}
            subjects={subjectOptions}
            classes={classOptions}
          />
        </>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">Lesson Uploads</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="icon-action w-8 h-8">
                <Image src="/filter.svg" alt="Filter" width={14} height={14} />
              </button>
              <button className="icon-action w-8 h-8">
                <Image src="/sort.svg" alt="Sort" width={14} height={14} />
              </button>
            </div>
          </div>
        </div>
        <LessonUploadsPanel
          role={role}
          currentUserId={currentUserId}
          lessons={lessonOptions}
          pendingUploads={serializedPendingUploads}
          approvedUploads={serializedApprovedUploads}
          activeAcademicYear={activeAcademicYear}
          activeTermBadge={activeTermBadge}
          classFilters={classFilters}
          subjectFilters={subjectFilters}
        />
      </div>
    </div>
  );
};

export default LessonListPage;
