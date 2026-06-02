"use client";

import ParentForm from "@/components/forms/ParentForm";
import { deleteParent } from "@/lib/actions";
import type { ParentSchema } from "@/lib/formValidationSchemas";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

      {editOpen && (
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
        </div>
      )}

      {deleteOpen && (
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
        </div>
      )}
    </>
  );
}
