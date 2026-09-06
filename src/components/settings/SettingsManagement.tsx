"use client";

import {
  archiveAcademicYearWithSelection,
  unarchiveAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setActiveAcademicYear,
  archiveTeacherRecordsWithSelection,
  archiveStudentRecordsWithSelection,
  updateSchoolSettings,
  resetAppData,
  type TermInput,
} from "@/lib/settingsActions";
import { archiveParentRecords } from "@/lib/parentArchiveActions";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type ChangeEvent } from "react";
import { toast } from "react-toastify";
import { calculateTermDays } from "@/lib/academicYearUtils";

export type TermRow = {
  termNumber: number;
  days: number;
  weeks: number;
  holidays: number;
  startDate: string;
  endDate: string;
};

export type AcademicYearRow = {
  id: number;
  label: string;
  numberOfTerms: number;
  isActive: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  terms: TermRow[];
};

export type SchoolSettingsRow = {
  name: string;
  address: string;
  telephone: string;
  location: string;
  email: string;
  logoUrl: string | null;
};

type ArchiveCounts = {
  feeSchedules: number;
  attendance: number;
  exams: number;
  assignments: number;
  events: number;
  announcements: number;
  results: number;
};

type ArchiveSelection = {
  fee: boolean;
  attendance: boolean;
  exams: boolean;
  assignments: boolean;
  events: boolean;
  announcements: boolean;
  results: boolean;
};

type PersonArchiveSelection = {
  attendance: boolean;
  exams: boolean;
  assignments: boolean;
  results: boolean;
};

const emptyTerm = (): TermRow => ({
  termNumber: 0,
  days: 90,
  weeks: 12,
  holidays: 0,
  startDate: "",
  endDate: "",
});

import GradingSystemSection from "./GradingSystemSection";
import type { GradingEntryRow, GradingLevelRow } from "@/lib/gradingData";

export default function SettingsManagement({
  academicYears,
  gradingEntries,
  gradingLevels,
  teachers,
  students,
  parents,
  schoolSettings,
  archivedCounts,
}: {
  academicYears: AcademicYearRow[];
  gradingEntries: GradingEntryRow[];
  gradingLevels: GradingLevelRow[];
  teachers?: { id: string; name: string; surname: string }[];
  students?: { id: string; name: string; surname: string }[];
  parents?: { id: string; name: string; surname: string }[];
  schoolSettings?: SchoolSettingsRow | null;
  archivedCounts: ArchiveCounts;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settingsTab, setSettingsTab] = useState<"academic" | "grading" | "school" | "archives">("academic");

  const [schoolName, setSchoolName] = useState(schoolSettings?.name ?? "");
  const [schoolAddress, setSchoolAddress] = useState(schoolSettings?.address ?? "");
  const [schoolTelephone, setSchoolTelephone] = useState(schoolSettings?.telephone ?? "");
  const [schoolLocation, setSchoolLocation] = useState(schoolSettings?.location ?? "");
  const [schoolEmail, setSchoolEmail] = useState(schoolSettings?.email ?? "");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(schoolSettings?.logoUrl ?? "");

  const [label, setLabel] = useState("");
  const [numberOfTerms, setNumberOfTerms] = useState(3);
  const [setAsActive, setSetAsActive] = useState(true);
  const [editingAcademicYearId, setEditingAcademicYearId] = useState<number | null>(null);
  const [terms, setTerms] = useState<TermRow[]>([
    { ...emptyTerm(), termNumber: 1 },
    { ...emptyTerm(), termNumber: 2 },
    { ...emptyTerm(), termNumber: 3 },
  ]);

  const [archiveOptionsYearId, setArchiveOptionsYearId] = useState<number | null>(null);
  const [archiveYearSelection, setArchiveYearSelection] = useState<ArchiveSelection>({
    fee: true,
    attendance: true,
    exams: true,
    assignments: true,
    events: true,
    announcements: true,
    results: true,
  });
  const [archiveYearLabel, setArchiveYearLabel] = useState("");

  const [archiveTeacherSelection, setArchiveTeacherSelection] = useState<PersonArchiveSelection>({
    attendance: true,
    exams: true,
    assignments: true,
    results: true,
  });
  const [archiveStudentSelection, setArchiveStudentSelection] = useState<PersonArchiveSelection>({
    attendance: true,
    exams: true,
    assignments: true,
    results: true,
  });

  const activeYear = useMemo(
    () => academicYears.find((y) => y.isActive && !y.isArchived),
    [academicYears]
  );

  useEffect(() => {
    if (schoolSettings) {
      setSchoolName(schoolSettings.name);
      setSchoolAddress(schoolSettings.address);
      setSchoolTelephone(schoolSettings.telephone);
      setSchoolLocation(schoolSettings.location);
      setSchoolEmail(schoolSettings.email);
      setSchoolLogoUrl(schoolSettings.logoUrl ?? "");
    }
  }, [schoolSettings]);

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file for the school logo.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSchoolLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSaveSchoolSettings = () => {
    if (
      !schoolName.trim() ||
      !schoolAddress.trim() ||
      !schoolTelephone.trim() ||
      !schoolLocation.trim() ||
      !schoolEmail.trim()
    ) {
      toast.error("Please fill in all school details.");
      return;
    }

    startTransition(async () => {
      const res = await updateSchoolSettings({
        name: schoolName,
        address: schoolAddress,
        telephone: schoolTelephone,
        location: schoolLocation,
        email: schoolEmail,
        logoUrl: schoolLogoUrl || null,
      });
      if (res.success) {
        toast.success("School details saved.");
        router.refresh();
      } else {
        toast.error(res.error || "Could not save school details.");
      }
    });
  };

  const syncTermRows = (count: number) => {
    const n = Math.min(4, Math.max(1, count));
    setNumberOfTerms(n);
    setTerms((prev) => {
      const next = [...prev];
      while (next.length < n) {
        next.push({ ...emptyTerm(), termNumber: next.length + 1 });
      }
      return next.slice(0, n).map((t, i) => ({ ...t, termNumber: i + 1 }));
    });
  };

  const updateTerm = (
    index: number,
    field: keyof Omit<TermRow, "termNumber">,
    value: string | number
  ) => {
    setTerms((prev) => {
      const next = [...prev];
      const current = next[index] ?? emptyTerm();
      const updated = {
        ...current,
        [field]: value,
      } as TermRow;

      if (field === "holidays" || field === "startDate" || field === "endDate") {
        updated.days = calculateTermDays(
          String(updated.startDate),
          String(updated.endDate),
          Number(updated.holidays) || 0
        );
      }

      next[index] = updated;
      return next;
    });
  };

  const refreshAcademicYearForm = () => {
    setLabel("");
    setEditingAcademicYearId(null);
    setNumberOfTerms(3);
    syncTermRows(3);
    setTerms([
      { ...emptyTerm(), termNumber: 1 },
      { ...emptyTerm(), termNumber: 2 },
      { ...emptyTerm(), termNumber: 3 },
    ]);
  };

  const startEditingAcademicYear = (year: AcademicYearRow) => {
    setEditingAcademicYearId(year.id);
    setLabel(year.label);
    setNumberOfTerms(year.numberOfTerms);
    setSetAsActive(year.isActive);
    setTerms(
      year.terms.map((term, index) => ({
        termNumber: index + 1,
        days: term.days,
        weeks: term.weeks,
        holidays: term.holidays ?? 0,
        startDate: term.startDate.slice(0, 10),
        endDate: term.endDate.slice(0, 10),
      }))
    );
  };

  const handleCreate = () => {
    const termPayload: TermInput[] = terms.map((t, i) => ({
      termNumber: i + 1,
      days: Number(t.days) || 0,
      weeks: Number(t.weeks) || 0,
      holidays: Number(t.holidays) || 0,
      startDate: t.startDate,
      endDate: t.endDate,
    }));

    startTransition(async () => {
      const res = editingAcademicYearId
        ? await updateAcademicYear({
            academicYearId: editingAcademicYearId,
            label,
            numberOfTerms,
            terms: termPayload,
            setAsActive,
          })
        : await createAcademicYear({
            label,
            numberOfTerms,
            terms: termPayload,
            setAsActive,
          });
      if (res.success) {
        toast.success(editingAcademicYearId ? "Academic year updated." : "Academic year created.");
        refreshAcademicYearForm();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save academic year.");
      }
    });
  };

  const openArchiveYearOptions = (id: number, yearLabel: string) => {
    setArchiveOptionsYearId(id);
    setArchiveYearLabel(yearLabel);
    setArchiveYearSelection({
      fee: true,
      attendance: true,
      exams: true,
      assignments: true,
      events: true,
      announcements: true,
      results: true,
    });
  };

  const handleArchiveSelectedYear = async (id: number) => {
    if (!archiveYearSelection.fee &&
      !archiveYearSelection.attendance &&
      !archiveYearSelection.exams &&
      !archiveYearSelection.assignments &&
      !archiveYearSelection.events &&
      !archiveYearSelection.announcements &&
      !archiveYearSelection.results
    ) {
      toast.error("Select at least one record type to archive.");
      return;
    }

    if (
      !confirm(
        `Archive selected record types for "${archiveYearLabel}"?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await archiveAcademicYearWithSelection(id, archiveYearSelection);
      if (res.success) {
        toast.success(res.summary || "Academic year archived.");
        setArchiveOptionsYearId(null);
        router.refresh();
      } else {
        toast.error(res.error || "Archive failed.");
      }
    });
  };

  const handleUnarchiveYear = async (id: number) => {
    if (!confirm("Unarchive this academic year and its related records?")) {
      return;
    }
    startTransition(async () => {
      const res = await unarchiveAcademicYear(id);
      if (res.success) {
        toast.success(res.summary || "Academic year unarchived.");
        router.refresh();
      } else {
        toast.error(res.error || "Unarchive failed.");
      }
    });
  };

  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedParent, setSelectedParent] = useState<string>("");

  const handleArchiveTeacher = () => {
    if (!selectedTeacher) return;
    if (
      !confirm(
        "Archive selected teacher record types? This will mark selected related records as archived."
      )
    )
      return;
    startTransition(async () => {
      const res = await archiveTeacherRecordsWithSelection(
        selectedTeacher,
        archiveTeacherSelection
      );
      if (res.success) {
        toast.success(res.summary || "Teacher records archived.");
        router.refresh();
      } else {
        toast.error(res.error || "Could not archive teacher records.");
      }
    });
  };

  const handleArchiveStudent = () => {
    if (!selectedStudent) return;
    if (
      !confirm(
        "Archive selected student record types? This will mark selected related records as archived."
      )
    )
      return;
    startTransition(async () => {
      const res = await archiveStudentRecordsWithSelection(
        selectedStudent,
        archiveStudentSelection
      );
      if (res.success) {
        toast.success(res.summary || "Student records archived.");
        router.refresh();
      } else {
        toast.error(res.error || "Could not archive student records.");
      }
    });
  };

  const handleArchiveParent = () => {
    if (!selectedParent) return;
    if (!confirm("Archive this parent and their student records?")) return;
    startTransition(async () => {
      const res = await archiveParentRecords(selectedParent);
      if (res.success) {
        toast.success(res.summary || "Parent records archived.");
        router.refresh();
      } else {
        toast.error(res.error || "Could not archive parent records.");
      }
    });
  };

  const handleSetActive = (id: number) => {
    startTransition(async () => {
      const res = await setActiveAcademicYear(id);
      if (res.success) {
        toast.success("Active academic year updated.");
        router.refresh();
      } else {
        toast.error(res.error || "Could not set active year.");
      }
    });
  };

  const handleDeleteAcademicYear = (id: number) => {
    if (!confirm("Delete this academic year and all its terms?")) return;
    startTransition(async () => {
      const res = await deleteAcademicYear(id);
      if (res.success) {
        toast.success("Academic year deleted.");
        if (editingAcademicYearId === id) {
          refreshAcademicYearForm();
        }
        router.refresh();
      } else {
        toast.error(res.error || "Could not delete academic year.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 w-full">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 sm:text-3xl">Settings</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Manage school information, academic years, grading scales, and archival operations. Administrator access only.
          </p>
          {activeYear && settingsTab === "academic" && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
              <span className="text-xs uppercase tracking-wide">Active year</span>
              <span className="font-semibold">{activeYear.label}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
          <nav className="flex flex-nowrap items-center gap-1.5 overflow-x-auto rounded-md bg-white p-1 shadow-sm sm:gap-2">
            <button
              type="button"
              onClick={() => setSettingsTab("school")}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${settingsTab === "school" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              School
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab("academic")}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${settingsTab === "academic" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Academic
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab("grading")}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${settingsTab === "grading" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Grading
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab("archives")}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap ${settingsTab === "archives" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Archives
            </button>
          </nav>

          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              if (
                !confirm(
                  "Resetting the app will permanently clear all application data, including archives. Continue?"
                )
              ) {
                return;
              }

              startTransition(async () => {
                const res = await resetAppData();
                if (res.success) {
                  toast.success("All application data has been reset.");
                  router.refresh();
                } else {
                  toast.error(res.error || "Could not reset application data.");
                }
              });
            }}
            className="shrink-0 rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
          >
            Reset app data
          </button>
        </div>
      </header>

      {settingsTab === "grading" ? (
        <GradingSystemSection entries={gradingEntries} levels={gradingLevels} />
      ) : settingsTab === "school" ? (
        <section className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-sm p-5 md:p-6 shadow-sm ring-1 ring-slate-200/80">
          <h2 className="mb-4 text-base font-semibold text-slate-800 sm:text-lg">School details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">School name</span>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="School name"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Email address</span>
              <input
                type="email"
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                placeholder="contact@school.edu"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Telephone</span>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={schoolTelephone}
                onChange={(e) => setSchoolTelephone(e.target.value)}
                placeholder="+233 123 456 789"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Location</span>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2"
                value={schoolLocation}
                onChange={(e) => setSchoolLocation(e.target.value)}
                placeholder="City, Region"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Address</span>
              <textarea
                className="min-h-[90px] rounded-lg border border-slate-200 px-3 py-2"
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                placeholder="Street address, city, region"
              />
            </label>
            <div className="md:col-span-2 flex flex-col gap-2 text-sm">
              <span className="text-slate-600">School logo</span>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label
                  htmlFor="school-logo-upload"
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                  Upload logo
                </label>
                <input
                  id="school-logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <span className="text-xs text-slate-500">
                  {schoolLogoUrl ? "New logo selected and ready to save." : "No logo selected yet."}
                </span>
              </div>
            </div>
          </div>

          {schoolLogoUrl ? (
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-white p-2 shadow-sm">
                <Image
                  src={schoolLogoUrl}
                  alt="School logo preview"
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="text-sm text-slate-600">Logo preview</p>
            </div>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={handleSaveSchoolSettings}
            className="mt-6 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:from-slate-800 hover:to-black disabled:opacity-50"
          >
            Save school details
          </button>
        </section>
      ) : settingsTab === "academic" ? (
        <>
      <section className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm ring-1 ring-slate-200/60">
        <h2 className="mb-4 text-base font-semibold text-slate-800 sm:text-lg">
          {editingAcademicYearId ? "Edit academic year" : "Create academic year"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">Academic year label</span>
            <input
              className="rounded-lg border border-slate-200 px-3 py-2"
              placeholder="e.g. 2025-2026"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-600">Number of terms</span>
            <select
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={numberOfTerms}
              onChange={(e) => syncTermRows(parseInt(e.target.value, 10))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Terms (working days, holidays & dates)
          </h3>
          <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2 sm:grid-cols-2">
            {terms.map((term, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <p className="text-xs font-semibold uppercase text-sky-600 mb-3">
                  Term {index + 1}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    Working days
                    <input
                      type="number"
                      min={1}
                      readOnly
                      className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-sm"
                      value={term.days}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    Weeks
                    <input
                      type="number"
                      min={1}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={term.weeks}
                      onChange={(e) =>
                        updateTerm(
                          index,
                          "weeks",
                          parseInt(e.target.value, 10) || 1
                        )
                      }
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label className="flex flex-col gap-1 text-xs text-slate-500">
                    Holidays
                    <input
                      type="number"
                      min={0}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={term.holidays}
                      onChange={(e) =>
                        updateTerm(
                          index,
                          "holidays",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                    />
                  </label>
                  <div className="flex items-end text-[11px] text-slate-500">
                    <span className="rounded-lg border border-dashed border-slate-200 bg-white px-2 py-1.5">
                      {calculateTermDays(term.startDate, term.endDate, Number(term.holidays) || 0)} days
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-slate-500">
                    Start date
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={term.startDate}
                      onChange={(e) =>
                        updateTerm(index, "startDate", e.target.value)
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    End date
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={term.endDate}
                      onChange={(e) =>
                        updateTerm(index, "endDate", e.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={setAsActive}
            onChange={(e) => setSetAsActive(e.target.checked)}
            className="rounded"
          />
          Set as active academic year
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={handleCreate}
            className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:from-slate-800 hover:to-black disabled:opacity-50"
          >
            {editingAcademicYearId ? "Save changes" : "Save academic year"}
          </button>
          {editingAcademicYearId && (
            <button
              type="button"
              disabled={pending}
              onClick={refreshAcademicYearForm}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel edit
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm ring-1 ring-slate-200/60">
        <h2 className="mb-4 text-base font-semibold text-slate-800 sm:text-lg">Academic years</h2>
        {academicYears.length === 0 ? (
          <p className="text-sm text-slate-500">No academic years configured yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {academicYears.map((year) => (
              <div
                key={year.id}
                className={`rounded-xl border p-4 ${
                  year.isArchived
                    ? "border-amber-200 bg-amber-50/50"
                    : year.isActive
                      ? "border-sky-200 bg-sky-50/50"
                      : "border-slate-200 bg-slate-50/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-800">
                        {year.label}
                      </h3>
                      {year.isActive && !year.isArchived && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                          Active
                        </span>
                      )}
                      {year.isArchived && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {year.numberOfTerms} term
                      {year.numberOfTerms !== 1 ? "s" : ""}
                    </p>
                    {year.archivedAt && (
                      <p className="text-xs text-amber-700 mt-1">
                        Archived {new Date(year.archivedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {!year.isArchived && !year.isActive && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleSetActive(year.id)}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                      >
                        Set active
                      </button>
                    )}
                    {!year.isArchived && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => openArchiveYearOptions(year.id, year.label)}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                      >
                        Archive records
                      </button>
                    )}
                  </div>
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-slate-600">
                  {year.terms.map((t) => (
                    <li
                      key={t.termNumber}
                      className="rounded-lg bg-white/80 px-3 py-2 border border-slate-100"
                    >
                      <span className="font-medium text-slate-700">
                        Term {t.termNumber}
                      </span>
                      <span className="block text-slate-500 mt-0.5">
                        {t.days} days · {t.weeks} weeks
                      </span>
                      <span className="block mt-0.5">
                        {new Date(t.startDate).toLocaleDateString()} –{" "}
                        {new Date(t.endDate).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
      ) : (
        <>
      <section className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm ring-1 ring-slate-200/60">
        <h2 className="mb-4 text-base font-semibold text-slate-800 sm:text-lg">Archive individuals</h2>
        <p className="text-sm text-slate-600 mb-4">Archive records for a teacher who has left or a student who has completed/left.</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium text-slate-700">Archive teacher records</p>
            <p className="text-xs text-slate-500 mb-3">Select a teacher to archive related records (attendance, exams, assignments, results).</p>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 mb-3"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">Select a teacher</option>
              {teachers?.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.surname}</option>
              ))}
            </select>
            <div className="grid gap-2 text-sm text-slate-600 mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={archiveTeacherSelection.attendance}
                  onChange={(e) =>
                    setArchiveTeacherSelection((prev) => ({
                      ...prev,
                      attendance: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Attendance
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={archiveTeacherSelection.exams}
                  onChange={(e) =>
                    setArchiveTeacherSelection((prev) => ({
                      ...prev,
                      exams: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Exams
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={archiveTeacherSelection.assignments}
                  onChange={(e) =>
                    setArchiveTeacherSelection((prev) => ({
                      ...prev,
                      assignments: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Assignments
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={archiveTeacherSelection.results}
                  onChange={(e) =>
                    setArchiveTeacherSelection((prev) => ({
                      ...prev,
                      results: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Results
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!selectedTeacher || pending}
                onClick={handleArchiveTeacher}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Archive teacher records
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium text-slate-700">Archive student records</p>
            <p className="text-xs text-slate-500 mb-3">Select a student to archive attendance and results.</p>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 mb-3"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Select a student</option>
              {students?.map((s) => (
                <option key={s.id} value={s.id}>{s.name} {s.surname}</option>
              ))}
            </select>
            <div className="grid gap-2 text-sm text-slate-600 mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={archiveStudentSelection.attendance}
                  onChange={(e) =>
                    setArchiveStudentSelection((prev) => ({
                      ...prev,
                      attendance: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Attendance
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={archiveStudentSelection.results}
                  onChange={(e) =>
                    setArchiveStudentSelection((prev) => ({
                      ...prev,
                      results: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Results
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!selectedStudent || pending}
                onClick={handleArchiveStudent}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Archive student records
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium text-slate-700">Archive parent records</p>
            <p className="text-xs text-slate-500 mb-3">Select a parent to archive related records.</p>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 mb-3"
              value={selectedParent}
              onChange={(e) => setSelectedParent(e.target.value)}
            >
              <option value="">Select a parent</option>
              {parents?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.surname}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!selectedParent || pending}
                onClick={handleArchiveParent}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Archive parent records
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm ring-1 ring-slate-200/60">
        <h2 className="mb-4 text-base font-semibold text-slate-800 sm:text-lg">Currently archived records</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs uppercase text-slate-500">Fee schedules</p>
            <p className="mt-2 text-lg font-semibold">{archivedCounts.feeSchedules}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs uppercase text-slate-500">Attendance</p>
            <p className="mt-2 text-lg font-semibold">{archivedCounts.attendance}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs uppercase text-slate-500">Exam records</p>
            <p className="mt-2 text-lg font-semibold">{archivedCounts.exams}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs uppercase text-slate-500">Assignments</p>
            <p className="mt-2 text-lg font-semibold">{archivedCounts.assignments}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs uppercase text-slate-500">Events</p>
            <p className="mt-2 text-lg font-semibold">{archivedCounts.events}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="text-xs uppercase text-slate-500">Announcements</p>
            <p className="mt-2 text-lg font-semibold">{archivedCounts.announcements}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 sm:col-span-3">
            <p className="text-xs uppercase text-slate-500">Results</p>
            <p className="mt-2 text-lg font-semibold">{archivedCounts.results}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm ring-1 ring-slate-200/60">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="mb-1 text-base font-semibold text-slate-800 sm:text-lg">Archived academic years</h2>
            <p className="text-sm text-slate-600">View academic years that are archived and unarchive them when needed.</p>
          </div>
        </div>
        {academicYears.filter((year) => year.isArchived).length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">No archived academic years found.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {academicYears
              .filter((year) => year.isArchived)
              .map((year) => (
                <div key={year.id} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{year.label}</h3>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Archived
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {year.numberOfTerms} term{year.numberOfTerms !== 1 ? "s" : ""}
                      </p>
                      {year.archivedAt && (
                        <p className="text-xs text-amber-700 mt-1">
                          Archived {new Date(year.archivedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleUnarchiveYear(year.id)}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                      >
                        Unarchive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {archiveOptionsYearId !== null && (
        <section className="rounded-2xl border border-sky-200 bg-sky-50/80 p-5 md:p-6 shadow-sm ring-1 ring-slate-200/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800 sm:text-lg">Archive options</h2>
              <p className="text-sm text-slate-600">
                Choose which record types to archive for {archiveYearLabel}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setArchiveOptionsYearId(null)}
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Object.entries(archiveYearSelection).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    setArchiveYearSelection((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={() => archiveOptionsYearId !== null && handleArchiveSelectedYear(archiveOptionsYearId)}
            className="mt-4 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            Archive selected year records
          </button>
        </section>
      )}

      <section className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-sm p-5 md:p-6 shadow-sm ring-1 ring-slate-200/80">
        <h2 className="text-lg font-medium text-slate-800 mb-4">
          Academic years & archive
        </h2>
        {academicYears.length === 0 ? (
          <p className="text-sm text-slate-500">No academic years configured yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {academicYears.map((year) => (
              <div
                key={year.id}
                className={`rounded-xl border p-4 ${
                  year.isArchived
                    ? "border-amber-200 bg-amber-50/50"
                    : year.isActive
                      ? "border-sky-200 bg-sky-50/50"
                      : "border-slate-200 bg-slate-50/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-800">
                        {year.label}
                      </h3>
                      {year.isActive && !year.isArchived && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                          Active
                        </span>
                      )}
                      {year.isArchived && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {year.numberOfTerms} term
                      {year.numberOfTerms !== 1 ? "s" : ""}
                    </p>
                    {year.archivedAt && (
                      <p className="text-xs text-amber-700 mt-1">
                        Archived {new Date(year.archivedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {!year.isArchived && !year.isActive && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleSetActive(year.id)}
                        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                      >
                        Set active
                      </button>
                    )}
                    {!year.isArchived && (
                      <>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => startEditingAcademicYear(year)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => openArchiveYearOptions(year.id, year.label)}
                          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                        >
                          Archive records
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleDeleteAcademicYear(year.id)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-slate-600">
                  {year.terms.map((t) => (
                    <li
                      key={t.termNumber}
                      className="rounded-lg bg-white/80 px-3 py-2 border border-slate-100"
                    >
                      <span className="font-medium text-slate-700">
                        Term {t.termNumber}
                      </span>
                      <span className="block text-slate-500 mt-0.5">
                        {t.days} working days · {t.holidays ?? 0} holidays · {t.weeks} weeks
                      </span>
                      <span className="block mt-0.5">
                        {new Date(t.startDate).toLocaleDateString()} –{" "}
                        {new Date(t.endDate).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}
