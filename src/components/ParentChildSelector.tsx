"use client";

import { useState, useEffect } from "react";
import ScheduleCalendar from "./ScheduleCalendar";
import { Student } from "@prisma/client";

interface StudentWithClass extends Student {
  class: { id: number; name: string } | null;
}

export default function ParentChildSelector({
  students,
}: {
  students: StudentWithClass[];
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id ?? ""
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  return (
    <>
      {/* Header with Student Info */}
      <header className="mb-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Schedule
            </p>
            <h1 className="text-2xl font-semibold text-slate-950">
              {selectedStudent
                ? `${selectedStudent.name} ${selectedStudent.surname}`
                : "My children"}
            </h1>
          </div>
          {selectedStudent?.class && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              {selectedStudent.class.name}
            </span>
          )}
        </div>

        {/* Child Selector Buttons */}
        {students.length > 1 && (
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Switch child
            </label>
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`rounded-full border-2 px-3 py-2 text-sm font-medium shadow-sm transition cursor-pointer ${
                    selectedStudentId === student.id
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                      : "border-slate-300 bg-white text-slate-700 hover:border-indigo-500 hover:bg-indigo-50"
                  }`}
                >
                  {student.name} {student.surname}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subtitle */}
        {students.length > 1 ? (
          <p className="text-sm text-slate-500">
            {students.length} child{students.length === 1 ? "" : "ren"} enrolled.
            Click above to view their schedule.
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            Lessons are shown for your student's class and subject schedule.
          </p>
        )}
      </header>

      {/* Calendar */}
      {selectedStudent?.class ? (
        <ScheduleCalendar type="classId" id={selectedStudent.class.id} />
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No class schedule available for your student yet.
        </div>
      )}
    </>
  );
}
