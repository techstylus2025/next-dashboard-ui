"use client";

import { useEffect, useState } from "react";
import MessagesChat from "@/components/MessagesChat";
import type { ChatThread, UserRoleSlug } from "@/lib/messageActions";

type MessagesThreadResponse = {
  role: UserRoleSlug;
  currentUserId: string;
  currentName: string;
  threads: ChatThread[];
  allParents: Array<{ id: string; name: string; surname: string }>;
  allTeachers: Array<{ id: string; name: string; surname: string }>;
};

export default function MessagesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MessagesThreadResponse | null>(null);

  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    setError(null);
    setData(null);

    fetch("/api/messages/threads", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "Unable to load messages");
        }
        return res.json() as Promise<MessagesThreadResponse>;
      })
      .then((payload) => setData(payload))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load messages"))
      .finally(() => setIsLoading(false));
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 py-6 px-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Messages</p>
            <p className="text-xs text-slate-500">
              Chat with the school admin and teachers in a modal window.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
            onClick={onClose}
            aria-label="Close messages modal"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto bg-slate-50 p-4 sm:p-5">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading messages…</div>
          ) : error ? (
            <div className="p-8 text-center text-rose-500">{error}</div>
          ) : data ? (
            <MessagesChat
              role={data.role}
              currentUserId={data.currentUserId}
              currentName={data.currentName}
              initialThreads={data.threads}
              allParents={data.allParents}
              allTeachers={data.allTeachers}
            />
          ) : (
            <div className="p-8 text-center text-slate-500">
              No messages available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
