"use client";

import { useState } from "react";
import Image from "next/image";

export default function AssignmentViewModal({ assignment }: { assignment: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200"
        aria-label="View assignment"
      >
        <Image src="/view.svg" alt="View" width={14} height={14} />
      </button>

      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-md relative w-full max-w-2xl">
            <h2 className="text-lg font-semibold mb-2">Assignment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-500">Subject</p>
                <p className="font-medium">{assignment.lesson.subject.name}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Class</p>
                <p className="font-medium">{assignment.lesson.class.name}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Teacher</p>
                <p className="font-medium">{assignment.lesson.teacher.name} {assignment.lesson.teacher.surname}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="font-medium">{new Date(assignment.dueDate).toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-500">Questions / Instructions</p>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{assignment.questions ?? assignment.title}</div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setOpen(false)} className="btn-primary">Close</button>
            </div>

            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="Close" width={14} height={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
