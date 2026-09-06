"use client";

import { useState } from "react";
import ClassReportPreviewModal from "@/components/ClassReportPreviewModal";

export type ClassReportEntry = {
  name: string;
  surname: string;
  score: number;
};

export type ClassReportData = {
  className: string;
  gradingLevel: string;
  supervisor: string;
  subjects: string[];
  totalStudents: number;
  totalMale: number;
  totalFemale: number;
  averageAge: number;
  averageAttendance: number;
  averageScore: number;
  academicYear: string;
  term: string;
  topStudents: ClassReportEntry[];
  schoolSettings: {
    name: string | null;
    address: string | null;
    telephone: string | null;
    location: string | null;
    email: string | null;
    logoUrl: string | null;
  };
};

const ClassReportButton = ({ report }: { report: ClassReportData }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-sky-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-sky-700"
      >
        Generate report
      </button>

      {open && <ClassReportPreviewModal report={report} onClose={() => setOpen(false)} />}
    </>
  );
};

export default ClassReportButton;
