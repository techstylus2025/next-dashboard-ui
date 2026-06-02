"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import InputField from "./InputField";
import { profileSchema, type ProfileSchema } from "@/lib/formValidationSchemas";

type ProfileUpdateFormProps = {
  initialData: {
    username: string;
    img?: string | null;
  };
  pendingRequest?: {
    id: number;
    requestedAt: string;
    status: string;
  } | null;
};

const ProfileUpdateForm = ({ initialData, pendingRequest }: ProfileUpdateFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: initialData.username,
      password: "",
      img: initialData.img ?? "",
    },
  });

  const [img, setImg] = useState<string | undefined>(initialData.img ?? undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: ProfileSchema) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/password-change/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          img: img ?? null,
          newPassword: data.password || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Unable to update profile.");
      }

      toast.success("Profile update submitted successfully.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Edit profile</h2>
        <p className="mt-2 text-sm text-slate-500">
          You can update your username, profile picture, and request a password change.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Username"
              name="username"
              register={register}
              defaultValue={initialData.username}
              error={errors.username}
            />
            <InputField
              label="New password"
              name="password"
              type="password"
              register={register}
              error={errors.password}
            />
          </div>
          <div className="space-y-3">
            <label className="input-label">Profile picture</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                {img ? (
                  <Image src={img} alt="Profile picture" width={80} height={80} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <CldUploadWidget
                uploadPreset="school"
                onSuccess={(result, { widget }) => {
                  setImg(result.info.secure_url);
                  widget.close();
                }}
              >
                {({ open }) => (
                  <button type="button" className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700" onClick={() => open()}>
                    Upload new image
                  </button>
                )}
              </CldUploadWidget>
            </div>
          </div>
        </div>
        {pendingRequest ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            A password change request is already pending since {new Date(pendingRequest.requestedAt).toLocaleString()}.
          </div>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save profile changes"}
        </button>
      </form>
    </div>
  );
};

export default ProfileUpdateForm;
