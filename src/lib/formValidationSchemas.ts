import { z } from "zod";

export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity name is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
  gradingLevel: z
    .enum(["CRECHE", "KINDERGARTEN", "PRIMARY", "JHS"])
    .optional()
    .default("PRIMARY"),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;

export const examTimetableSchema = z.object({
  gradingLevel: z
    .enum(["CRECHE", "KINDERGARTEN", "PRIMARY", "JHS"], {
      errorMap: () => ({ message: "Grading level is required!" }),
    })
    .optional()
    .default("PRIMARY"),
  classIds: z
    .array(z.string())
    .min(1, { message: "At least one class is required!" })
    .transform((ids) => ids.map(Number)),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
  date: z
    .string()
    .min(1, { message: "Exam date is required!" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Exam date is invalid!" }),
  startTime: z
    .string()
    .min(1, { message: "Start time is required!" })
    .regex(/^\d{2}:\d{2}$/, { message: "Start time is invalid!" }),
  endTime: z
    .string()
    .min(1, { message: "End time is required!" })
    .regex(/^\d{2}:\d{2}$/, { message: "End time is invalid!" }),
  title: z.string().min(1, { message: "Title is required!" }),
});

export type ExamTimetableSchema = z.infer<typeof examTimetableSchema>;

export const examQuestionUploadSchema = z.object({
  title: z.string().min(1, { message: "Upload title is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }).min(1, { message: "Lesson is required!" }),
});

export type ExamQuestionUploadSchema = z.infer<typeof examQuestionUploadSchema>;

export const parentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().min(1, { message: "Phone is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
});

export type ParentSchema = z.infer<typeof parentSchema>;

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  img: z.string().optional().or(z.literal("")),
});

export type ProfileSchema = z.infer<typeof profileSchema>;

export const attendanceSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.coerce.number().optional(),
    type: z.literal("student"),
    date: z.string().min(1, { message: "Date is required!" }),
    present: z.enum(["true", "false"]),
    studentId: z.string().min(1, { message: "Student is required!" }),
    teacherId: z.string().optional(),
  }),
  z.object({
    id: z.coerce.number().optional(),
    type: z.literal("teacher"),
    date: z.string().min(1, { message: "Date is required!" }),
    present: z.enum(["true", "false"]),
    teacherId: z.string().min(1, { message: "Teacher is required!" }),
    studentId: z.string().optional(),
  }),
]);

export type AttendanceSchema = z.infer<typeof attendanceSchema>;
