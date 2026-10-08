"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { CldUploadWidget, type CloudinaryUploadWidgetInfo, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import { examQuestionUploadSchema, ExamQuestionUploadSchema } from "@/lib/formValidationSchemas";
import { updateExamQuestionUpload, uploadExamQuestion } from "@/lib/actions";
import InputField from "../InputField";
import type { ExamQuestionEditItem } from "@/components/exams/ExamQuestionUploadsPanel";

const ExamQuestionUploadForm = ({
  setOpen,
  relatedData,
  editingUpload,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    lessons: { id: number; name: string; subject: { name: string }; class: { name: string } }[];
  };
  editingUpload?: ExamQuestionEditItem | null;
}) => {
  const lessons = relatedData?.lessons ?? [];
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [file, setFile] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamQuestionUploadSchema>({
    resolver: zodResolver(examQuestionUploadSchema) as any,
    defaultValues: editingUpload
      ? { title: editingUpload.title, lessonId: editingUpload.lessonId }
      : undefined,
  });

  const onSubmit = handleSubmit((data) => {
    if (!editingUpload && !file) {
      setFileError("A document file is required.");
      return;
    }

    setFileError(null);
    setUploadError(null);

    startTransition(async () => {
      try {
        const result = editingUpload
          ? await updateExamQuestionUpload({
              id: editingUpload.id,
              title: data.title,
              lessonId: data.lessonId,
              file: file ?? undefined,
            })
          : await uploadExamQuestion({
              title: data.title,
              lessonId: data.lessonId,
              fileName: file!.fileName,
              fileUrl: file!.fileUrl,
            });

        if (result.success) {
          toast(editingUpload ? "Exam question upload updated." : "Exam question document uploaded for admin review.");
          setOpen(false);
          router.refresh();
        } else {
          setUploadError(result.message || "Unable to save the document. Check the selected lesson and file.");
        }
      } catch (error) {
        console.error("Exam question upload submission failed:", error);
        setUploadError("Unable to save the upload. Please try again.");
      }
    });
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{editingUpload ? "Edit exam question document" : "Upload exam question document"}</h1>

      <div className="flex flex-col gap-4">
        <InputField
          label="Upload title"
          name="title"
          register={register}
          error={errors?.title}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="input-label">Lesson</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId")}
          >
            <option value="">Select lesson</option>
            {lessons.map((lesson) => (
              <option value={lesson.id} key={lesson.id}>
                {`${lesson.name} — ${lesson.subject.name} / ${lesson.class.name}`}
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-400">{errors.lessonId.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="input-label">{editingUpload ? "Replace document (optional)" : "Document"}</label>
          <CldUploadWidget
            uploadPreset="school"
            options={{
              resourceType: "raw",
              clientAllowedFormats: ["pdf", "doc", "docx"],
              maxRawFileSize: 20_000_000,
              maxFiles: 1,
              multiple: false,
              sources: ["local"],
              folder: "exam-questions",
            }}
            onSuccess={(result: CloudinaryUploadWidgetResults, { widget }) => {
              if (typeof result.info === "string" || !result.info?.secure_url) {
                setFileError("Cloud storage did not return a usable document URL.");
                return;
              }

              const info = result.info as CloudinaryUploadWidgetInfo;
              const sourceName = info.original_filename || info.display_name || "exam-question";
              const urlFileName = info.secure_url
                ? decodeURIComponent(new URL(info.secure_url).pathname.split("/").pop() || "")
                : "";
              const extension = [
                info.format,
                sourceName.match(/\.([a-z0-9]+)$/i)?.[1],
                urlFileName.match(/\.([a-z0-9]+)$/i)?.[1],
              ].find((value) => value && /^(pdf|doc|docx)$/i.test(value));

              if (!extension) {
                setFileError("Cloud storage did not identify this as a PDF, DOC, or DOCX document.");
                return;
              }

              const fileName = /\.[a-z0-9]+$/i.test(sourceName)
                ? sourceName
                : `${sourceName}.${extension}`;
              setFile({ fileName, fileUrl: info.secure_url });
              setFileError(null);
              widget.close();
            }}
            onError={(error) => {
              const message = typeof error === "string" ? error : error?.statusText;
              setFileError(
                message
                  ? `Document upload failed: ${message}`
                  : "Document upload failed. Check the Cloudinary upload preset and try again."
              );
            }}
          >
            {({ open }) => (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFileError(null);
                    open();
                  }}
                  disabled={isPending}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {file ? "Choose a different document" : "Choose document"}
                </button>
                {file ? (
                  <span className="break-all text-sm text-slate-600">Selected: {file.fileName}</span>
                ) : editingUpload ? (
                  <span className="text-sm text-slate-500">Current document: {editingUpload.fileName}</span>
                ) : null}
                <span className="basis-full text-xs text-slate-500">PDF, DOC, or DOCX · maximum 20 MB</span>
              </div>
            )}
          </CldUploadWidget>
          {fileError && <p className="text-xs text-red-400">{fileError}</p>}
        </div>
      </div>

      {uploadError && (
        <span className="text-red-500 text-sm">{uploadError}</span>
      )}

      <div className="flex items-center gap-3">
        <button 
          className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-50" 
          type="submit"
          disabled={isPending}
        >
          {isPending ? (editingUpload ? "Saving..." : "Uploading...") : (editingUpload ? "Save changes" : "Upload for review")}
        </button>
        <button
          type="button"
          className="text-sm text-slate-600 underline"
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ExamQuestionUploadForm;
