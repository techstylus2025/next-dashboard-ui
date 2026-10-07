"use client";

import ParentForm from "@/components/forms/ParentForm";
import { deleteParent } from "@/lib/actions";
import type { ParentSchema } from "@/lib/formValidationSchemas";
import Image from "next/image";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";

type ParentRow = ParentSchema & {
  students: { name: string; surname: string }[];
};

export default function ParentRowActions({ parent }: { parent: ParentRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const handleDelete = () => {
    const fd = new FormData();
    fd.set("id", parent.id!);
    startTransition(async () => {
      const state = await deleteParent({ success: false, error: false }, fd);
      if (state.success) {
        toast.success("Parent deleted.");
        router.refresh();
        setDeleteOpen(false);
      } else {
        toast.error(
          "Cannot delete parent with linked students, or delete failed."
        );
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setViewOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100"
        aria-label={`View ${parent.name} ${parent.surname}`}
        title="View parent details"
      >
        <Eye size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200 hover:bg-slate-200"
        aria-label="Edit parent"
      >
        <Image src="/edit.svg" alt="" width={14} height={14} />
      </button>
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600"
        aria-label="Delete parent"
      >
        <Image src="/delete.svg" alt="" width={14} height={14} />
      </button>

      {viewOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setViewOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="parent-details-title"
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
              onClick={() => setViewOpen(false)}
              aria-label="Close parent details"
            >
              <Image src="/close.png" alt="" width={16} height={16} />
            </button>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Parent profile
              </p>
              <h2 id="parent-details-title" className="mt-1 text-2xl font-semibold text-slate-900">
                {parent.name} {parent.surname}
              </h2>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Username", parent.username],
                ["Email", parent.email || "—"],
                ["Phone", parent.phone],
                ["Occupation", parent.occupation || "—"],
                ["Address", parent.address],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-medium text-slate-800">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 rounded-xl border border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Linked students <span className="text-slate-400">({parent.students.length})</span>
              </h3>
              {parent.students.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {parent.students.map((student, index) => (
                    <li
                      key={`${student.name}-${student.surname}-${index}`}
                      className="py-2 text-sm text-slate-700"
                    >
                      {student.name} {student.surname}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No students linked to this parent.</p>
              )}
            </div>
          </section>
        </div>,
        document.body
      )}

      {editOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-4 relative w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
            <button
              type="button"
              className="absolute top-4 right-4 z-10"
              onClick={() => setEditOpen(false)}
              aria-label="Close"
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </button>
            <ParentForm type="update" data={parent} setOpen={setEditOpen} />
          </div>
        </div>,
        document.body
      )}

      {deleteOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full shadow-xl">
            <p className="text-sm text-slate-700 mb-4">
              Delete {parent.name} {parent.surname}? Students must be reassigned
              first.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200"
                onClick={() => setDeleteOpen(false)}
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
        </div>,
        document.body
      )}
    </>
  );
}
