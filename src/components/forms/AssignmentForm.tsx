"use client";

import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useRouter } from "next/navigation";

type LessonOption = {
  id: number;
  name: string;
  subjectId: number;
  classId: number;
  teacherId: string;
  subject: { name: string };
  class: { name: string };
};

type Meta = {
  subjects: { id: number; name: string }[];
  classes: { id: number; name: string }[];
  teachers: { id: string; name: string; surname: string }[];
  lessons: LessonOption[];
  currentUserId?: string;
  role?: string;
};

type AssignmentFormProps = {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const AssignmentForm = ({ type, data, setOpen }: AssignmentFormProps) => {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    subjectId: 0,
    classId: 0,
    teacherId: "",
    title: "",
    questions: "",
    startDate: "",
    dueDate: "",
  });
  const router = useRouter();
  const isEditing = type === "update" && data;

  useEffect(() => {
    let active = true;
    fetch("/api/assignments/meta")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load your assignment options.");
        return response.json();
      })
      .then((result: Meta) => {
        if (!active) return;
        setMeta(result);
        if (isEditing) {
          setForm({
            subjectId: data.lesson?.subject?.id ?? 0,
            classId: data.lesson?.class?.id ?? 0,
            teacherId: data.lesson?.teacher?.id ?? "",
            title: data.title ?? "",
            questions: data.questions ?? "",
            startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : "",
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 10) : "",
          });
        } else {
          setForm((current) => ({ ...current, teacherId: result.currentUserId ?? "" }));
        }
      })
      .catch((fetchError: unknown) => {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "Unable to load assignment options.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [data, isEditing]);

  const availableSubjects = useMemo(() => {
    if (!meta || meta.role === "admin" || !form.classId) return meta?.subjects ?? [];
    const ids = new Set(
      meta.lessons.filter((lesson) => lesson.classId === form.classId).map((lesson) => lesson.subjectId)
    );
    return meta.subjects.filter((subject) => ids.has(subject.id));
  }, [form.classId, meta]);

  const availableClasses = useMemo(() => {
    if (!meta || meta.role === "admin" || !form.subjectId) return meta?.classes ?? [];
    const ids = new Set(
      meta.lessons.filter((lesson) => lesson.subjectId === form.subjectId).map((lesson) => lesson.classId)
    );
    return meta.classes.filter((schoolClass) => ids.has(schoolClass.id));
  }, [form.subjectId, meta]);

  const selectedLesson = meta?.lessons.find(
    (lesson) =>
      lesson.subjectId === Number(form.subjectId) &&
      lesson.classId === Number(form.classId) &&
      (meta.role !== "admin" || lesson.teacherId === form.teacherId)
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!meta) return;
    setSaving(true);
    setError(null);

    try {
      if (!isEditing && !selectedLesson) {
        setError("Choose a class and subject assigned to you.");
        return;
      }

      const payload = {
        ...(isEditing ? {} : { lessonId: selectedLesson!.id }),
        title: form.title.trim(),
        questions: form.questions.trim() || null,
        startDate: form.startDate,
        dueDate: form.dueDate,
      };
      const response = await fetch(
        isEditing ? `/api/assignments/${data.id}` : "/api/assignments",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "Unable to save the assignment.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (submitError) {
      console.error("Assignment form submission failed:", submitError);
      setError("Unable to save the assignment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading assignment options…</div>;
  }

  if (!meta) {
    return <div className="p-6 text-sm text-rose-700">{error || "Assignment options are unavailable."}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <div className="border-b border-slate-200 pb-5 pr-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
          {isEditing ? "Assignment details" : "Classroom"}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {isEditing ? "Update assignment" : "Create an assignment"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEditing
            ? "Keep instructions and due dates clear for students."
            : "Set the class, subject, instructions, and dates students need."}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Class</p>
            <p className="mt-1 font-semibold text-slate-900">{data.lesson?.class?.name ?? "Class"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Subject</p>
            <p className="mt-1 font-semibold text-slate-900">{data.lesson?.subject?.name ?? "Subject"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Teacher</p>
            <p className="mt-1 font-semibold text-slate-900">
              {data.lesson?.teacher
                ? `${data.lesson.teacher.name} ${data.lesson.teacher.surname}`
                : "Teacher"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Subject</span>
            <select
              value={form.subjectId}
              onChange={(event) =>
                setForm((current) => ({ ...current, subjectId: Number(event.target.value), classId: 0 }))
              }
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value={0}>Select a subject</option>
              {meta.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Class</span>
            <select
              value={form.classId}
              onChange={(event) => setForm((current) => ({ ...current, classId: Number(event.target.value) }))}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value={0}>Select a class</option>
              {availableClasses.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
              ))}
            </select>
          </label>

          {meta.role === "admin" && (
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Teacher</span>
              <select
                value={form.teacherId}
                onChange={(event) => setForm((current) => ({ ...current, teacherId: event.target.value }))}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select a teacher</option>
                {meta.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name} {teacher.surname}</option>
                ))}
              </select>
            </label>
          )}

          {form.classId > 0 && form.subjectId > 0 && !selectedLesson && (
            <p className="text-sm text-amber-700 sm:col-span-2">
              No matching lesson is assigned for this class and subject.
            </p>
          )}
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Assignment title</span>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="e.g. Fractions practice"
          maxLength={120}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Available from</span>
          <input
            type="date"
            value={form.startDate}
            onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Due date</span>
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Instructions</span>
        <textarea
          value={form.questions}
          onChange={(event) => setForm((current) => ({ ...current, questions: event.target.value }))}
          placeholder="Explain what students need to complete…"
          rows={5}
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || (!isEditing && !selectedLesson)}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : isEditing ? "Save changes" : "Create assignment"}
        </button>
      </div>
    </form>
  );
};

export default AssignmentForm;
