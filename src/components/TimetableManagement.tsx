"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LessonForm from "@/components/forms/LessonForm";
import { deleteLesson } from "@/lib/lessonActions";

type LessonItem = {
  id: number;
  name: string;
  day: string;
  startTime: string | Date;
  endTime: string | Date;
  subject: { id: number; name: string };
  class: { id: number; name: string };
  teacher: { id: string; name: string; surname: string };
};

type LessonOption = {
  id: number;
  name: string;
};

type TeacherOption = {
  id: string;
  name: string;
  surname: string;
};

type TimetableManagementProps = {
  lessons: LessonItem[];
  teachers: TeacherOption[];
  subjects: LessonOption[];
  classes: LessonOption[];
};

const parseDate = (value: string | Date) => new Date(value);

const TimetableManagement = ({
  lessons,
  teachers,
  subjects,
  classes,
}: TimetableManagementProps) => {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  const toggleDay = (day: string) => {
    setExpandedDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day]
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    setLoading(true);
    const result = await deleteLesson(id);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to delete lesson");
    }
    setLoading(false);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLesson(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    router.refresh();
  };

  const dayOrder: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
  };

  const groupedByDay = lessons.reduce((acc, lesson) => {
    const day = lesson.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(lesson);
    return acc;
  }, {} as Record<string, LessonItem[]>);

  const sortedDays = Object.keys(groupedByDay).sort(
    (a, b) => (dayOrder[a] || 0) - (dayOrder[b] || 0)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Timetable Management</h2>
        {!showForm && (
          <button
            onClick={() => {
              setEditingLesson(null);
              setShowForm(true);
            }}
            className="bg-lamaSky hover:bg-blue-300 text-slate-900 px-4 py-2 rounded-md hover:text-slate-900 text-sm"
          >
            + Add Lesson
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">
              {editingLesson ? "Edit Lesson" : "Add New Lesson"}
            </h3>
            <button
              onClick={handleFormClose}
              className="text-slate-600 hover:text-slate-800"
            >
              ✕
            </button>
          </div>
          <LessonForm
            lesson={editingLesson
              ? {
                  ...editingLesson,
                  subjectId: editingLesson.subject?.id ?? 0,
                  classId: editingLesson.class?.id ?? 0,
                  teacherId: editingLesson.teacher?.id ?? "",
                }
              : undefined}
            teachers={teachers}
            subjects={subjects}
            classes={classes}
            onSuccess={handleFormSuccess}
          />
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <p className="text-slate-600">No lessons created yet.</p>
          <p className="text-slate-600 text-sm mt-2">
            Click "Add Lesson" to create your first lesson.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDays.map((day) => {
            const isExpanded = expandedDays.includes(day);
            const lessonsForDay = groupedByDay[day]
              .slice()
              .sort((a, b) => parseDate(a.startTime).getTime() - parseDate(b.startTime).getTime());

            return (
              <div key={day} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-600">{day}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {lessonsForDay.length} lesson{lessonsForDay.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className={`text-slate-500 text-xl transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>

                <div
                  className={
                    "overflow-hidden transition-all duration-300 " +
                    (isExpanded ? "max-h-[2000px]" : "max-h-0")
                  }
                >
                  <div className="px-4 pb-4 pt-2 space-y-2">
                    {lessonsForDay.map((lesson) => {
                      const start = parseDate(lesson.startTime);
                      const end = parseDate(lesson.endTime);
                      return (
                        <div
                          key={lesson.id}
                          className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {lesson.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {(lesson.subject?.name ?? "Unknown subject")} • {(lesson.class?.name ?? "Unknown class")}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 md:text-right">
                              <span>{lesson.teacher ? `${lesson.teacher.name} ${lesson.teacher.surname}` : "Unknown teacher"}</span>
                              <span>•</span>
                              <span>{String(start.getHours()).padStart(2, "0")}:{String(start.getMinutes()).padStart(2, "0")} - {String(end.getHours()).padStart(2, "0")}:{String(end.getMinutes()).padStart(2, "0")}</span>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingLesson(lesson);
                                setShowForm(true);
                              }}
                              className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(lesson.id)}
                              disabled={loading}
                              className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:bg-slate-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;
