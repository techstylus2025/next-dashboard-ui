"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState, startTransition } from "react";
import { toast } from "react-toastify";
import ExamQuestionUploadForm from "@/components/forms/ExamQuestionUploadForm";
import ExamQuestionPreviewModal from "@/components/exams/ExamQuestionPreviewModal";
import { approveExamQuestion, deleteExamQuestionUpload } from "@/lib/actions";
import { BadgeCheck, ChevronDown, Eye, Pencil, Trash2 } from "lucide-react";
import { groupUploadsByAcademicPeriod } from "@/lib/groupUploadsByAcademicPeriod";

export type ExamQuestionEditItem = {
  id: number;
  title: string;
  lessonId: number;
  fileName: string;
  fileUrl: string;
};

type LessonOption = {
  id: number;
  name: string;
  subject: { name: string };
  class: { name: string };
};

type UploadRecord = {
  id: number;
  lessonId: number;
  title: string;
  fileName: string;
  fileUrl: string;
  status: string;
  academicYearLabel: string;
  termNumber: number;
  lesson: {
    subject: { name: string };
    class: { name: string };
  };
  uploadedBy: {
    id: string;
    name: string;
    surname: string;
  };
  approvedByName?: string | null;
  createdAt: string;
  approvedAt?: string | null;
};

type Props = {
  role?: string | null;
  currentUserId?: string | null;
  lessons?: LessonOption[];
  pendingUploads?: UploadRecord[];
  approvedUploads?: UploadRecord[];
  activeTermBadge?: string | null;
};

const ExamQuestionUploadsPanel = ({
  role,
  currentUserId,
  lessons = [],
  pendingUploads = [],
  approvedUploads = [],
  activeTermBadge,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [editingUpload, setEditingUpload] = useState<ExamQuestionEditItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewedIds, setPreviewedIds] = useState<number[]>([]);
  const [expandedUploadIds, setExpandedUploadIds] = useState<Record<number, boolean>>({});
  const router = useRouter();

  const [approveState, approveAction] = useActionState(approveExamQuestion, {
    success: false,
    error: false,
  });
  const [deleteState, deleteAction] = useActionState(deleteExamQuestionUpload, {
    success: false,
    error: false,
  });

  useEffect(() => {
    if (approveState.success) {
      toast("Exam question upload approved.");
      setPreviewOpen(false);
      router.refresh();
    } else if (approveState.error) {
      toast.error("Unable to approve exam question upload.");
    }
  }, [approveState, router]);

  useEffect(() => {
    if (deleteState.success) {
      toast("Exam question upload removed.");
      router.refresh();
    } else if (deleteState.error) {
      toast.error("Unable to delete approved exam question.");
    }
  }, [deleteState, router]);

  const handleApprove = (id: number) => {
    startTransition(() => {
      approveAction({ id });
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this exam question upload?")) return;
    startTransition(() => {
      deleteAction({ id });
    });
  };

  const handleEdit = (upload: UploadRecord) => {
    setEditingUpload({
      id: upload.id,
      title: upload.title,
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

  const handlePreview = (upload: UploadRecord) => {
    setPreviewTitle(upload.title);
    setPreviewUrl(upload.fileUrl);
    setPreviewOpen(true);

    setPreviewedIds((current) =>
      current.includes(upload.id) ? current : [...current, upload.id]
    );
  };

  const toggleUploadDetails = (uploadId: number) => {
    setExpandedUploadIds((current) => ({
      ...current,
      [uploadId]: !current[uploadId],
    }));
  };

  const showTeacherUpload =
    role === "teacher" && lessons.length > 0 && Boolean(activeTermBadge);
  const showPendingSection =
    (role === "admin" || role === "teacher") && pendingUploads.length > 0;
  const showApprovedSection = approvedUploads.length > 0;
  const pendingUploadGroups = groupUploadsByAcademicPeriod(pendingUploads);
  const approvedUploadGroups = groupUploadsByAcademicPeriod(approvedUploads);

  return (
    <section className="bg-slate-50 p-4 rounded-md mt-6">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Exam Question Review</h2>
          <p className="text-xs text-slate-600">
            {activeTermBadge
              ? `New uploads use the current term: ${activeTermBadge}. Existing uploads are grouped by academic year and term.`
              : "Existing uploads are grouped by academic year and term. New uploads are restricted until a current term is set."}
          </p>
        </div>
        {showTeacherUpload && (
          <button
            type="button"
            className="bg-lamaYellow px-4 py-2 rounded-md text-sm font-medium"
            onClick={() => {
              setEditingUpload(null);
              setOpen(true);
            }}
          >
            Upload exam question
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md w-full max-w-2xl p-6 relative">
            <div
              className="absolute top-4 right-4 cursor-pointer text-slate-500"
              onClick={closeModal}
            >
              ✕
            </div>
            <ExamQuestionUploadForm setOpen={setOpen} relatedData={{ lessons }} editingUpload={editingUpload} />
          </div>
        </div>
      )}

      {role === "student" || role === "parent" ? (
        <div className="text-xs text-slate-600">
          Exam question uploads are available only to subject teachers and class supervisors.
        </div>
      ) : null}

      {showPendingSection && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold">
              {role === "admin" ? "Pending Review" : "Your Pending Uploads"}
            </h3>
            {role === "admin" && (
              <span className="text-xs text-slate-500">
                Preview before approving.
              </span>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-300 text-slate-600">
              <tr>
                <th className="py-2">Title</th>
                <th className="py-2">Lesson</th>
                <th className="py-2">Uploaded by</th>
                <th className="py-2">Submitted</th>
                <th className="py-2">Document</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            {pendingUploadGroups.map((yearGroup) => yearGroup.terms.map((termGroup) => (
              <tbody key={`${yearGroup.academicYearLabel}-${termGroup.termNumber}`}>
                <tr className="bg-slate-100">
                  <th colSpan={6} className="py-2 text-left font-semibold text-slate-800">
                    {yearGroup.academicYearLabel}<span className="ml-2 font-medium text-slate-600">· Term {termGroup.termNumber}</span>
                    <span className="ml-2 text-xs font-normal text-slate-500">{termGroup.records.length} upload{termGroup.records.length === 1 ? "" : "s"}</span>
                  </th>
                </tr>
                {termGroup.records.map((upload) => (
                  <tr key={upload.id} className="border-b border-slate-200">
                    <td className="py-3">{upload.title}</td>
                    <td className="py-3">{upload.lesson.subject.name} / {upload.lesson.class.name}</td>
                    <td className="py-3">{upload.uploadedBy.name} {upload.uploadedBy.surname}</td>
                    <td className="py-3">{new Intl.DateTimeFormat("en-US").format(new Date(upload.createdAt))}</td>
                    <td className="py-3"><a className="text-blue-600 underline" href={upload.fileUrl} target="_blank" rel="noreferrer">{upload.fileName}</a></td>
                    <td className="py-3 flex flex-wrap gap-2">
                      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => handlePreview(upload)} aria-label="Preview exam question" title="Preview"><Eye size={16} /></button>
                      {role === "admin" && <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => handleApprove(upload.id)} disabled={!previewedIds.includes(upload.id)} aria-label="Approve exam question" title={previewedIds.includes(upload.id) ? "Approve" : "Preview before approving"}><BadgeCheck size={16} /></button>}
                      {role === "admin" && <span className={`self-center text-xs ${previewedIds.includes(upload.id) ? "text-green-600" : "text-slate-500"}`}>{previewedIds.includes(upload.id) ? "Previewed" : "Preview first"}</span>}
                      {role === "teacher" && upload.uploadedBy.id === currentUserId && (
                        <>
                          <button type="button" onClick={() => handleEdit(upload)} className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200" aria-label="Edit exam question" title="Edit"><Pencil size={15} /></button>
                          <button type="button" onClick={() => handleDelete(upload.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700" aria-label="Delete exam question" title="Delete"><Trash2 size={15} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )))}
          </table>
          </div>
          <div className="space-y-3 md:hidden">
            {pendingUploadGroups.flatMap((yearGroup) =>
              yearGroup.terms.flatMap((termGroup) =>
                termGroup.records.map((upload) => {
                  const isExpanded = expandedUploadIds[upload.id] ?? false;
                  return (
                    <article key={upload.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-start justify-between gap-3 p-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold text-slate-900" title={`${upload.lesson.subject.name} / ${upload.lesson.class.name}`}>
                            {upload.lesson.subject.name} / {upload.lesson.class.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {upload.uploadedBy.name} {upload.uploadedBy.surname}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleUploadDetails(upload.id)}
                          aria-expanded={isExpanded}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          {isExpanded ? "Hide details" : "View details"}
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-3">
                          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                            <div className="col-span-2">
                              <dt className="text-slate-500">Title</dt>
                              <dd className="mt-0.5 font-medium text-slate-800">{upload.title}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Academic period</dt>
                              <dd className="mt-0.5 font-medium text-slate-800">{upload.academicYearLabel} · Term {upload.termNumber}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Submitted</dt>
                              <dd className="mt-0.5 font-medium text-slate-800">{new Intl.DateTimeFormat("en-US").format(new Date(upload.createdAt))}</dd>
                            </div>
                            <div className="col-span-2 min-w-0">
                              <dt className="text-slate-500">Document</dt>
                              <dd className="mt-0.5 break-all">
                                <a className="font-medium text-sky-700 underline underline-offset-2" href={upload.fileUrl} target="_blank" rel="noreferrer">{upload.fileName}</a>
                              </dd>
                            </div>
                          </dl>
                          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                            <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100" onClick={() => handlePreview(upload)} aria-label="Preview exam question">
                              <Eye size={16} /> Preview
                            </button>
                            {role === "admin" && (
                              <>
                                <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => handleApprove(upload.id)} disabled={!previewedIds.includes(upload.id)} aria-label="Approve exam question">
                                  <BadgeCheck size={16} /> Approve
                                </button>
                                {!previewedIds.includes(upload.id) && <span className="text-xs text-slate-500">Preview first</span>}
                              </>
                            )}
                            {role === "teacher" && upload.uploadedBy.id === currentUserId && (
                              <>
                                <button type="button" onClick={() => handleEdit(upload)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-100 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-200" aria-label="Edit exam question"><Pencil size={15} /> Edit</button>
                                <button type="button" onClick={() => handleDelete(upload.id)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700" aria-label="Delete exam question"><Trash2 size={15} /> Delete</button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )
            )}
          </div>
        </div>
      )}

      {showApprovedSection && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold">Approved Exam Questions</h3>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-300 text-slate-600">
                <tr>
                  <th className="py-2">Title</th>
                  <th className="py-2">Lesson</th>
                  <th className="py-2">Uploaded by</th>
                  <th className="py-2">Approved by</th>
                  <th className="py-2">Submitted</th>
                  <th className="py-2">Document</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              {approvedUploadGroups.map((yearGroup) => yearGroup.terms.map((termGroup) => (
                <tbody key={`${yearGroup.academicYearLabel}-${termGroup.termNumber}`}>
                  <tr className="bg-slate-100">
                    <th colSpan={7} className="py-2 text-left font-semibold text-slate-800">
                      {yearGroup.academicYearLabel}<span className="ml-2 font-medium text-slate-600">· Term {termGroup.termNumber}</span>
                      <span className="ml-2 text-xs font-normal text-slate-500">{termGroup.records.length} upload{termGroup.records.length === 1 ? "" : "s"}</span>
                    </th>
                  </tr>
                  {termGroup.records.map((upload) => (
                    <tr key={upload.id} className="border-b border-slate-200">
                      <td className="py-3">{upload.title}</td>
                      <td className="py-3">{upload.lesson.subject.name} / {upload.lesson.class.name}</td>
                      <td className="py-3">{upload.uploadedBy.name} {upload.uploadedBy.surname}</td>
                      <td className="py-3">{upload.approvedByName || "Unknown administrator"}</td>
                      <td className="py-3">{upload.approvedAt ? new Intl.DateTimeFormat("en-US").format(new Date(upload.approvedAt)) : new Intl.DateTimeFormat("en-US").format(new Date(upload.createdAt))}</td>
                      <td className="py-3"><a className="text-blue-600 underline" href={upload.fileUrl} target="_blank" rel="noreferrer">{upload.fileName}</a></td>
                      <td className="py-3 flex flex-wrap gap-2">
                        <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => handlePreview(upload)} aria-label="Preview exam question" title="Preview"><Eye size={16} /></button>
                        {(role === "admin" || (role === "teacher" && upload.uploadedBy.id === currentUserId)) && <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700" onClick={() => handleDelete(upload.id)} aria-label="Delete exam question" title="Delete"><Trash2 size={15} /></button>}
                        {role === "teacher" && upload.uploadedBy.id === currentUserId && <button type="button" onClick={() => handleEdit(upload)} className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200" aria-label="Edit exam question" title="Edit"><Pencil size={15} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              )))}
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {approvedUploadGroups.flatMap((yearGroup) =>
              yearGroup.terms.flatMap((termGroup) =>
                termGroup.records.map((upload) => {
                  const isExpanded = expandedUploadIds[upload.id] ?? false;
                  const submittedDate = upload.approvedAt ?? upload.createdAt;
                  return (
                    <article key={upload.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-start justify-between gap-3 p-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold text-slate-900" title={`${upload.lesson.subject.name} / ${upload.lesson.class.name}`}>
                            {upload.lesson.subject.name} / {upload.lesson.class.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {upload.uploadedBy.name} {upload.uploadedBy.surname}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleUploadDetails(upload.id)}
                          aria-expanded={isExpanded}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          {isExpanded ? "Hide details" : "View details"}
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-3">
                          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                            <div className="col-span-2">
                              <dt className="text-slate-500">Title</dt>
                              <dd className="mt-0.5 font-medium text-slate-800">{upload.title}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Academic period</dt>
                              <dd className="mt-0.5 font-medium text-slate-800">{upload.academicYearLabel} · Term {upload.termNumber}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Approved</dt>
                              <dd className="mt-0.5 font-medium text-slate-800">{new Intl.DateTimeFormat("en-US").format(new Date(submittedDate))}</dd>
                            </div>
                            <div className="col-span-2">
                              <dt className="text-slate-500">Approved by</dt>
                              <dd className="mt-0.5 font-medium text-slate-800">{upload.approvedByName || "Unknown administrator"}</dd>
                            </div>
                            <div className="col-span-2 min-w-0">
                              <dt className="text-slate-500">Document</dt>
                              <dd className="mt-0.5 break-all">
                                <a className="font-medium text-sky-700 underline underline-offset-2" href={upload.fileUrl} target="_blank" rel="noreferrer">{upload.fileName}</a>
                              </dd>
                            </div>
                          </dl>
                          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                            <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100" onClick={() => handlePreview(upload)} aria-label="Preview exam question">
                              <Eye size={16} /> Preview
                            </button>
                            {(role === "admin" || (role === "teacher" && upload.uploadedBy.id === currentUserId)) && (
                              <button type="button" onClick={() => handleDelete(upload.id)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700" aria-label="Delete exam question"><Trash2 size={15} /> Delete</button>
                            )}
                            {role === "teacher" && upload.uploadedBy.id === currentUserId && (
                              <button type="button" onClick={() => handleEdit(upload)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-100 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-200" aria-label="Edit exam question"><Pencil size={15} /> Edit</button>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )
            )}
          </div>
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

export default ExamQuestionUploadsPanel;
