import ExamFiltersModal from "@/components/exams/ExamFiltersModal";
import ExamQuestionUploadsPanel from "@/components/exams/ExamQuestionUploadsPanel";
import ExamTimetableModal from "@/components/exams/ExamTimetableModal";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { getCurrentAuthContext } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getActiveAcademicPeriod } from "@/lib/academicContext";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Exam, Prisma, Subject, Teacher } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { BookOpen, CalendarDays, ClipboardCheck, Clock3, GraduationCap, Users } from "lucide-react";

type ExamList = Exam & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
  invigilators: { id: string; name: string; surname: string }[];
};

const ExamListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {

  const { userId: currentUserId, role } = await getCurrentAuthContext();

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

  const teacherOptions = await prisma.teacher.findMany({
    where: { isArchived: false },
    select: { id: true, name: true, surname: true },
    orderBy: { name: "asc" },
  });

  const { page, ...queryParams } = await searchParams;

  const p = page ? parseInt(page) : 1;
  const sortBy = queryParams.sortBy ?? "date";
  const sortOrder = (queryParams.sortOrder as "asc" | "desc") ?? "desc";
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

  const pendingUploadWhere: Prisma.ExamQuestionUploadWhereInput = {
    documentType: "EXAM_QUESTION",
    status: "PENDING",
    ...(role === "teacher" ? { uploadedById: currentUserId! } : {}),
  };

  const approvedUploadWhere: Prisma.ExamQuestionUploadWhereInput = {
    documentType: "EXAM_QUESTION",
    status: "APPROVED",
    ...(role === "teacher" ? { uploadedById: currentUserId! } : {}),
  };

  const [data, count, pendingUploads, approvedUploads] = await Promise.all([
    prisma.exam.findMany({
      where: examQuery,
      include: {
        invigilators: {
          select: { id: true, name: true, surname: true },
          orderBy: { name: "asc" },
        },
        lesson: {
          select: {
            id: true,
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
            id: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        uploadedBy: { select: { id: true, name: true, surname: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.examQuestionUpload.findMany({
      where: approvedUploadWhere,
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
      orderBy: { approvedAt: "desc" },
    }),
  ]);

  const approverIds = [...new Set(
    approvedUploads
      .map((upload) => upload.approvedBy)
      .filter((approverId): approverId is string => Boolean(approverId))
  )];
  const [localUsers, localAdmins] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: approverIds } },
      select: { id: true, username: true },
    }),
    prisma.admin.findMany({
      where: { id: { in: approverIds } },
      select: { id: true, username: true },
    }),
  ]);
  const approverNames = new Map<string, string>();
  for (const user of [...localUsers, ...localAdmins]) {
    if (user.username) approverNames.set(user.id, user.username);
  }

  if (approverIds.length > 0) {
    try {
      const clerk = await clerkClient();
      await Promise.all(approverIds.map(async (approverId) => {
        try {
          const user = await clerk.users.getUser(approverId);
          const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ")
            || user.username
            || user.emailAddresses[0]?.emailAddress;
          if (displayName) approverNames.set(approverId, displayName);
        } catch {
          // Some app-managed admin IDs do not correspond to Clerk users.
        }
      }));
    } catch {
      // Local usernames remain available when Clerk cannot be reached.
    }
  }

  const sortedData = [...data].sort((a, b) => {
    const direction = sortOrder === "asc" ? 1 : -1;

    switch (sortBy) {
      case "subject":
        return direction * ((a.lesson?.subject?.name ?? "").localeCompare(b.lesson?.subject?.name ?? ""));
      case "class":
        return direction * ((a.lesson?.class?.name ?? "").localeCompare(b.lesson?.class?.name ?? ""));
      case "teacher":
        return direction * ((a.lesson?.teacher?.name ?? "").localeCompare(b.lesson?.teacher?.name ?? ""));
      case "date":
      default:
        return direction * (a.startTime.getTime() - b.startTime.getTime());
    }
  });

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
    academicYearLabel: upload.academicYearLabel,
    termNumber: upload.termNumber,
    lessonId: upload.lesson.id,
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
    academicYearLabel: upload.academicYearLabel,
    termNumber: upload.termNumber,
    lessonId: upload.lesson.id,
    lesson: upload.lesson,
    uploadedBy: upload.uploadedBy,
    approvedByName: upload.approvedBy
      ? approverNames.get(upload.approvedBy) ?? "Unknown administrator"
      : "Unknown administrator",
    createdAt: upload.createdAt.toISOString(),
    approvedAt: upload.approvedAt?.toISOString() ?? null,
  }));

  const examClassCount = new Set(
    sortedData.map((exam) => exam.lesson?.class?.name).filter(Boolean)
  ).size;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-3 sm:p-5 lg:p-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Assessment management
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Student exams</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {role === "admin"
                ? "Plan exam sessions, coordinate invigilators, and review learning assessments across classes."
                : role === "teacher"
                  ? "Review your students’ exam timetable and manage the question resources for your lessons."
                  : "Keep track of upcoming exams and review resources shared for your classes."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[390px] sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <CalendarDays className="mb-3 h-5 w-5 text-sky-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{count}</p>
              <p className="mt-1 text-xs text-slate-300">Exam sessions</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <ClipboardCheck className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{pendingUploads.length}</p>
              <p className="mt-1 text-xs text-slate-300">Questions to review</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur sm:col-span-1">
              <GraduationCap className="mb-3 h-5 w-5 text-violet-300" aria-hidden="true" />
              <p className="text-2xl font-bold">{examClassCount}</p>
              <p className="mt-1 text-xs text-slate-300">Classes in view</p>
            </div>
          </div>
        </div>
        {activeTermBadge ? (
          <div className="mt-6 inline-flex items-center rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-200">
            Active period <span className="mx-2 text-slate-500">·</span>{activeTermBadge}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Exam timetable</h2>
            <p className="mt-1 text-sm text-slate-500">Browse, search, and filter scheduled exams.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <TableSearch initialValue={queryParams.search ?? ""} />
            <div className="flex items-center gap-3 self-end sm:self-auto">
            <ExamFiltersModal
              classes={adminClasses}
              teachers={teacherOptions}
              initialSearch={queryParams.search ?? ""}
              initialClassId={queryParams.classId ?? ""}
              initialTeacherId={queryParams.teacherId ?? ""}
              initialSortBy={sortBy}
              initialSortOrder={sortOrder}
            />
            {role === "admin" && (
              <ExamTimetableModal
                classes={adminClasses}
                lessons={adminLessons}
                teachers={teacherOptions}
              />
            )}
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-5">
          {sortedData.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-slate-800">No exams found</h3>
              <p className="mt-1 text-sm text-slate-500">Try changing the search or filters, or schedule an exam for this period.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedData.map((exam) => {
                const teacherName = exam.lesson?.teacher
                  ? `${exam.lesson.teacher.name ?? ""} ${exam.lesson.teacher.surname ?? ""}`.trim() || "Unknown teacher"
                  : "Unknown teacher";
                const isUpcoming = exam.startTime.getTime() >= Date.now();
                return (
                  <article key={exam.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                          <BookOpen className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-slate-900" title={exam.title}>{exam.title}</h3>
                          <p className="mt-1 truncate text-sm text-slate-500">{exam.lesson?.subject?.name ?? "Unknown subject"}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                        isUpcoming ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}>{isUpcoming ? "Upcoming" : "Completed"}</span>
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-start gap-3 text-sm">
                        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <div>
                          <p className="font-medium text-slate-800">{exam.lesson?.class?.name ?? "Unknown class"}</p>
                          <p className="text-xs text-slate-500">{teacherName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <div>
                          <p className="font-medium text-slate-800">
                            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(exam.startTime)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(exam.startTime)}
                            {" – "}
                            {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(exam.endTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">Invigilators</p>
                          <p className="mt-0.5 text-sm text-slate-700">
                            {exam.invigilators.length > 0
                              ? exam.invigilators.map((teacher) => `${teacher.name} ${teacher.surname}`.trim()).join(", ")
                              : "Not assigned"}
                          </p>
                        </div>
                      </div>
                      {role === "admin" && (
                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                          <FormContainer table="exam" type="update" data={exam} />
                          <FormContainer table="exam" type="delete" id={exam.id} />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 px-4 py-3">
          <Pagination page={p} count={count} />
        </div>
      </section>
      {(role === "admin" || role === "teacher") && (
        <ExamQuestionUploadsPanel
          role={role}
          currentUserId={currentUserId}
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
