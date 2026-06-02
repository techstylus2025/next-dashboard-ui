"use client";

import { useEffect, useState } from "react";
import InputField from "@/components/InputField";
import { createLesson, updateLesson, LessonInput } from "@/lib/lessonActions";

type LessonOption = {
  id: number;
  name: string;
};

type TeacherOption = {
  id: string;
  name: string;
  surname: string;
};

type LessonFormProps = {
  lesson?: {
    id: number;
    name: string;
    day: string;
    startTime: string | Date;
    endTime: string | Date;
    subjectId: number;
    classId: number;
    teacherId: string;
  };
  teachers: TeacherOption[];
  subjects: LessonOption[];
  classes: LessonOption[];
  onSuccess?: () => void;
};

const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const parseLessonDate = (value: string | Date): Date => new Date(value);

const LessonForm = ({
  lesson,
  teachers,
  subjects,
  classes,
  onSuccess,
}: LessonFormProps) => {
  const getLessonTime = (dateValue: string | Date, defaultValue: string) => {
    if (!dateValue) return defaultValue;
    const date = parseLessonDate(dateValue);
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  const [formData, setFormData] = useState<LessonInput>({
    name: lesson?.name || "",
    day: lesson?.day || "MONDAY",
    startTime: lesson
      ? getLessonTime(lesson.startTime, "08:00")
      : "08:00",
    endTime: lesson
      ? getLessonTime(lesson.endTime, "09:00")
      : "09:00",
    subjectId: lesson?.subjectId || 0,
    classId: lesson?.classId || 0,
    teacherId: lesson?.teacherId || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lesson) {
      setFormData({
        name: "",
        day: "MONDAY",
        startTime: "08:00",
        endTime: "09:00",
        subjectId: 0,
        classId: 0,
        teacherId: "",
      });
      return;
    }

    setFormData({
      name: lesson.name,
      day: lesson.day,
      startTime: getLessonTime(lesson.startTime, "08:00"),
      endTime: getLessonTime(lesson.endTime, "09:00"),
      subjectId: lesson.subjectId,
      classId: lesson.classId,
      teacherId: lesson.teacherId,
    });
  }, [lesson]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "subjectId" || name === "classId" ? Number(value) : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (
        !formData.name ||
        !formData.day ||
        !formData.startTime ||
        !formData.endTime ||
        !formData.subjectId ||
        !formData.classId ||
        !formData.teacherId
      ) {
        setError("All fields are required");
        setLoading(false);
        return;
      }

      const [startHours, startMins] = formData.startTime.split(":").map(Number);
      const [endHours, endMins] = formData.endTime.split(":").map(Number);
      const startTotalMins = startHours * 60 + startMins;
      const endTotalMins = endHours * 60 + endMins;

      if (endTotalMins <= startTotalMins) {
        setError("End time must be after start time");
        setLoading(false);
        return;
      }

      let result;
      if (lesson) {
        result = await updateLesson({ ...formData, id: lesson.id });
      } else {
        result = await createLesson(formData);
      }

      if (result.success) {
        setFormData({
          name: "",
          day: "MONDAY",
          startTime: "08:00",
          endTime: "09:00",
          subjectId: 0,
          classId: 0,
          teacherId: "",
        });
        onSuccess?.();
      } else {
        setError(result.error || "Failed to save lesson");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Lesson Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Mathematics Class 1A"
          required
        />

        <div>
          <label className="input-label block mb-2">Day of Week</label>
          <select
            name="day"
            value={formData.day}
            onChange={handleChange}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          >
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <InputField
          label="Start Time"
          name="startTime"
          type="time"
          value={formData.startTime}
          onChange={handleChange}
          required
        />

        <InputField
          label="End Time"
          name="endTime"
          type="time"
          value={formData.endTime}
          onChange={handleChange}
          required
        />

        <div>
          <label className="input-label block mb-2">Subject</label>
          <select
            name="subjectId"
            value={formData.subjectId}
            onChange={handleChange}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            required
          >
            <option value={0}>Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label block mb-2">Class</label>
          <select
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            required
          >
            <option value={0}>Select a class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label block mb-2">Teacher</label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            required
          >
            <option value="">Select a teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} {teacher.surname}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full md:w-auto"
      >
        {loading ? "Saving..." : lesson ? "Update Lesson" : "Create Lesson"}
      </button>
    </form>
  );
};

export default LessonForm;
