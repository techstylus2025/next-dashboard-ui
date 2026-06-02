"use client";

import { createEvent, updateEvent } from "@/lib/eventActions";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";

export default function EventForm({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: (v: boolean) => void;
  relatedData?: any;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { user } = useUser();

  const classes: { id: number; name: string }[] = relatedData?.classes || [];

  const defaultDate = data?.startTime
    ? new Date(data.startTime).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const defaultStart = data?.startTime
    ? new Date(data.startTime).toTimeString().slice(0, 5)
    : "09:00";
  const defaultEnd = data?.endTime
    ? new Date(data.endTime).toTimeString().slice(0, 5)
    : "10:00";

  const [title, setTitle] = useState(data?.title ?? "");
  const [description, setDescription] = useState(data?.description ?? "");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [classId, setClassId] = useState(data?.classId ? String(data.classId) : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (isAdmin === false) {
        toast.error("You don't have permission to create or update events.");
        return;
      }
      if (type === "create") {
        const res = await createEvent({
          title,
          description,
          date,
          startTime,
          endTime,
          classId: classId ? parseInt(classId, 10) : null,
        });
        if (res.success) {
          toast.success("Event created.");
          setTitle("");
          setDescription("");
          setDate(new Date().toISOString().slice(0, 10));
          setClassId("");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Could not create event.");
        }
      } else {
        const res = await updateEvent({
          id: data.id,
          title,
          description,
          date,
          startTime,
          endTime,
          classId: classId ? parseInt(classId, 10) : null,
        });
        if (res.success) {
          toast.success("Event updated.");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || "Could not update event.");
        }
      }
    });
  };

  // Prefer client-side Clerk user info when available, fallback to API route
  useEffect(() => {
    let mounted = true;

    const detectAdminFromRole = (role: any) => {
      let ok = false;
      if (typeof role === "string") {
        ok = role.toLowerCase().includes("admin");
      } else if (Array.isArray(role)) {
        ok = role.some((r) => typeof r === "string" && r.toLowerCase().includes("admin"));
      } else if (role && typeof role === "object") {
        if ((role as any).isAdmin === true) ok = true;
        if (typeof (role as any).name === "string" && (role as any).name.toLowerCase().includes("admin")) ok = true;
      }
      return ok;
    };

    (async () => {
      try {
        if (user) {
          const role = (user.publicMetadata as any)?.role;
          // eslint-disable-next-line no-console
          console.debug("useUser -> publicMetadata:", user.publicMetadata);
          if (mounted) setIsAdmin(detectAdminFromRole(role));
          return;
        }

        const res = await fetch("/api/me/role");
        if (!mounted) return;
        const json = res.ok ? await res.json() : { role: null };
        // debug logging to help diagnose role resolution issues
        // eslint-disable-next-line no-console
        console.debug("/api/me/role ->", json);

        if (mounted) setIsAdmin(detectAdminFromRole(json.role));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("role fetch error", err);
        if (mounted) setIsAdmin(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-2">{type === "create" ? "Create event" : "Update event"}</h2>
      <div className="grid gap-3">
        <label className="flex flex-col text-sm">
          Title
          <input
            required
            className="rounded-md border border-slate-200 px-3 py-2 w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
          />
        </label>
        <label className="flex flex-col text-sm">
          Description
          <textarea
            rows={3}
            className="rounded-md border border-slate-200 px-3 py-2 w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="flex flex-col text-sm">
            Date
            <input
              type="date"
              required
              className="rounded-md border border-slate-200 px-3 py-2 w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm">
            Start time
            <input
              type="time"
              required
              className="rounded-md border border-slate-200 px-3 py-2 w-full"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm">
            End time
            <input
              type="time"
              required
              className="rounded-md border border-slate-200 px-3 py-2 w-full"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col text-sm">
          Class (optional)
          <select
            className="rounded-md border border-slate-200 px-3 py-2 w-full"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Whole school</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {isAdmin === null ? (
          <button
            type="button"
            disabled
            className="mt-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Checking permissions…
          </button>
        ) : isAdmin === false ? (
          <div className="mt-2 p-3 rounded-md bg-yellow-50 text-yellow-800 text-sm">
            You do not have permission to create or update events.
          </div>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {pending ? (type === "create" ? "Creating…" : "Updating…") : type === "create" ? "Create event" : "Update event"}
          </button>
        )}
      </div>
    </form>
  );
}
