"use client";

import { deleteAnnouncement, updateAnnouncement } from "@/lib/announcementActions";
import { dispatchAnnouncementsUpdated } from "@/components/NavbarAnnouncementBell";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import type { Announcement, Class } from "@prisma/client";

type AnnouncementData = Announcement & { class: Class | null };

export default function AnnouncementRowActions({ id, announcement }: { id: number; announcement?: AnnouncementData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    title: announcement?.title || "",
    description: announcement?.description || "",
    date: announcement?.date ? new Date(announcement.date).toISOString().slice(0, 10) : "",
    classId: announcement?.classId?.toString() || "",
  });

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteAnnouncement(id);
      if (res.success) {
        toast.success("Announcement deleted.");
        dispatchAnnouncementsUpdated();
        router.refresh();
        setConfirmOpen(false);
      } else {
        toast.error(res.error || "Delete failed.");
      }
    });
  };

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updateAnnouncement({
        id,
        title: editData.title,
        description: editData.description,
        date: editData.date,
        classId: editData.classId ? parseInt(editData.classId, 10) : null,
      });
      if (res.success) {
        toast.success("Announcement updated.");
        dispatchAnnouncementsUpdated();
        router.refresh();
        setEditOpen(false);
      } else {
        toast.error(res.error || "Update failed.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setEditOpen(true)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600"
        aria-label="Edit announcement"
      >
        <Image src="/edit.svg" alt="" width={14} height={14} />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600"
        aria-label="Delete announcement"
      >
        <Image src="/delete.svg" alt="" width={14} height={14} />
      </button>
      {editOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-950 rounded-lg p-6 max-w-md w-full shadow-xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Edit announcement
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                <input
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200"
                  onClick={() => setEditOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleUpdate}
                  className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-950 rounded-lg p-4 max-w-sm w-full shadow-xl border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-700 mb-4">
              Delete this announcement? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
