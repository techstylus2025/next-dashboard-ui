"use client";

import Image from "next/image";
import { FieldError, UseFormRegister } from "react-hook-form";
import { CldUploadWidget } from "next-cloudinary";

export function FormHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {badge ? (
        <span className="inline-flex w-fit shrink-0 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-sky-100">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function FormFieldGrid({
  cols = 2,
  children,
}: {
  cols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}) {
  const colClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 3
        ? "grid-cols-1 md:grid-cols-3"
        : cols === 4
          ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
          : "grid-cols-1 md:grid-cols-2";

  return <div className={`grid gap-4 ${colClass}`}>{children}</div>;
}

export function FormSelect({
  label,
  name,
  register,
  error,
  options,
  placeholder,
  defaultValue,
  multiple,
}: {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  defaultValue?: string | number | string[];
  multiple?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="input-label" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        multiple={multiple}
        className={`input-base text-sm ${multiple ? "min-h-[120px]" : ""}`}
        {...register(name)}
        defaultValue={defaultValue as string}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error?.message ? (
        <p className="text-xs text-red-500">{error.message.toString()}</p>
      ) : null}
    </div>
  );
}

export function FormTextarea({
  label,
  name,
  register,
  error,
  defaultValue,
  placeholder,
  rows = 4,
  hint,
  hideLabel = false,
}: {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  hint?: string;
  hideLabel?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel ? (
        <label className="input-label" htmlFor={name}>
          {label}
        </label>
      ) : null}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="input-base min-h-[88px] resize-y text-sm"
        {...register(name)}
      />
      {error?.message ? (
        <p className="text-xs text-red-500">{error.message.toString()}</p>
      ) : null}
    </div>
  );
}

export function FormCheckboxField({
  label,
  description,
  name,
  register,
  defaultChecked,
  children,
}: {
  label: string;
  description?: string;
  name: string;
  register: UseFormRegister<any>;
  defaultChecked?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          {...register(name)}
        />
        <span>
          <span className="block text-sm font-medium text-slate-800">
            {label}
          </span>
          {description ? (
            <span className="mt-0.5 block text-xs text-slate-500">
              {description}
            </span>
          ) : null}
        </span>
      </label>
      {children ? <div className="mt-3 pl-7">{children}</div> : null}
    </div>
  );
}

export function PhotoUploadCard({
  imageUrl,
  onUpload,
  label = "Profile photo",
}: {
  imageUrl?: string | null;
  onUpload: (info: { secure_url?: string }) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-5 sm:flex-row sm:items-center">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-md ring-2 ring-slate-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
            Photo
          </div>
        )}
      </div>
      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-1 text-xs text-slate-500">
          Upload a clear passport-style photo. JPG or PNG recommended.
        </p>
        <CldUploadWidget
          uploadPreset="school"
          onSuccess={(result, { widget }) => {
            onUpload(result.info as { secure_url?: string });
            widget.close();
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              <Image src="/upload.png" alt="" width={18} height={18} />
              Choose photo
            </button>
          )}
        </CldUploadWidget>
      </div>
    </div>
  );
}

export function FormStepper({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: string[];
  currentStep: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Progress
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            Step {currentStep + 1} of {steps.length} — {steps[currentStep]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => {
            const isActive = currentStep === index;
            const isComplete = index < currentStep;
            return (
              <button
                key={step}
                type="button"
                onClick={() => onStepClick(index)}
                title={step}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-semibold transition ${
                  isActive
                    ? "bg-sky-600 text-white shadow-sm shadow-sky-200"
                    : isComplete
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-sky-200"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function FormNavButtons({
  currentStep,
  onPrevious,
  onNext,
  submitLabel,
  isLastStep,
}: {
  currentStep: number;
  onPrevious: () => void;
  onNext: () => void;
  submitLabel: string;
  isLastStep: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 0}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {isLastStep ? (
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-700"
        >
          {submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-700"
        >
          Continue
        </button>
      )}
    </div>
  );
}

export function FormErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
