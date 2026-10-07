import LessonUploadsPanel from "@/components/lessons/LessonUploadsPanel";
import LessonCalendar from "@/components/LessonCalendar";
import TableSearch from "@/components/TableSearch";
import TimetableManagement from "@/components/TimetableManagement";
import { getCurrentAuthContext } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getActiveAcademicPeriod } from "@/lib/academicContext";
import { Prisma } from "@prisma/client";
import { BookOpen, CalendarDays, ClipboardCheck } from "lucide-react";

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

type ClassLessonOption = SimpleOption & {
  subjects: {
    id: number;
    name: string;
    teachers: { id: string; name: string; surname: string }[];
  }[];
};

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const { userId: currentUserId, role } = await getCurrentAuthContext();

  const activePeriod = await getActiveAcademicPeriod();
  const activeAcademicYear = activePeriod.yearLabel ?? null;
  const activeTermBadge =
    activeAcademicYear && activePeriod.termNumber !== null
      ? `${activeAcademicYear} · Term ${activePeriod.termNumber}`
      : null;

  const params = await searchParams;
  const queryParams = params;

  const uploadFilter: Prisma.ExamQuestionUploadWhereInput = {
    documentType: "LESSON_DOCUMENT",
  };

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

  const teacherAssignments =
    role === "teacher" && currentUserId
      ? await prisma.teacher.findUnique({
          where: { id: currentUserId },
          select: {
            isArchived: true,
            subjects: { select: { id: true } },
            assignedClasses: {
              select: { id: true },
            },
          },
        })
      : null;

  const assignedSubjectIds = new Set(
    teacherAssignments && !teacherAssignments.isArchived
      ? teacherAssignments.subjects.map((subject) => subject.id)
      : []
  );
  const allowedClassSubjectPairs =
    teacherAssignments && !teacherAssignments.isArchived
      ? teacherAssignments.assignedClasses.flatMap((classItem) =>
          Array.from(assignedSubjectIds).map((subjectId) => ({
            classId: classItem.id,
            subjectId,
          }))
        )
      : [];

  const teacherLessonRows =
    currentUserId && (role === "teacher" || allowedClassSubjectPairs.length > 0)
      ? await prisma.lesson.findMany({
          where: {
            OR: [
              { teacherId: currentUserId },
              ...allowedClassSubjectPairs,
            ],
          },
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
          orderBy: [{ name: "asc" }, { id: "asc" }],
        })
      : [];

  const lessonOptions = Array.from(
    new Map(
      teacherLessonRows.map((lesson) => [
        `${lesson.classId}:${lesson.subjectId}`,
        lesson,
      ])
    ).values()
  );

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
    role === "admin" || (role === "teacher" && currentUserId)
      ? await prisma.lesson.findMany({
          where: role === "teacher" ? { teacherId: currentUserId! } : undefined,
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

  const classOptions: ClassLessonOption[] =
    role === "admin"
      ? await prisma.class.findMany({
          select: {
            id: true,
            name: true,
            subjects: {
              select: {
                id: true,
                name: true,
                teachers: {
                  where: { isArchived: false },
                  select: { id: true, name: true, surname: true },
                  orderBy: [{ name: "asc" }, { surname: "asc" }],
                },
              },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { name: "asc" },
        })
      : [];

  const subjectOptions: SimpleOption[] =
    role === "admin"
      ? await prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : [];

  const scheduleClassOptions =
    role === "teacher"
      ? Array.from(
          new Map(
            lessonRows.map((lesson) => [
              lesson.class.id,
              { id: lesson.class.id, name: lesson.class.name },
            ])
          ).values()
        )
      : classOptions;
  const scheduleSubjectOptions =
    role === "teacher"
      ? Array.from(
          new Map(
            lessonRows.map((lesson) => [
              lesson.subject.id,
              { id: lesson.subject.id, name: lesson.subject.name },
            ])
          ).values()
        )
      : subjectOptions;

  const [pendingUploads, approvedUploads] = await Promise.all([
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

  const uploadCount = serializedPendingUploads.length + serializedApprovedUploads.length;
  const classCount = new Set([
    ...serializedPendingUploads.map((upload) => upload.lesson.class.name),
    ...serializedApprovedUploads.map((upload) => upload.lesson.class.name),
  ]).size;
  const isAdmin = role === "admin";
  const visibleScheduleCount = isAdmin
    ? lessonRows.length
    : role === "teacher"
      ? lessonRows.length
      : lessonOptions.length;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-3 sm:p-5 lg:p-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Teaching & learning
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Class lessons</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isAdmin
                ? "Manage the school timetable and keep lesson resources organised for every class."
                : role === "teacher"
                  ? "Review your teaching schedule and manage the lesson resources shared with your classes."
                  : "Explore lesson resources shared for your classes and stay up to date with learning."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[390px] sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <CalendarDays className="mb-3 h-5 w-5 text-sky-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{isAdmin || role === "teacher" ? visibleScheduleCount : uploadCount}</p>
              <p className="mt-1 text-xs text-slate-300">{isAdmin ? "Scheduled lessons" : role === "teacher" ? "Assigned lessons" : "Lesson resources"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <ClipboardCheck className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{uploadCount}</p>
              <p className="mt-1 text-xs text-slate-300">Lesson uploads</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur sm:col-span-1">
              <BookOpen className="mb-3 h-5 w-5 text-violet-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{classCount}</p>
              <p className="mt-1 text-xs text-slate-300">Classes with resources</p>
            </div>
          </div>
        </div>
        {activeTermBadge ? (
          <div className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-200">
            Active period <span className="mx-2 text-slate-500">·</span>{activeTermBadge}
          </div>
        ) : null}
      </section>

      {(role === "admin" || role === "teacher") && (
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
              {role === "admin" ? "School timetable" : "My timetable"}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {role === "admin" ? "Schedule management" : "Weekly lessons"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {role === "admin"
                ? "Review the weekly schedule or manage lessons by day."
                : "Review all lessons scheduled for you throughout the week."}
            </p>
          </div>
          <LessonCalendar
            lessons={lessonRows}
            subjects={scheduleSubjectOptions}
            classes={scheduleClassOptions}
          />
          {role === "admin" ? (
            <TimetableManagement
              lessons={lessonRows}
              subjects={subjectOptions}
              classes={classOptions}
            />
          ) : null}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Learning materials</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Lesson resources</h2>
            <p className="mt-1 text-sm text-slate-500">Browse, filter, and review lesson documents by class and subject.</p>
          </div>
          <TableSearch initialValue={queryParams.search ?? ""} />
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
      </section>
    </div>
  );
};

export default LessonListPage;
