"use client";

import { createAnnouncement } from "@/lib/announcementActions";
import { dispatchAnnouncementsUpdated } from "@/components/NavbarAnnouncementBell";
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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-yellow-50/50 p-4 sm:p-5 shadow-sm"
    >
      <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">
        Create announcement
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 mb-4">
        School-wide if no class is selected. The navbar count updates automatically.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Title
          <input
            required
            className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-2 w-full text-slate-900 dark:text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Parent–teacher meeting"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Description
          <textarea
            required
            rows={3}
            className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-2 w-full resize-y text-slate-900 dark:text-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details for students, teachers, and parents…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Date
          <input
            type="date"
            required
            className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-2 w-full text-slate-900 dark:text-white"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Class (optional)
          <select
            className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-2 w-full text-slate-900 dark:text-white"
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
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-medium text-white shadow-md hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
      >
        {pending ? "Publishing…" : "Publish announcement"}
      </button>
    </form>
  );
}
