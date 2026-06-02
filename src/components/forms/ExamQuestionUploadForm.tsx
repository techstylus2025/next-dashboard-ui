"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { examQuestionUploadSchema, ExamQuestionUploadSchema } from "@/lib/formValidationSchemas";
import { uploadExamQuestion } from "@/lib/actions";
import InputField from "../InputField";

const ExamQuestionUploadForm = ({
  setOpen,
  relatedData,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    lessons: { id: number; name: string; subject: { name: string }; class: { name: string } }[];
  };
}) => {
  const lessons = relatedData?.lessons ?? [];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamQuestionUploadSchema>({
    resolver: zodResolver(examQuestionUploadSchema),
  });

  const onSubmit = handleSubmit((data) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setFileError("A document file is required.");
      return;
    }

    setFileError(null);
    setUploadError(null);

    startTransition(async () => {
      const result = await uploadExamQuestion({
        title: data.title,
        lessonId: data.lessonId,
        file,
      });

      if (result.success) {
        toast("Exam question document uploaded for admin review.");
        setOpen(false);
        router.refresh();
      } else {
        setUploadError(result.message || "Unable to upload the document. Check the selected lesson and file.");
      }
    });
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Upload exam question document</h1>

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
          <label className="input-label">Document</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            onChange={() => setFileError(null)}
          />
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
          {isPending ? "Uploading..." : "Upload for review"}
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
