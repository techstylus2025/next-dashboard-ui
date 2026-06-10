"use client";

import { useEffect, useState } from "react";
import InputField from "@/components/InputField";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

type Meta = {
  subjects: { id: number; name: string }[];
  classes: { id: number; name: string }[];
  teachers: { id: string; name: string; surname: string }[];
  lessons: { id: number; subjectId: number; classId: number; teacherId: string }[];
  currentUserId?: string;
  role?: string;
};

const AssignmentForm = ({ type, data, setOpen }: any) => {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ subjectId: 0, classId: 0, teacherId: "", questions: "", startDate: "", dueDate: "" });
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    fetch("/api/assignments/meta")
      .then((r) => r.json())
      .then((d) => setMeta(d))
      .catch((e) => setError("Failed to load form meta"));
  }, []);

  useEffect(() => {
    if (!meta) return;
    if (type === "update" && data) {
      // populate from data
      setForm({
        subjectId: data.lesson?.subject?.id || 0,
        classId: data.lesson?.class?.id || 0,
        teacherId: data.lesson?.teacher?.id || meta.currentUserId || "",
        questions: data.questions || data.title || "",
        startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : "",
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 10) : "",
      });
    } else {
      setForm((f) => ({ ...f, teacherId: meta.currentUserId || "" }));
    }
  }, [meta, type, data]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // find lesson matching subject/class/teacher
      const lesson = meta?.lessons.find((l) => l.subjectId === Number(form.subjectId) && l.classId === Number(form.classId) && l.teacherId === form.teacherId);
      if (!lesson) {
        setError("No lesson found for the selected subject/class/teacher. Create a lesson first.");
        setLoading(false);
        return;
      }

      const payload = {
        lessonId: lesson.id,
        title: "Assignment",
        questions: form.questions,
        startDate: form.startDate,
        dueDate: form.dueDate,
      };

      const res = await fetch(type === "update" && data ? `/api/assignments/${data.id}` : `/api/assignments`, {
        method: type === "update" && data ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) {
        setError(result.error || "Save failed");
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!meta) return <p className="p-4">{error || "Loading..."}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {error && <div className="text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="input-label block mb-2">Subject</label>
          <select name="subjectId" value={form.subjectId} onChange={handleChange} className="w-full p-2 rounded-md ring-1 ring-slate-200">
            <option value={0}>Select subject</option>
            {meta.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="input-label block mb-2">Class</label>
          <select name="classId" value={form.classId} onChange={handleChange} className="w-full p-2 rounded-md ring-1 ring-slate-200">
            <option value={0}>Select class</option>
            {meta.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="input-label block mb-2">Teacher</label>
          <select name="teacherId" value={form.teacherId} onChange={handleChange} className="w-full p-2 rounded-md ring-1 ring-slate-200" disabled={meta.role === "teacher"}>
            <option value="">Select teacher</option>
            {meta.teachers.map((t) => <option key={t.id} value={t.id}>{t.name} {t.surname}</option>)}
          </select>
        </div>

        <div>
          <label className="input-label block mb-2">Start Date</label>
          <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="w-full p-2 rounded-md ring-1 ring-slate-200" required />
        </div>

        <div>
          <label className="input-label block mb-2">Due Date</label>
          <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="w-full p-2 rounded-md ring-1 ring-slate-200" required />
        </div>

        <div className="md:col-span-2">
          <label className="input-label block mb-2">Questions / Instructions</label>
          <textarea name="questions" value={form.questions} onChange={handleChange} className="w-full p-3 rounded-md ring-1 ring-slate-200" rows={6} />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : type === "update" ? "Update Assignment" : "Create Assignment"}
        </button>
      </div>
    </form>
  );
};

export default AssignmentForm;
