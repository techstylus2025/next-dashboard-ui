"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState, startTransition } from "react";
import { toast } from "react-toastify";
import ExamQuestionUploadForm from "@/components/forms/ExamQuestionUploadForm";
import ExamQuestionPreviewModal from "@/components/exams/ExamQuestionPreviewModal";
import { approveExamQuestion, deleteExamQuestionUpload } from "@/lib/actions";

type LessonOption = {
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
  lesson: {
    subject: { name: string };
    class: { name: string };
  };
  uploadedBy: {
    name: string;
    surname: string;
  };
  approvedBy?: string | null;
  createdAt: string;
  approvedAt?: string | null;
};

type Props = {
  role?: string | null;
  lessons?: LessonOption[];
  pendingUploads?: UploadRecord[];
  approvedUploads?: UploadRecord[];
  activeTermBadge?: string | null;
};

const ExamQuestionUploadsPanel = ({
  role,
  lessons = [],
  pendingUploads = [],
  approvedUploads = [],
  activeTermBadge,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewedIds, setPreviewedIds] = useState<number[]>([]);
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

  const showTeacherUpload =
    role === "teacher" && lessons.length > 0 && Boolean(activeTermBadge);
  const showPendingSection =
    (role === "admin" || role === "teacher") && pendingUploads.length > 0;
  const showApprovedSection = approvedUploads.length > 0;

  return (
    <section className="bg-slate-50 p-4 rounded-md mt-6">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Exam Question Review</h2>
          <p className="text-sm text-slate-600">
            {activeTermBadge
              ? `Current term: ${activeTermBadge}`
              : "No active term is set. Upload and approval are restricted to the current term."}
          </p>
        </div>
        {showTeacherUpload && (
          <button
            className="bg-lamaYellow px-4 py-2 rounded-md text-sm font-medium"
            onClick={() => setOpen(true)}
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
              onClick={() => setOpen(false)}
            >
              ✕
            </div>
            <ExamQuestionUploadForm setOpen={setOpen} relatedData={{ lessons }} />
          </div>
        </div>
      )}

      {role === "student" || role === "parent" ? (
        <div className="text-sm text-slate-600">
          Exam question uploads are available only to subject teachers and class supervisors.
        </div>
      ) : null}

      {showPendingSection && (
        <div className="overflow-x-auto mt-4">
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
            <tbody>
              {pendingUploads.map((upload) => (
                <tr key={upload.id} className="border-b border-slate-200">
                  <td className="py-3">{upload.title}</td>
                  <td className="py-3">
                    {upload.lesson.subject.name} / {upload.lesson.class.name}
                  </td>
                  <td className="py-3">
                    {upload.uploadedBy.name} {upload.uploadedBy.surname}
                  </td>
                  <td className="py-3">
                    {new Intl.DateTimeFormat("en-US").format(new Date(upload.createdAt))}
                  </td>
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
                      className="bg-slate-200 text-slate-700 px-3 py-1 rounded-md text-sm"
                      onClick={() => handlePreview(upload)}
                    >
                      Preview
                    </button>
                    {role === "admin" && (
                      <button
                        type="button"
                        className="btn-primary text-sm py-1"
                        onClick={() => handleApprove(upload.id)}
                        disabled={!previewedIds.includes(upload.id)}
                      >
                        Approve
                      </button>
                    )}
                    {role === "admin" && previewedIds.includes(upload.id) && (
                      <span className="text-xs text-green-600 self-center">
                        Previewed
                      </span>
                    )}
                    {role === "admin" && !previewedIds.includes(upload.id) && (
                      <span className="text-xs text-slate-500 self-center">
                        Preview first
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showApprovedSection && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold">Approved Exam Questions</h3>
            <span className="text-xs text-slate-500">
              Approved questions are stored for future reference.
            </span>
          </div>
          <div className="overflow-x-auto">
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
              <tbody>
                {approvedUploads.map((upload) => (
                  <tr key={upload.id} className="border-b border-slate-200">
                    <td className="py-3">{upload.title}</td>
                    <td className="py-3">
                      {upload.lesson.subject.name} / {upload.lesson.class.name}
                    </td>
                    <td className="py-3">
                      {upload.uploadedBy.name} {upload.uploadedBy.surname}
                    </td>
                    <td className="py-3">
                      {upload.approvedBy ? upload.approvedBy : "Unknown"}
                    </td>
                    <td className="py-3">
                      {upload.approvedAt
                        ? new Intl.DateTimeFormat("en-US").format(new Date(upload.approvedAt))
                        : new Intl.DateTimeFormat("en-US").format(new Date(upload.createdAt))}
                    </td>
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
                        className="bg-slate-200 text-slate-700 px-3 py-1 rounded-md text-sm"
                        onClick={() => handlePreview(upload)}
                      >
                        Preview
                      </button>
                      {role === "admin" && (
                        <button
                          type="button"
                          className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                          onClick={() => handleDelete(upload.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
