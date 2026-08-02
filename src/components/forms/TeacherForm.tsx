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
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema) as any,
    defaultValues: data
      ? {
          ...data,
          birthday: formatDateValue(data.birthday),
        }
      : undefined,
  });

  const [img, setImg] = useState<any>(data?.img);

  useEffect(() => {
    if (data) {
      reset({
        ...data,
        birthday: formatDateValue(data.birthday),
      });
      setImg(data.img);
    }
  }, [data, reset]);

  const [state, formAction] = useActionState(
    type === "create" ? createTeacher : updateTeacher,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction({ ...(formData as any), img: img?.secure_url ?? data?.img } as any);
    });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { subjects } = relatedData;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
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
        description="Select the subjects this teacher is qualified to teach."
      >
        <FormSelect
          label="Subjects"
          name="subjects"
          register={register}
          error={errors.subjects as any}
          defaultValue={data?.subjects as any}
          multiple
          options={subjects.map((subject: { id: number; name: string }) => ({
            value: subject.id,
            label: subject.name,
          }))}
        />
        <p className="mt-2 text-xs text-slate-500">
          Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects.
        </p>
      </FormSection>

      {state.error ? (
        <FormErrorBanner message={state.message ?? "Something went wrong. Please check the form and try again."} />
      ) : null}

      <div className="border-t border-slate-100 pt-4">
        <button
          type="submit"
          className="w-full rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-700 sm:w-auto"
        >
          {type === "create" ? "Create teacher" : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default TeacherForm;
