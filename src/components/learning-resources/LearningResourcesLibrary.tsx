"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget, type CloudinaryUploadWidgetInfo, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import { BookOpen, Eye, FileText, Search, Trash2 } from "lucide-react";
import { createLessonLearningResource, deleteLessonLearningResource } from "@/lib/learningResourceActions";
import { getYouTubeVideoId, type LearningResourceType } from "@/lib/learningResources";

type ClassOption = {
  id: number;
  name: string;
};

type ResourceRecord = {
  id: number;
  title: string;
  type: LearningResourceType;
  fileName: string | null;
  assetUrl: string;
  createdAt: string;
  class: { name: string } | null;
  lesson: {
    name: string;
    subject: { name: string };
    class: { name: string };
  } | null;
};

type Props = {
  role: string;
  classes: ClassOption[];
  resources: ResourceRecord[];
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

const getUploadedFileName = (info: CloudinaryUploadWidgetInfo) => {
  const source = info.original_filename || info.display_name || "learning-resource";
  const extension = info.format?.toLowerCase();
  return /\.[a-z0-9]+$/i.test(source) || !extension ? source : `${source}.${extension}`;
};

function ResourcePreview({ resource }: { resource: ResourceRecord }) {
  const videoId = resource.type === "YOUTUBE" ? getYouTubeVideoId(resource.assetUrl) : null;

  if (resource.type === "IMAGE") {
    return (
      <img
        src={resource.assetUrl}
        alt={resource.title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  if (resource.type === "YOUTUBE" && videoId) {
    return (
      <div className="relative h-full w-full bg-slate-900">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={resource.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  const isPdf = resource.fileName?.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    return (
      <iframe
        src={resource.assetUrl}
        title={`Preview of ${resource.title}`}
        className="h-full w-full bg-white"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-700">
      <FileText size={42} strokeWidth={1.5} />
      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
        {resource.fileName?.split(".").pop() || "Document"}
      </span>
    </div>
  );
}

function ResourceCard({
  resource,
  onView,
  onDelete,
  isAdmin,
  deleting,
}: {
  resource: ResourceRecord;
  onView: () => void;
  onDelete: () => void;
  isAdmin: boolean;
  deleting: boolean;
}) {
  const downloadUrl = resource.type === "YOUTUBE"
    ? resource.assetUrl
    : resource.type === "IMAGE"
      ? resource.assetUrl.replace("/upload/", "/upload/fl_attachment/")
      : resource.assetUrl;
  const audience = resource.class?.name ?? resource.lesson?.class.name ?? "General access";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <ResourcePreview resource={resource} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
          {resource.type === "YOUTUBE" ? "Video" : resource.type.toLowerCase()}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-slate-900" title={resource.title}>{resource.title}</h2>
          <p className="mt-1 truncate text-xs font-medium text-sky-700">{audience}</p>
          {resource.lesson ? (
            <p className="mt-1 truncate text-xs text-slate-500" title={resource.lesson.name}>
              {resource.lesson.subject.name} · {resource.lesson.name}
            </p>
          ) : null}
          <p className="mt-1 text-[11px] text-slate-400">
            Added {new Date(resource.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onView}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
          >
            <Eye size={14} /> View
          </button>
          {resource.type === "YOUTUBE" ? (
            <a
              href={resource.assetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Watch on YouTube
            </a>
          ) : (
            <a
              href={downloadUrl}
              download={resource.fileName ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
            >
              Download
            </a>
          )}
          {isAdmin ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
              aria-label={`Delete ${resource.title}`}
            >
              <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function LearningResourcesLibrary({ role, classes, resources }: Props) {
  const isAdmin = role === "admin";
  const router = useRouter();
  const [type, setType] = useState<LearningResourceType>("DOCUMENT");
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");
  const [selectedResource, setSelectedResource] = useState<ResourceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return resources;
    return resources.filter((resource) =>
      [
        resource.title,
        resource.fileName ?? "",
        resource.class?.name ?? "",
        resource.lesson?.name ?? "",
        resource.lesson?.subject.name ?? "",
        resource.lesson?.class.name ?? "",
        resource.class || resource.lesson ? "" : "general access",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [resources, search]);

  const clearSelectedFile = () => {
    setAssetUrl("");
    setFileName("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    startTransition(() => {
      void (async () => {
        const result = await createLessonLearningResource({
          title,
          classId: classId ? Number(classId) : null,
          type,
          assetUrl: type === "YOUTUBE" ? youtubeUrl : assetUrl,
          fileName,
        });
        if (!result.success) {
          setFormError(result.message ?? "Unable to save the learning resource.");
          return;
        }

        setTitle("");
        setClassId("");
        setYoutubeUrl("");
        clearSelectedFile();
        router.refresh();
      })().catch((error: unknown) => {
        setFormError(error instanceof Error ? error.message : "Unable to save the learning resource.");
      });
    });
  };

  const handleDelete = (resource: ResourceRecord) => {
    if (!window.confirm(`Delete "${resource.title}" from Learning Resources?`)) return;
    setListError("");
    setDeletingId(resource.id);
    startTransition(() => {
      void deleteLessonLearningResource(resource.id)
        .then((result) => {
          if (!result.success) {
            setListError(result.message ?? "Unable to delete the learning resource.");
            return;
          }
          if (selectedResource?.id === resource.id) setSelectedResource(null);
          router.refresh();
        })
        .catch((error: unknown) => {
          setListError(error instanceof Error ? error.message : "Unable to delete the learning resource.");
        })
        .finally(() => setDeletingId(null));
    });
  };

  const selectedAudience = selectedResource
    ? selectedResource.class?.name ?? selectedResource.lesson?.class.name ?? "General access"
    : "";
  const selectedDownloadUrl = selectedResource && selectedResource.type !== "YOUTUBE"
    ? selectedResource.type === "IMAGE"
      ? selectedResource.assetUrl.replace("/upload/", "/upload/fl_attachment/")
      : selectedResource.assetUrl
    : selectedResource?.assetUrl;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200 ring-1 ring-sky-300/20">
            <BookOpen size={23} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Teaching library</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Learning Resources</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Browse class materials and general documents, images, and videos needed to support your teaching.
              {isAdmin ? " Administrators can add and manage resources." : ""}
            </p>
          </div>
        </div>
      </header>

      {isAdmin ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><BookOpen size={19} /></div>
            <div>
              <h2 className="font-bold text-slate-900">Add a resource</h2>
              <p className="text-xs text-slate-500">Choose whether it is for one class or general access, then add a resource.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Resource title
              <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} className={inputClass} placeholder="e.g. Fractions worksheet" />
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Audience
              <select value={classId} onChange={(event) => setClassId(event.target.value)} className={inputClass}>
                <option value="">General access</option>
                {classes.map((classOption) => (
                  <option key={classOption.id} value={classOption.id}>{classOption.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-600">
              Resource type
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value as LearningResourceType);
                  setFormError("");
                  clearSelectedFile();
                }}
                className={inputClass}
              >
                <option value="DOCUMENT">Document</option>
                <option value="IMAGE">Image</option>
                <option value="YOUTUBE">YouTube video</option>
              </select>
            </label>
            {type === "YOUTUBE" ? (
              <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                YouTube video link
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  required
                  className={inputClass}
                  placeholder="https://youtu.be/..."
                />
              </label>
            ) : (
              <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                {type === "IMAGE" ? "Image file" : "Document file"}
                <CldUploadWidget
                  uploadPreset="school"
                  options={{
                    resourceType: type === "IMAGE" ? "image" : "raw",
                    clientAllowedFormats: type === "IMAGE"
                      ? ["jpg", "jpeg", "png", "gif", "webp"]
                      : ["pdf", "doc", "docx", "txt", "rtf", "odt", "ppt", "pptx", "xls", "xlsx", "csv", "zip"],
                    maxImageFileSize: 10_000_000,
                    maxRawFileSize: 20_000_000,
                    maxFiles: 1,
                    multiple: false,
                    sources: ["local"],
                    folder: "learning-resources",
                  }}
                  onSuccess={(result: CloudinaryUploadWidgetResults, { widget }) => {
                    if (typeof result.info === "string" || !result.info?.secure_url) {
                      setFormError("Cloud storage did not return a usable resource URL.");
                      return;
                    }
                    const info = result.info as CloudinaryUploadWidgetInfo;
                    setAssetUrl(info.secure_url);
                    setFileName(getUploadedFileName(info));
                    setFormError("");
                    widget.close();
                  }}
                  onError={(error) => {
                    const message = typeof error === "string" ? error : error?.statusText;
                    setFormError(message ? `Upload failed: ${message}` : "Upload failed. Check the Cloudinary upload preset and try again.");
                  }}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => { setFormError(""); open(); }}
                      className={`${inputClass} flex items-center justify-between text-left font-medium`}
                    >
                      <span className="truncate">{fileName || `Choose ${type === "IMAGE" ? "an image" : "a document"}`}</span>
                      <span className="ml-2 shrink-0">Browse</span>
                    </button>
                  )}
                </CldUploadWidget>
                {type === "DOCUMENT" ? (
                  <p className="text-[11px] font-normal text-slate-500">
                    PDF, text, presentation, spreadsheet, and ZIP files are supported.
                  </p>
                ) : null}
              </div>
            )}
          </div>
          {assetUrl && type !== "YOUTUBE" ? (
            <p className="mt-3 truncate text-xs text-emerald-700" title={fileName}>Selected: {fileName}</p>
          ) : null}
          {formError ? <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{formError}</p> : null}
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Saving…" : "Add resource"}
            </button>
          </div>
        </form>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Browse resources</h2>
            <p className="mt-0.5 text-sm text-slate-500">{filteredResources.length} resource{filteredResources.length === 1 ? "" : "s"}</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Search classes and resources" />
          </label>
        </div>
        {listError ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{listError}</p> : null}
        {filteredResources.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onView={() => setSelectedResource(resource)}
                onDelete={() => handleDelete(resource)}
                isAdmin={isAdmin}
                deleting={deletingId === resource.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><FileText size={22} /></div>
            <p className="mt-3 font-semibold text-slate-800">{resources.length ? "No matching resources" : "No learning resources yet"}</p>
            <p className="mt-1 text-sm text-slate-500">
              {resources.length ? "Try a different search." : isAdmin ? "Add the first resource above." : "An administrator can add materials for your lessons."}
            </p>
          </div>
        )}
      </section>
      {selectedResource ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
          role="presentation"
          onClick={() => setSelectedResource(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-view-title"
            className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h2 id="resource-view-title" className="truncate text-lg font-bold text-slate-900">{selectedResource.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedAudience}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close resource preview"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            </header>
            <div className="h-[70vh] min-h-64 max-h-[42rem] bg-slate-100">
              <ResourcePreview resource={selectedResource} />
            </div>
            <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              {selectedDownloadUrl ? (
                <>
                  {selectedResource.type === "DOCUMENT" && selectedResource.fileName?.toLowerCase().endsWith(".pdf") ? (
                    <a
                      href={selectedResource.assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Open preview in new tab
                    </a>
                  ) : null}
                  <a
                    href={selectedDownloadUrl}
                    download={selectedResource.type === "YOUTUBE" ? undefined : selectedResource.fileName ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
                  >
                    {selectedResource.type === "YOUTUBE" ? "Watch on YouTube" : "Download"}
                  </a>
                </>
              ) : null}
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
