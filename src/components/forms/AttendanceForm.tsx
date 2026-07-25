"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { attendanceSchema, AttendanceSchema } from "@/lib/formValidationSchemas";
import { createAttendance, updateAttendance } from "@/lib/actions";
import {
  Dispatch,
  SetStateAction,
  startTransition,
  useActionState,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const AttendanceForm = ({
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
  const { students = [], teachers = [] } = relatedData || {};
  const defaultType = data?.teacherId ? "teacher" : "student";
  const defaultDate = data?.date
    ? new Date(data.date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema) as any,
    defaultValues: {
      type: defaultType,
      date: defaultDate,
      present: data?.present ? "true" : "false",
      studentId: data?.studentId ?? "",
      teacherId: data?.teacherId ?? "",
      id: data?.id,
    } as any,
  });

  const recordType = watch("type") as "student" | "teacher";

  const [state, formAction] = useActionState(
    type === "create" ? createAttendance : updateAttendance,
    {
      success: false,
      error: false,
    }
  );

  const router = useRouter();

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction(formData as any);
    });
  });

  useEffect(() => {
    if (state.success) {
      toast(`Attendance has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, setOpen, type]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Record attendance" : "Update attendance"}
      </h1>

      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700">
          <input
            type="radio"
            value="student"
            {...register("type")}
            defaultChecked={defaultType === "student"}
            className="accent-sky-500"
          />
          Student
        </label>
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700">
          <input
            type="radio"
            value="teacher"
            {...register("type")}
            defaultChecked={defaultType === "teacher"}
            className="accent-sky-500"
          />
          Teacher
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        <InputField
          label="Date"
          name="date"
          type="date"
          defaultValue={defaultDate}
          register={register}
          error={errors?.date as any}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="input-label">Attendance</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("present")}
            defaultValue={data?.present ? "true" : "false"}
          >
            <option value="true">Present</option>
            <option value="false">Absent</option>
          </select>
          {errors.present?.message && (
            <p className="text-xs text-red-400">{errors.present.message.toString()}</p>
          )}
        </div>
      </div>

      {recordType === "student" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="input-label">Student</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("studentId")}
              defaultValue={data?.studentId ?? ""}
            >
              <option value="">Select a student</option>
              {students.map((student: any) => (
                <option value={student.id} key={student.id}>
                  {student.name} {student.surname}
                  {student.class?.name ? ` — ${student.class.name}` : ""}
                </option>
              ))}
            </select>
            {errors.studentId?.message && (
              <p className="text-xs text-red-400">{errors.studentId.message.toString()}</p>
            )}
          </div>
        </div>
      )}

      {recordType === "teacher" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="input-label">Teacher</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("teacherId")}
              defaultValue={data?.teacherId ?? ""}
            >
              <option value="">Select a teacher</option>
              {teachers.map((teacher: any) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacher.name} {teacher.surname}
                </option>
              ))}
            </select>
            {errors.teacherId?.message && (
              <p className="text-xs text-red-400">{errors.teacherId.message.toString()}</p>
            )}
          </div>
        </div>
      )}

      {data && (
        <InputField
          label="Id"
          name="id"
          defaultValue={data?.id}
          register={register}
          error={errors?.id as any}
          hidden
        />
      )}

      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create attendance" : "Update attendance"}
      </button>
    </form>
  );
};

export default AttendanceForm;
