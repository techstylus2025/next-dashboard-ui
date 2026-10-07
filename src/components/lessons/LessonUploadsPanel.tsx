"use client";

import { Fragment, useEffect, useState } from "react";
import { useActionState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { BadgeCheck, Eye, Pencil, Trash2 } from "lucide-react";
import LessonUploadForm, { LessonUploadEditItem } from "@/components/lessons/LessonUploadForm";
import ExamQuestionPreviewModal from "@/components/exams/ExamQuestionPreviewModal";
import {
  approveLessonDocument,
  deleteLessonDocumentUpload,
} from "@/lib/actions";
import { groupUploadsByAcademicPeriod } from "@/lib/groupUploadsByAcademicPeriod";

export type LessonOption = {
  id: number;
  name: string;
  subject: { name: string };
  class: { name: string };
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

type FilterOption = {
  id: number;
  name: string;
};

type Props = {
  role?: string | null;
  currentUserId?: string | null;
  lessons?: LessonOption[];
  pendingUploads?: UploadRecord[];
  approvedUploads?: UploadRecord[];
  activeAcademicYear?: string | null;
  activeTermBadge?: string | null;
  classFilters?: FilterOption[];
  subjectFilters?: FilterOption[];
};

const LessonUploadsPanel = ({
  role,
  currentUserId,
  lessons = [],
  pendingUploads = [],
  approvedUploads = [],
  activeAcademicYear,
  activeTermBadge,
  classFilters = [],
  subjectFilters = [],
}: Props) => {
  const [open, setOpen] = useState(false);
  const [editingUpload, setEditingUpload] = useState<LessonUploadEditItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewedIds, setPreviewedIds] = useState<number[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [approveState, approveAction] = useActionState(approveLessonDocument, {
    success: false,
    error: false,
  });
  const [deleteState, deleteAction] = useActionState(deleteLessonDocumentUpload, {
    success: false,
    error: false,
  });

  useEffect(() => {
    if (approveState.success) {
      toast("Lesson upload confirmed.");
      setPreviewOpen(false);
      router.refresh();
    } else if (approveState.error) {
      toast.error("Unable to confirm the lesson upload.");
    }
  }, [approveState, router]);

  useEffect(() => {
    if (deleteState.success) {
      toast("Lesson upload deleted.");
      setPreviewOpen(false);
      router.refresh();
    } else if (deleteState.error) {
      toast.error("Unable to delete the lesson upload.");
    }
  }, [deleteState, router]);

  const handleApprove = (id: number) => {
    startTransition(() => {
      approveAction({ id });
    });
  };

  const handleDelete = (id: number) => {
    startTransition(() => {
      deleteAction({ id });
    });
  };

  const handlePreview = (upload: UploadRecord) => {
    setPreviewTitle(upload.title);
    setPreviewUrl(upload.fileUrl);
    setPreviewOpen(true);
    setPreviewedIds((current) =>
      current.includes(upload.id) ? current : [...current, upload.id]
    );
  };

  const handleEdit = (upload: UploadRecord) => {
    setEditingUpload({
      id: upload.id,
      title: upload.title,
      weekNumber: upload.weekNumber,
      lessonId: upload.lessonId,
      fileName: upload.fileName,
      fileUrl: upload.fileUrl,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingUpload(null);
  };

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const statusValue = searchParams.get("status") ?? "all";
  const sortByValue = searchParams.get("sortBy") ?? "default";
  const classValue = searchParams.get("classId") ?? "all";
  const subjectValue = searchParams.get("subjectId") ?? "all";

  const showTeacherUploadButton = role === "teacher" && Boolean(activeTermBadge);
  const showPendingSection = pendingUploads.length > 0;
  const showApprovedSection = approvedUploads.length > 0;
  const pendingUploadGroups = groupUploadsByAcademicPeriod(pendingUploads);
  const approvedUploadGroups = groupUploadsByAcademicPeriod(approvedUploads);
  const filterSelectClass =
    "shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  return (
    <section className="mt-5 space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Browse lesson documents</h3>
          <p className="mt-1 text-sm text-slate-500">
            {pendingUploads.length} pending · {approvedUploads.length} confirmed
          </p>
        </div>

        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <select
            value={statusValue}
            onChange={(event) => updateQuery("status", event.target.value)}
            className={filterSelectClass}
          >
            <option value="all">All statuses</option>
            <option value="PENDING">Pending review</option>
            <option value="APPROVED">Confirmed</option>
          </select>
          <select
            value={sortByValue}
            onChange={(event) => updateQuery("sortBy", event.target.value)}
            className={filterSelectClass}
          >
            <option value="default">Sort by latest</option>
            <option value="year">Academic year</option>
            <option value="term">Term</option>
            <option value="class">Class</option>
            <option value="subject">Subject</option>
            <option value="week">Week</option>
          </select>
          {classFilters.length > 0 && (
            <select
              value={classValue}
              onChange={(event) => updateQuery("classId", event.target.value)}
              className={filterSelectClass}
            >
              <option value="all">All classes</option>
              {classFilters.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          )}
          {subjectFilters.length > 0 && (
            <select
              value={subjectValue}
              onChange={(event) => updateQuery("subjectId", event.target.value)}
              className={filterSelectClass}
            >
              <option value="all">All subjects</option>
              {subjectFilters.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          )}
          {showTeacherUploadButton && (
            <button
              type="button"
              className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
              onClick={() => setOpen(true)}
            >
              + Add lesson uploads
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-900"
              onClick={closeModal}
            >
              ✕
            </button>
            <LessonUploadForm
              setOpen={setOpen}
              relatedData={{
                lessons,
                activeAcademicYear: activeAcademicYear ?? null,
                activeTermBadge: activeTermBadge ?? null,
              }}
              editingUpload={editingUpload}
              onCompleted={() => {
                closeModal();
                router.refresh();
              }}
            />
          </div>
        </div>
      )}

      {showPendingSection ? (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-slate-900">Pending lesson uploads</h3>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{pendingUploads.length} awaiting review</span>
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2">Week</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Class</th>
                <th className="py-2">Teacher</th>
                <th className="py-2">Document title</th>
                <th className="py-2">Document</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUploadGroups.map((yearGroup) => (
                <Fragment key={yearGroup.academicYearLabel}>
                  <tr className="bg-slate-100">
                    <th colSpan={7} className="bg-slate-100 px-3 py-2.5 text-left font-semibold text-slate-800">{yearGroup.academicYearLabel}</th>
                  </tr>
                  {yearGroup.terms.map((termGroup) => (
                    <Fragment key={`${yearGroup.academicYearLabel}-${termGroup.termNumber}`}>
                      <tr className="bg-slate-50">
                        <th colSpan={7} className="px-4 py-2.5 text-left font-semibold text-slate-700">
                          Term {termGroup.termNumber}<span className="ml-2 text-xs font-normal text-slate-500">{termGroup.records.length} upload{termGroup.records.length === 1 ? "" : "s"}</span>
                        </th>
                      </tr>
                      {termGroup.records.map((upload) => (
                        <tr key={upload.id} className="border-b border-slate-100 transition-colors hover:bg-sky-50/50">
                          <td className="px-3 py-3">{upload.weekNumber}</td>
                          <td className="px-3 py-3 font-medium text-slate-800">{upload.lesson.subject.name}</td>
                          <td className="px-3 py-3">{upload.lesson.class.name}</td>
                          <td className="px-3 py-3">{upload.uploadedBy.name} {upload.uploadedBy.surname}</td>
                          <td className="px-3 py-3 font-medium">{upload.title}</td>
                          <td className="px-3 py-3">
                            <a className="font-medium text-sky-700 underline decoration-sky-200 underline-offset-2 hover:text-sky-900" href={upload.fileUrl} target="_blank" rel="noreferrer">{upload.fileName}</a>
                          </td>
                          <td className="flex gap-2 px-3 py-3">
                            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => handlePreview(upload)} aria-label="Preview lesson document" title="Preview"><Eye size={16} /></button>
                            {role === "admin" && <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => handleApprove(upload.id)} aria-label="Approve lesson document" title="Approve"><BadgeCheck size={16} /></button>}
                            {role === "teacher" && upload.uploadedBy.id === currentUserId && (
                              <>
                                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200" onClick={() => { setEditingUpload({ id: upload.id, title: upload.title, weekNumber: upload.weekNumber, lessonId: upload.lessonId, fileName: upload.fileName, fileUrl: upload.fileUrl }); setOpen(true); }} aria-label="Edit lesson document" title="Edit"><Pencil size={15} /></button>
                                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700" onClick={() => handleDelete(upload.id)} aria-label="Delete lesson document" title="Delete"><Trash2 size={15} /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No pending lesson uploads found.
        </div>
      )}

      {showApprovedSection ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-slate-900">Confirmed lesson uploads</h3>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{approvedUploads.length} available</span>
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2">Week</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Class</th>
                <th className="py-2">Teacher</th>
                <th className="py-2">Document title</th>
                <th className="py-2">Document</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvedUploadGroups.map((yearGroup) => (
                <Fragment key={yearGroup.academicYearLabel}>
                  <tr className="bg-slate-100">
                    <th colSpan={7} className="bg-slate-100 px-3 py-2.5 text-left font-semibold text-slate-800">{yearGroup.academicYearLabel}</th>
                  </tr>
                  {yearGroup.terms.map((termGroup) => (
                    <Fragment key={`${yearGroup.academicYearLabel}-${termGroup.termNumber}`}>
                      <tr className="bg-slate-50">
                        <th colSpan={7} className="px-4 py-2.5 text-left font-semibold text-slate-700">
                          Term {termGroup.termNumber}<span className="ml-2 text-xs font-normal text-slate-500">{termGroup.records.length} upload{termGroup.records.length === 1 ? "" : "s"}</span>
                        </th>
                      </tr>
                      {termGroup.records.map((upload) => (
                        <tr key={upload.id} className="border-b border-slate-100 transition-colors hover:bg-sky-50/50">
                          <td className="px-3 py-3">{upload.weekNumber}</td>
                          <td className="px-3 py-3 font-medium text-slate-800">{upload.lesson.subject.name}</td>
                          <td className="px-3 py-3">{upload.lesson.class.name}</td>
                          <td className="px-3 py-3">{upload.uploadedBy.name} {upload.uploadedBy.surname}</td>
                          <td className="px-3 py-3 font-medium">{upload.title}</td>
                          <td className="px-3 py-3"><a className="font-medium text-sky-700 underline decoration-sky-200 underline-offset-2 hover:text-sky-900" href={upload.fileUrl} target="_blank" rel="noreferrer">{upload.fileName}</a></td>
                          <td className="flex gap-2 px-3 py-3">
                            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => handlePreview(upload)} aria-label="Preview lesson document" title="Preview"><Eye size={16} /></button>
                            {(role === "admin" || (role === "teacher" && upload.uploadedBy.id === currentUserId)) && (
                              <>
                                {role === "teacher" && <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200" onClick={() => { setEditingUpload({ id: upload.id, title: upload.title, weekNumber: upload.weekNumber, lessonId: upload.lessonId, fileName: upload.fileName, fileUrl: upload.fileUrl }); setOpen(true); }} aria-label="Edit lesson document" title="Edit"><Pencil size={15} /></button>}
                                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700" onClick={() => handleDelete(upload.id)} aria-label="Delete lesson document" title="Delete"><Trash2 size={15} /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No confirmed lesson uploads found.
        </div>
      )}

      <ExamQuestionPreviewModal
        open={previewOpen}
        title={previewTitle}
        fileUrl={previewUrl}
        onClose={() => setPreviewOpen(false)}
      />
    </section>
  );
};

export default LessonUploadsPanel;
