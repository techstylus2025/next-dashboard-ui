"use client";

import { CldUploadWidget, type CloudinaryUploadWidgetInfo, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { saveReportSignature } from "@/lib/termlyReportActions";

type SupervisedClass = {
  id: number;
  name: string;
  signature: string | null;
};

export default function ReportSignatureManager({
  isAdmin,
  supervisedClasses,
  headteacherSignature,
}: {
  isAdmin: boolean;
  supervisedClasses: SupervisedClass[];
  headteacherSignature: string | null;
}) {
  const [classId, setClassId] = useState(
    supervisedClasses[0]?.id ? String(supervisedClasses[0].id) : ""
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const activeClass = supervisedClasses.find((item) => String(item.id) === classId);
  const currentSignature = isAdmin ? headteacherSignature : activeClass?.signature ?? null;
  const signatureLabel = isAdmin ? "Headteacher signature" : "Facilitator signature";

  if (!isAdmin && supervisedClasses.length === 0) return null;

  const handleSuccess = (
    result: CloudinaryUploadWidgetResults,
    widget: { close: () => void }
  ) => {
    if (typeof result.info === "string" || !result.info?.secure_url) {
      setError("Cloud storage did not return a usable signature image.");
      return;
    }

    const info = result.info as CloudinaryUploadWidgetInfo;
    const fileExtension = info.format?.toLowerCase();
    if (!fileExtension || !["png", "jpg", "jpeg", "webp"].includes(fileExtension)) {
      setError("Upload a PNG, JPG, or WEBP signature image.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const response = await saveReportSignature({
        signatureUrl: info.secure_url,
        ...(!isAdmin ? { classId: Number(classId) } : {}),
      });
      if (!response.success) {
        setError(response.error || "Could not apply the signature.");
        return;
      }
      toast.success(`${signatureLabel} applied to ${isAdmin ? "all student reports" : `${activeClass?.name} reports`}.`);
      widget.close();
      router.refresh();
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Report signature
        </p>
        <h2 className="mt-0.5 text-sm font-semibold text-slate-900">{signatureLabel}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {isAdmin
            ? "Applied to the headteacher signature field on every student report."
            : "Applied to the facilitator signature field on every report for your supervised class."}
        </p>
        {!isAdmin && (
          <label className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600">
            Class
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
            >
              {supervisedClasses.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
              ))}
            </select>
          </label>
        )}
        {error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}
      </div>

      <div className="mt-3 flex shrink-0 items-center gap-3 sm:mt-0">
        {currentSignature && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentSignature}
            alt={`Current ${signatureLabel.toLowerCase()}`}
            className="h-10 w-24 rounded-md border border-slate-200 bg-slate-50 object-contain p-1"
          />
        )}
        <CldUploadWidget
          uploadPreset="school"
          options={{
            resourceType: "image",
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
            maxImageFileSize: 5_000_000,
            maxFiles: 1,
            multiple: false,
            sources: ["local"],
            folder: "report-signatures",
          }}
          onSuccess={(result, { widget }) => handleSuccess(result, widget)}
          onError={(uploadError) => {
            const message = typeof uploadError === "string" ? uploadError : uploadError?.statusText;
            setError(message ? `Signature upload failed: ${message}` : "Signature upload failed. Check the Cloudinary upload preset.");
          }}
        >
          {({ open }) => (
            <button
              type="button"
              disabled={pending || (!isAdmin && !classId)}
              onClick={() => {
                setError(null);
                open();
              }}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {pending ? "Applying…" : currentSignature ? "Replace signature" : "Upload signature"}
            </button>
          )}
        </CldUploadWidget>
      </div>
    </section>
  );
}
