"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dispatch,
  SetStateAction,
  startTransition,
  useActionState,
  useEffect,
} from "react";
import InputField from "../InputField";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { createParent, updateParent } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const ParentForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: ParentSchema & { students?: { name: string; surname: string }[] };
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema) as never,
    defaultValues: data
      ? {
          id: data.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email ?? "",
          occupation: data.occupation ?? "",
          phone: data.phone,
          address: data.address,
          password: "",
        }
      : undefined,
  });

  const [state, formAction] = useActionState(
    type === "create" ? createParent : updateParent,
    { success: false, error: false }
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Parent has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.message || "Something went wrong. Check required fields and duplicates.");
    }
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((formData) => {
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <form className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-1" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new parent" : "Update parent"}
      </h1>

      <span className="input-label font-medium mt-2 inline-block">Account</span>
      <div className="flex flex-wrap gap-4">
        <InputField
          label="Username"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email (optional)"
          name="email"
          defaultValue={data?.email ?? ""}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Occupation (optional)"
          name="occupation"
          defaultValue={data?.occupation ?? ""}
          register={register}
          error={errors?.occupation}
        />
        <InputField
          label={type === "create" ? "Password" : "Password (leave blank to keep)"}
          name="password"
          type="password"
          register={register}
          error={errors?.password}
        />
      </div>

      <span className="input-label font-medium mt-2 inline-block">Contact & profile</span>
      <div className="flex flex-wrap gap-4">
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
        {data?.id && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data.id}
            register={register}
            hidden
          />
        )}
      </div>

      <button
        type="submit"
        className="btn-primary"
      >
        {type === "create" ? "Create parent" : "Save changes"}
      </button>
    </form>
  );
};

export default ParentForm;
