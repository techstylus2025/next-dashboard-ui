"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dispatch,
  SetStateAction,
  startTransition,
  useActionState,
  useEffect,
  useState,
  useMemo,
} from "react";
import InputField from "../InputField";
import {
  classSchema,
  ClassSchema,
  subjectSchema,
  SubjectSchema,
} from "@/lib/formValidationSchemas";
import {
  createClass,
  createSubject,
  updateClass,
  updateSubject,
} from "@/lib/actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { GRADING_LEVEL_LABELS } from "@/lib/gradingUtils";

const ClassForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema) as any,
  });

  const [state, formAction] = useActionState(
    type === "create" ? createClass : updateClass,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    startTransition(() => {
      formAction(data);
    });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Class has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { teachers = [], grades = [] } = relatedData ?? {};
  const selectedGradeId = watch("gradeId");
  const [gradeSubjects, setGradeSubjects] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    if (!selectedGradeId || Number(selectedGradeId) <= 0) {
      setGradeSubjects([]);
      return;
    }

    const loadGradeSubjects = async () => {
      try {
        const response = await fetch(`/api/form-related-data?table=subject&gradeId=${selectedGradeId}`);
        if (!response.ok) throw new Error("Failed to load grade subjects");
        const payload = await response.json();
        setGradeSubjects(payload.subjects ?? []);
      } catch (error) {
        console.error("Unable to load grade subjects", error);
        setGradeSubjects([]);
      }
    };

    loadGradeSubjects();
  }, [selectedGradeId]);

  const gradeLabel = useMemo(() => {
    const match = grades.find((grade: { id: number; level: string; label?: string | null }) => Number(grade.id) === Number(selectedGradeId));
    return match ? (match.label || GRADING_LEVEL_LABELS[match.level as keyof typeof GRADING_LEVEL_LABELS] || match.level) : "";
  }, [grades, selectedGradeId]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new class" : "Update the class"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Class name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Capacity"
          name="capacity"
          defaultValue={data?.capacity}
          register={register}
          error={errors?.capacity}
        />
        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="input-label">Supervisor</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("supervisorId")}
            defaultValue={data?.supervisorId ?? ""}
          >
            {(teachers as Array<{ id: string; name: string; surname: string }>).map(
              (teacher: { id: string; name: string; surname: string }) => (
                <option
                  value={teacher.id}
                  key={teacher.id}
                  selected={data && teacher.id === data.supervisorId}
                >
                  {teacher.name + " " + teacher.surname}
                </option>
              )
            )}
          </select>
          {errors.supervisorId?.message && (
            <p className="text-xs text-red-400">
              {errors.supervisorId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="input-label">Grading Level</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("gradeId", { valueAsNumber: true })}
            defaultValue={data?.gradeId ?? ""}
            onChange={(e) => setValue("gradeId", Number(e.target.value))}
          >
            <option value="" disabled>
              Select grading level
            </option>
            {(grades as Array<{ id: number; level: string; label?: string | null }>).map((grade) => (
              <option value={grade.id} key={grade.id}>
                {grade.label || GRADING_LEVEL_LABELS[grade.level as keyof typeof GRADING_LEVEL_LABELS] || grade.level}
              </option>
            ))}
          </select>
          {errors.gradeId?.message && (
            <p className="text-xs text-red-400">
              {errors.gradeId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="input-label">Assigned Subjects</label>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 min-h-[46px]">
            {selectedGradeId ? (
              gradeSubjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {gradeSubjects.map((subject) => (
                    <span key={subject.id} className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {subject.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500">No subjects have been assigned to {gradeLabel || "this grading level"} yet.</span>
              )
            ) : (
              <span className="text-slate-500">Select a grading level to auto-load its subjects.</span>
            )}
          </div>
        </div>
      </div>
      {state.error && (
        <span className="text-red-500">{state.message ?? "Something went wrong!"}</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ClassForm;
