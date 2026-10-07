"use client";

import { createAnnouncement } from "@/lib/announcementActions";
import { dispatchAnnouncementsUpdated } from "@/components/NavbarAnnouncementBell";
import { ChevronDown, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";

export type ClassOption = { id: number; name: string };

export default function AnnouncementCreateForm({
  classes,
}: {
  classes: ClassOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createAnnouncement({
        title,
        description,
        date,
        classId: classId ? parseInt(classId, 10) : null,
      });
      if (res.success) {
        toast.success("Announcement published.");
        setTitle("");
        setDescription("");
        setDate(new Date().toISOString().slice(0, 10));
        setClassId("");
        dispatchAnnouncementsUpdated();
        router.refresh();
      } else {
        toast.error(res.error || "Could not create announcement.");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Megaphone className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              Create announcement
            </h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Send a school-wide notice or target a specific class.
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
          {isOpen ? "Close" : "Compose"}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
              Announcement title
              <input
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Parent-teacher meeting"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
              Message
              <textarea
                required
                rows={4}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share the details your school community needs to know."
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Announcement date
              <input
                type="date"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Audience
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">All school</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {pending ? "Publishing…" : "Publish announcement"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
