"use client";

import { useEffect, useState } from "react";
import { useActionState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import LessonUploadForm, { LessonUploadEditItem } from "@/components/lessons/LessonUploadForm";
import ExamQuestionPreviewModal from "@/components/exams/ExamQuestionPreviewModal";
import {
  approveLessonDocument,
  deleteLessonDocumentUpload,
} from "@/lib/actions";

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

  return (
    <section className="bg-slate-50 p-4 rounded-md mt-6">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Lesson Document Uploads</h2>
          <p className="text-sm text-slate-600">
            {activeTermBadge
              ? `Active term: ${activeTermBadge}`
              : "No active academic term is set. Create or review uploads once the current term is active."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusValue}
            onChange={(event) => updateQuery("status", event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="PENDING">Pending review</option>
            <option value="APPROVED">Confirmed</option>
          </select>
          <select
            value={sortByValue}
            onChange={(event) => updateQuery("sortBy", event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
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
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
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
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
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
              className="rounded-md bg-lamaYellow px-4 py-2 text-sm font-medium"
              onClick={() => setOpen(true)}
            >
              + Add lesson uploads
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-4xl rounded-md bg-white p-6 shadow-xl">
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
                activeAcademicYear,
                activeTermBadge,
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
        <div className="overflow-x-auto mt-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold">Pending lesson uploads</h3>
            <span className="text-xs text-slate-500">Preview before confirming or updating.</span>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-300 text-slate-600">
              <tr>
                <th className="py-2">Year</th>
                <th className="py-2">Term</th>
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
              {pendingUploads.map((upload) => (
                <tr key={upload.id} className="border-b border-slate-200 even:bg-white odd:bg-slate-50">
                  <td className="py-3">{upload.academicYearLabel}</td>
                  <td className="py-3">{upload.termNumber}</td>
                  <td className="py-3">{upload.weekNumber}</td>
                  <td className="py-3">{upload.lesson.subject.name}</td>
                  <td className="py-3">{upload.lesson.class.name}</td>
                  <td className="py-3">
                    {upload.uploadedBy.name} {upload.uploadedBy.surname}
                  </td>
                  <td className="py-3">{upload.title}</td>
                  <td className="py-3">
                    <a
                      className="text-blue-600 underline"
                      href={upload.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {upload.fileName}
                    </a>
                  </td>
                  <td className="py-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md bg-slate-200 px-3 py-1 text-sm text-slate-700"
                      onClick={() => handlePreview(upload)}
                    >
                      Preview
                    </button>
                    {role === "admin" && (
                      <button
                        type="button"
                        className="btn-primary text-sm"
                        onClick={() => handleApprove(upload.id)}
                      >
                        Confirm review
                      </button>
                    )}
                    {role === "teacher" && upload.uploadedBy.id === currentUserId && (
                      <>
                        <button
                          type="button"
                          className="rounded-md bg-amber-200 px-3 py-1 text-sm text-slate-800"
                          onClick={() => {
                            setEditingUpload({
                              id: upload.id,
                              title: upload.title,
                              weekNumber: upload.weekNumber,
                              lessonId: upload.lessonId,
                              fileName: upload.fileName,
                              fileUrl: upload.fileUrl,
                            });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white"
                          onClick={() => handleDelete(upload.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No pending lesson uploads found for the current term.
        </div>
      )}

      {showApprovedSection ? (
        <div className="mt-8 overflow-x-auto">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold">Confirmed lesson uploads</h3>
            <span className="text-xs text-slate-500">Confirmed uploads are available for review and download.</span>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-300 text-slate-600">
              <tr>
                <th className="py-2">Year</th>
                <th className="py-2">Term</th>
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
              {approvedUploads.map((upload) => (
                <tr key={upload.id} className="border-b border-slate-200 even:bg-white odd:bg-slate-50">
                  <td className="py-3">{upload.academicYearLabel}</td>
                  <td className="py-3">{upload.termNumber}</td>
                  <td className="py-3">{upload.weekNumber}</td>
                  <td className="py-3">{upload.lesson.subject.name}</td>
                  <td className="py-3">{upload.lesson.class.name}</td>
                  <td className="py-3">
                    {upload.uploadedBy.name} {upload.uploadedBy.surname}
                  </td>
                  <td className="py-3">{upload.title}</td>
                  <td className="py-3">
                    <a
                      className="text-blue-600 underline"
                      href={upload.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {upload.fileName}
                    </a>
                  </td>
                  <td className="py-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md bg-slate-200 px-3 py-1 text-sm text-slate-700"
                      onClick={() => handlePreview(upload)}
                    >
                      Preview
                    </button>
                    {(role === "admin" || (role === "teacher" && upload.uploadedBy.id === currentUserId)) && (
                      <>
                        {role === "teacher" && upload.uploadedBy.id === currentUserId && (
                          <button
                            type="button"
                            className="rounded-md bg-amber-200 px-3 py-1 text-sm text-slate-800"
                            onClick={() => {
                              setEditingUpload({
                                id: upload.id,
                                title: upload.title,
                                weekNumber: upload.weekNumber,
                                lessonId: upload.lessonId,
                                fileName: upload.fileName,
                                fileUrl: upload.fileUrl,
                              });
                              setOpen(true);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white"
                          onClick={() => handleDelete(upload.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

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
