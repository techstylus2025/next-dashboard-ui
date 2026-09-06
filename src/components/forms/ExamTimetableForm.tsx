"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { startTransition, useActionState } from "react";
import {
  examTimetableSchema,
  ExamTimetableSchema,
} from "@/lib/formValidationSchemas";
import { createExamTimetable } from "@/lib/actions";
import InputField from "../InputField";
import type { GradingLevel } from "@prisma/client";

const ExamTimetableForm = ({
  setOpen,
  relatedData,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: {
    classes: { id: number; name: string; gradingLevel: GradingLevel }[];
    lessons: {
      id: number;
      name: string;
      classId: number;
      subject: { name: string };
    }[];
  };
}) => {
  const classes = relatedData?.classes ?? [];
  const lessons = relatedData?.lessons ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExamTimetableSchema>({
    resolver: zodResolver(examTimetableSchema) as any,
    defaultValues: {
      gradingLevel: "PRIMARY" as GradingLevel,
    } as any,
  });

  const gradeSelection = watch("gradingLevel") as GradingLevel;
  const selectedClassIds = watch("classIds") as Array<number | string>;

  const filteredClasses = useMemo(
    () => classes.filter((c) => c.gradingLevel === gradeSelection),
    [classes, gradeSelection]
  );

  const filteredLessons = useMemo(() => {
    const idsArray = Array.isArray(selectedClassIds)
      ? selectedClassIds
      : selectedClassIds
      ? [selectedClassIds]
      : [];
    const selectedIds = idsArray.map(Number);
    return lessons.filter((lesson) => selectedIds.includes(lesson.classId));
  }, [lessons, selectedClassIds]);

  useEffect(() => {
    const idsArray = Array.isArray(selectedClassIds)
      ? selectedClassIds
      : selectedClassIds
      ? [selectedClassIds]
      : [];
    const selectedIds = idsArray.map(Number);
    if (
      selectedIds.length > 0 &&
      !filteredLessons.some((lesson) => selectedIds.includes(lesson.classId))
    ) {
      setValue("lessonId", undefined as any);
    }
  }, [filteredLessons, selectedClassIds, setValue]);

  const [state, formAction] = useActionState(createExamTimetable, {
    success: false,
    error: false,
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast("Exam timetable entry created for the selected class.");
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error("Unable to create the timetable entry. Verify current term dates.");
    }
  }, [state, router, setOpen]);

  const onSubmit = handleSubmit((data) => {
    startTransition(() => {
      formAction(data as any);
    });
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Admin exam timetable</h1>
      <p className="text-sm text-slate-600">
        Choose a grading level and one or more classes, then schedule the exam within the active term.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="input-label">Grading level</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("gradingLevel")}
          >
            <option value="CRECHE">Creche</option>
            <option value="KINDERGARTEN">Kindergarten</option>
            <option value="PRIMARY">Primary</option>
            <option value="JHS">JHS</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="input-label">Classes</label>
          <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm max-h-52 overflow-y-auto">
            {filteredClasses.length > 0 ? (
              filteredClasses.map((cls) => (
                <label
                  key={cls.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    value={cls.id}
                    {...register("classIds")}
                    className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-700">{cls.name}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-slate-500">No classes found for this grading level.</p>
            )}
          </div>
          {errors.classIds?.message && (
            <p className="text-xs text-red-400">{errors.classIds.message.toString()}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="input-label">Lesson</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId")}
            disabled={filteredLessons.length === 0}
          >
            <option value="">Select a lesson</option>
            {filteredLessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name} — {lesson.subject.name}
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-400">{errors.lessonId.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Exam title"
          name="title"
          register={register}
          error={errors.title}
          containerClassName="w-full"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <InputField
          label="Date"
          name="date"
          type="date"
          register={register}
          error={errors.date}
          containerClassName="w-full"
        />
        <InputField
          label="Start time"
          name="startTime"
          type="time"
          register={register}
          error={errors.startTime}
          containerClassName="w-full"
        />
        <InputField
          label="End time"
          name="endTime"
          type="time"
          register={register}
          error={errors.endTime}
          containerClassName="w-full"
        />
      </div>

      {state.error && (
        <span className="text-red-500">Unable to create exam timetable. Confirm the active term window.</span>
      )}

      <div className="flex items-center gap-3">
        <button className="bg-blue-400 text-white py-2 px-4 rounded-md">
          Create timetable entry
        </button>
        <button
          type="button"
          className="border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors duration-150 py-2 px-4 rounded-md"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ExamTimetableForm;
