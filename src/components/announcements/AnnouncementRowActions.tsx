"use client";

import { deleteAnnouncement } from "@/lib/announcementActions";
import { dispatchAnnouncementsUpdated } from "@/components/NavbarAnnouncementBell";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";

export default function AnnouncementRowActions({ id }: { id: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600"
        aria-label="Delete announcement"
      >
        <Image src="/delete.svg" alt="" width={14} height={14} />
      </button>
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
