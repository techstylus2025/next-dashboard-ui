"use client";

import type { TermlyReportRow } from "@/lib/resultsData";
import { exportTermlyReportPdf } from "@/lib/exportReportPdf";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import TermReportView from "./TermReportView";

export default function ReportPreviewModal({
  report,
  onClose,
}: {
  report: TermlyReportRow;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handlePdf = () => {
    setExporting(true);
    startTransition(async () => {
      try {
        await exportTermlyReportPdf(report);
        toast.success("PDF downloaded.");
      } catch {
        toast.error("Could not export PDF.");
      } finally {
        setExporting(false);
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="report-preview-modal bg-white w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 shrink-0 print:hidden">
          <h3 className="font-semibold text-slate-800 truncate pr-2">
            Preview — {report.studentName}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs sm:text-sm hover:bg-slate-50"
            >
              Print
            </button>
            <button
              type="button"
              disabled={pending || exporting}
              onClick={handlePdf}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs sm:text-sm text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs sm:text-sm text-white"
            >
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 print:p-8 print:overflow-visible">
          <TermReportView report={report} />
        </div>
      </div>

    </div>
  );
}
