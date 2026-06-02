"use client";

import Image from "next/image";
import { useState } from "react";
import ExamTimetableForm from "@/components/forms/ExamTimetableForm";

type Props = {
  classes: { id: number; name: string; gradingLevel: string }[];
  lessons: {
    id: number;
    name: string;
    classId: number;
    subject: { name: string };
  }[];
};

const ExamTimetableModal = ({ classes, lessons }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaSky"
        onClick={() => setOpen(true)}
      >
        <Image src="/create.png" alt="Create timetable" width={16} height={16} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md w-full max-w-2xl p-6 relative">
            <div
              className="absolute top-4 right-4 cursor-pointer text-slate-500"
              onClick={() => setOpen(false)}
            >
              ✕
            </div>
            <ExamTimetableForm setOpen={setOpen} relatedData={{ classes, lessons }} />
          </div>
        </div>
      )}
    </>
  );
};

export default ExamTimetableModal;
