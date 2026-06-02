"use client";

import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { uploadLessonDocument, updateLessonDocument } from "@/lib/actions";

type LessonOption = {
  id: number;
  name: string;
  subject: { name: string };
  class: { name: string };
};

export type LessonUploadEditItem = {
  id: number;
  title: string;
  weekNumber: number;
  lessonId: number;
  fileName: string;
  fileUrl: string;
};

type Props = {
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData: {
    lessons: LessonOption[];
    activeAcademicYear: string | null;
    activeTermBadge: string | null;
  };
  editingUpload?: LessonUploadEditItem | null;
  onCompleted?: () => void;
};

type UploadRow = {
  rowId: string;
  lessonId: number;
  title: string;
  weekNumber: string;
  file?: File | null;
};

const LessonUploadForm = ({
  setOpen,
  relatedData,
  editingUpload,
  onCompleted,
}: Props) => {
  const lessons = relatedData.lessons;
  const router = useRouter();
  const [rows, setRows] = useState<UploadRow[]>(() =>
    editingUpload
      ? [
          {
            rowId: `edit-${editingUpload.id}`,
            lessonId: editingUpload.lessonId,
            title: editingUpload.title,
            weekNumber: String(editingUpload.weekNumber),
            file: undefined,
          },
        ]
      : [
          {
            rowId: `row-${Date.now()}`,
            lessonId: 0,
            title: "",
            weekNumber: "",
            file: undefined,
          },
        ]
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (editingUpload) {
      setRows([
        {
          rowId: `edit-${editingUpload.id}`,
          lessonId: editingUpload.lessonId,
          title: editingUpload.title,
          weekNumber: String(editingUpload.weekNumber),
          file: undefined,
        },
      ]);
    }
  }, [editingUpload]);

  const updateRow = (rowId: string, patch: Partial<UploadRow>) => {
    setRows((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row))
    );
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      {
        rowId: `row-${Date.now()}`,
        lessonId: 0,
        title: "",
        weekNumber: "",
        file: undefined,
      },
    ]);
  };

  const removeRow = (rowId: string) => {
    setRows((current) => current.filter((row) => row.rowId !== rowId));
  };

  const getRowError = (row: UploadRow) => {
    if (!row.lessonId || row.lessonId === 0) {
      return "Choose a lesson to upload.";
    }
    if (!row.title.trim()) {
      return "A lesson title is required.";
    }
    const week = Number(row.weekNumber);
    if (!week || week <= 0) {
      return "Enter a valid week number.";
    }
    if (!editingUpload && !row.file) {
      return "A document file is required.";
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validated = rows.map((row) => ({
      row,
      error: getRowError(row),
    }));

    const invalid = validated.find((item) => item.error !== null);
    if (invalid) {
      setFormError(invalid.error);
      return;
    }

    startTransition(() => {
      (async () => {
        try {
          if (editingUpload) {
            const row = rows[0];
            const result = await updateLessonDocument({
              id: editingUpload.id,
              title: row.title.trim(),
              weekNumber: Number(row.weekNumber),
              file: row.file,
            });

            if (!result.success) {
              setFormError(result.message || "Unable to update the lesson upload.");
              return;
            }

            toast("Lesson upload updated.");
          } else {
            for (const row of rows) {
              const result = await uploadLessonDocument({
                title: row.title.trim(),
                lessonId: row.lessonId,
                weekNumber: Number(row.weekNumber),
                file: row.file!,
              });

              if (!result.success) {
                setFormError(result.message || "Unable to upload the lesson document.");
                return;
              }
            }
            toast("Lesson documents uploaded for review.");
          }

          setOpen(false);
          onCompleted?.();
          router.refresh();
        } catch (error) {
          setFormError("Unable to complete the upload. Please try again.");
        }
      })();
    });
  };

  const title = editingUpload ? "Edit uploaded lesson document" : "Upload lesson document";
  const buttonLabel = editingUpload ? "Save changes" : "Submit uploads";

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-slate-600">
            Academic year and term are inserted automatically using the active period.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Academic year</p>
            <p className="mt-1 font-medium">
              {relatedData.activeAcademicYear ?? "No active year set"}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Current term</p>
            <p className="mt-1 font-medium">
              {relatedData.activeTermBadge ?? "No active term set"}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">Upload type</p>
            <p className="mt-1 font-medium">Lesson document</p>
          </div>
        </div>
      </div>

      {rows.map((row, index) => (
        <div key={row.rowId} className="rounded-md border border-slate-200 p-4 bg-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 flex-1">
              <div className="flex flex-col gap-2">
                <label className="input-label">Subject</label>
                <select
                  value={row.lessonId}
                  onChange={(event) => {
                    const lessonId = Number(event.target.value);
                    const selected = lessons.find((l) => l.id === lessonId);
                    updateRow(row.rowId, {
                      lessonId,
                      title: selected ? selected.class.name : "",
                    });
                  }}
                  className="ring-[1.5px] ring-gray-300 rounded-md p-2 text-sm"
                >
                  <option value={0}>Select a subject</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="input-label">Class</label>
                <input
                  value={
                    lessons.find((l) => l.id === row.lessonId)
                      ? lessons.find((l) => l.id === row.lessonId)!.class.name
                      : ""
                  }
                  readOnly
                  className="ring-[1.5px] ring-gray-300 rounded-md p-2 text-sm bg-gray-50"
                  placeholder="Class will appear after selecting a subject"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="input-label">Week number</label>
                <input
                  type="number"
                  min={1}
                  value={row.weekNumber}
                  onChange={(event) =>
                    updateRow(row.rowId, { weekNumber: event.target.value })
                  }
                  className="ring-[1.5px] ring-gray-300 rounded-md p-2 text-sm"
                  placeholder="1"
                />
              </div>
            </div>

            {!editingUpload && rows.length > 1 && (
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-800"
                onClick={() => removeRow(row.rowId)}
              >
                Remove
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <label className="input-label">Document</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) =>
                  updateRow(row.rowId, {
                    file: event.target.files?.[0] ?? null,
                  })
                }
                className="ring-[1.5px] ring-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            {row.file?.name && (
              <div className="text-sm text-slate-600">
                Selected file: <span className="font-medium">{row.file.name}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {!editingUpload && (
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-white border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-lamaYellow/10 hover:border-lamaYellow"
          onClick={addRow}
        >
          + Add another lesson document
        </button>
      )}

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Saving..." : buttonLabel}
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default LessonUploadForm;
