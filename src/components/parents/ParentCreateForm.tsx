"use client";

import { createParent } from "@/lib/actions";
import { parentSchema, type ParentSchema } from "@/lib/formValidationSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { startTransition, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import InputField from "../InputField";

export default function ParentCreateForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema) as never,
  });

  const [state, formAction] = useActionState(createParent, {
    success: false,
    error: false,
  });

  useEffect(() => {
    if (state.success) {
      toast.success("Parent created successfully.");
      reset();
      router.refresh();
    } else if (state.error) {
      toast.error(
        "Could not create parent. Check username, phone, and password (min 8 characters)."
      );
    }
  }, [state, router, reset]);

  const onSubmit = handleSubmit((data) => {
    startTransition(() => {
      formAction(data);
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-indigo-50/50 p-4 sm:p-5 shadow-sm"
    >
      <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">
        Register parent
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 mb-4">
        Creates a parent account for linking students. Phone must be unique.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InputField
          label="Username"
          name="username"
          register={register}
          error={errors.username}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          register={register}
          error={errors.password}
        />
        <InputField
          label="Email"
          name="email"
          register={register}
          error={errors.email}
        />
        <InputField
          label="First name"
          name="name"
          register={register}
          error={errors.name}
        />
        <InputField
          label="Last name"
          name="surname"
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Phone"
          name="phone"
          register={register}
          error={errors.phone}
        />
        <div className="flex flex-col gap-2 w-full sm:col-span-2 lg:col-span-3">
          <label className="input-label">Address</label>
          <input
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("address")}
          />
          {errors.address?.message && (
            <p className="text-xs text-red-400">
              {errors.address.message.toString()}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 w-full sm:w-auto rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:from-violet-700 hover:to-indigo-700"
      >
        Create parent
      </button>
    </form>
  );
}
