"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import InputField from "../InputField";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  FormErrorBanner,
  FormFieldGrid,
  FormHeader,
  FormSection,
  FormSelect,
  PhotoUploadCard,
} from "./FormUi";

const formatDateValue = (value: string | Date | undefined) => {
  if (!value) return undefined;
  if (typeof value === "string") return value.split("T")[0];
  return value.toISOString().split("T")[0];
};

const TeacherForm = ({
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
    reset,
    watch,
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema) as any,
    defaultValues: {
      ...data,
      email: data?.email ?? "",
      phone: data?.phone ?? "",
      img: data?.img ?? undefined,
      password: data?.password ?? "",
      birthday: formatDateValue(data?.birthday),
      subjects: data?.subjects?.map((subject: { id: number } | number) =>
        String(typeof subject === "number" ? subject : subject.id)
      ) ?? [],
      classIds: data?.assignedClasses?.map((cls: { id: number }) => cls.id) ?? [],
    },
  });

  const [img, setImg] = useState<any>(data?.img);

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        email: data.email ?? "",
        phone: data.phone ?? "",
        img: data.img ?? undefined,
        password: data.password ?? "",
        birthday: formatDateValue(data.birthday),
        subjects: data.subjects?.map((subject: { id: number } | number) =>
          String(typeof subject === "number" ? subject : subject.id)
        ) ?? [],
        classIds: data.assignedClasses?.map((cls: { id: number }) => cls.id) ?? [],
      });
      setImg(data.img);
    }
  }, [data, reset]);

  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = handleSubmit(
    async (formData) => {
      setIsPending(true);
      setSubmitError(null);

      try {
        const action = type === "create" ? createTeacher : updateTeacher;
        const result = await action(
          { success: false, error: false },
          {
            ...formData,
            email: formData.email ?? "",
            phone: formData.phone ?? "",
            img: img?.secure_url ?? data?.img ?? undefined,
            password: formData.password ?? "",
          } as TeacherSchema
        );

        if (result.success) {
          toast(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
          setOpen(false);
          router.refresh();
        } else {
          setSubmitError(result.message ?? "Unable to save the teacher. Please try again.");
        }
      } catch (error) {
        console.error("Failed to save teacher:", error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Unable to save the teacher. Please try again."
        );
      } finally {
        setIsPending(false);
      }
    },
    (validationErrors) => {
      const firstError = Object.values(validationErrors).find((error) => error?.message);
      setSubmitError(
        firstError?.message?.toString() ??
          "Please correct the highlighted fields and try again."
      );
    }
  );

  const { subjects = [], classes = [] } = relatedData ?? {};
  const selectedSubjects = watch("subjects") ?? [];
  const selectedClassIds = watch("classIds") ?? [];
  const selectedClassIdSet = new Set(selectedClassIds.map(Number));
  const availableSubjects = subjects.filter((subject: {
    id: number;
    classes: { id: number }[];
  }) =>
    subject.classes.some((cls) => selectedClassIdSet.has(cls.id)) ||
    selectedSubjects.includes(String(subject.id))
  );

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} aria-busy={isPending}>
      <FormHeader
        title={type === "create" ? "Register a new teacher" : "Update teacher profile"}
        description="Set up account access, personal details, and subject assignments in one place."
        badge={type === "create" ? "New staff" : "Edit profile"}
      />

      <FormSection
        title="Account access"
        description="Login credentials used to sign in to the school portal."
      >
        <FormFieldGrid cols={2}>
          <InputField
            label="Username"
            name="username"
            defaultValue={data?.username}
            register={register}
            error={errors?.username}
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            defaultValue={data?.email}
            register={register}
            error={errors?.email}
          />
          <InputField
            label={
              type === "create"
                ? "Password"
                : "Password (leave blank to keep current)"
            }
            name="password"
            type="password"
            defaultValue={data?.password}
            register={register}
            error={errors?.password}
          />
        </FormFieldGrid>
      </FormSection>

      <FormSection
        title="Personal information"
        description="Basic profile details for records and identification."
      >
        <div className="mb-5">
          <PhotoUploadCard
            imageUrl={img?.secure_url ?? data?.img}
            onUpload={setImg}
            label="Staff photo"
          />
        </div>

        <FormFieldGrid cols={2}>
          <InputField
            label="First name"
            name="name"
            defaultValue={data?.name}
            register={register}
            error={errors.name}
          />
          <InputField
            label="Last name"
            name="surname"
            defaultValue={data?.surname}
            register={register}
            error={errors.surname}
          />
          <InputField
            label="Phone"
            name="phone"
            defaultValue={data?.phone}
            register={register}
            error={errors.phone}
          />
          <InputField
            label="Address"
            name="address"
            defaultValue={data?.address}
            register={register}
            error={errors.address}
          />
          <InputField
            label="Blood type"
            name="bloodType"
            defaultValue={data?.bloodType}
            register={register}
            error={errors.bloodType}
          />
          <InputField
            label="Date of birth"
            name="birthday"
            defaultValue={formatDateValue(data?.birthday)}
            register={register}
            error={errors.birthday}
            type="date"
          />
          <FormSelect
            label="Gender"
            name="sex"
            register={register}
            error={errors.sex}
            defaultValue={data?.sex}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
          />
          {data ? (
            <InputField
              label="Id"
              name="id"
              defaultValue={data?.id}
              register={register}
              error={errors?.id}
              hidden
            />
          ) : null}
        </FormFieldGrid>
      </FormSection>

      <FormSection
        title="Teaching assignment"
        description="Assign one or more classes and subjects. Subject options are limited to subjects offered in the selected classes."
      >
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">
            Classes
          </legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem: { id: number; name: string }) => (
              <label
                key={classItem.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  value={classItem.id}
                  {...register("classIds")}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                {classItem.name}
              </label>
            ))}
          </div>
          {errors.classIds?.message && (
            <p className="mt-2 text-xs text-red-500">
              {errors.classIds.message}
            </p>
          )}
        </fieldset>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-slate-700">
            Subjects
          </legend>
          {selectedClassIds.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
              Select at least one class to see its available subjects.
            </p>
          ) : availableSubjects.length === 0 ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              The selected classes do not have any subjects assigned yet.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableSubjects.map((subject: {
                id: number;
                name: string;
                grade: { level: string; label: string | null };
              }) => {
                const sameNameLevels = new Set(
                  availableSubjects
                    .filter((item: { name: string }) =>
                      item.name.trim().toLowerCase() === subject.name.trim().toLowerCase()
                    )
                    .map((item: { grade: { level: string } }) => item.grade.level)
                );
                const levelInitials: Record<string, string> = {
                  CRECHE: "C",
                  NURSERY: "N",
                  KINDERGARTEN: "K",
                  PRIMARY: "P",
                  JHS: "JHS",
                };
                const label =
                  sameNameLevels.size > 1
                    ? `${subject.name} (${levelInitials[subject.grade.level] ?? subject.grade.level})`
                    : subject.name;
                return (
                  <label
                    key={subject.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      value={subject.id}
                      {...register("subjects")}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          )}
          {errors.subjects?.message && (
            <p className="mt-2 text-xs text-red-500">
              {errors.subjects.message}
            </p>
          )}
          {type === "update" && availableSubjects.length === 0 && selectedSubjects.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Previously assigned subjects are no longer offered in the selected classes.
            </p>
          )}
        </fieldset>
      </FormSection>

      {submitError ? (
        <FormErrorBanner message={submitError} />
      ) : null}

      <div className="border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-700 sm:w-auto"
        >
          {isPending
            ? type === "create" ? "Creating teacher..." : "Saving changes..."
            : type === "create" ? "Create teacher" : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default TeacherForm;
