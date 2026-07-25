"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceSchema = exports.profileSchema = exports.parentSchema = exports.examQuestionUploadSchema = exports.examTimetableSchema = exports.examSchema = exports.studentSchema = exports.teacherSchema = exports.classSchema = exports.subjectSchema = void 0;
var zod_1 = require("zod");
exports.subjectSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().optional(),
    name: zod_1.z.string().min(1, { message: "Subject name is required!" }),
    teachers: zod_1.z.array(zod_1.z.string()), //teacher ids
});
exports.classSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().optional(),
    name: zod_1.z.string().min(1, { message: "Subject name is required!" }),
    capacity: zod_1.z.coerce.number().min(1, { message: "Capacity name is required!" }),
    gradeId: zod_1.z.coerce.number().min(1, { message: "Grade name is required!" }),
    supervisorId: zod_1.z.coerce.string().optional(),

});
exports.teacherSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    username: zod_1.z
        .string()
        .min(3, { message: "Username must be at least 3 characters long!" })
        .max(20, { message: "Username must be at most 20 characters long!" }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long!" })
        .optional()
        .or(zod_1.z.literal("")),
    name: zod_1.z.string().min(1, { message: "First name is required!" }),
    surname: zod_1.z.string().min(1, { message: "Last name is required!" }),
    email: zod_1.z
        .string()
        .email({ message: "Invalid email address!" })
        .optional()
        .or(zod_1.z.literal("")),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string(),
    img: zod_1.z.string().optional(),
    bloodType: zod_1.z.string().min(1, { message: "Blood Type is required!" }),
    birthday: zod_1.z.coerce.date({ message: "Birthday is required!" }),
    sex: zod_1.z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
    subjects: zod_1.z.array(zod_1.z.string()).optional(), // subject ids
});
exports.studentSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    username: zod_1.z
        .string()
        .min(3, { message: "Username must be at least 3 characters long!" })
        .max(20, { message: "Username must be at most 20 characters long!" }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long!" })
        .optional()
        .or(zod_1.z.literal("")),
    name: zod_1.z.string().min(1, { message: "First name is required!" }),
    surname: zod_1.z.string().min(1, { message: "Last name is required!" }),
    email: zod_1.z
        .string()
        .email({ message: "Invalid email address!" })
        .optional()
        .or(zod_1.z.literal("")),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string(),
    img: zod_1.z.string().optional(),
    bloodType: zod_1.z.string().min(1, { message: "Blood Type is required!" }),
    birthday: zod_1.z.coerce.date({ message: "Birthday is required!" }),
    sex: zod_1.z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
    gradeId: zod_1.z.coerce.number().min(1, { message: "Grade is required!" }),
    classId: zod_1.z.coerce.number().min(1, { message: "Class is required!" }),
    parentId: zod_1.z.string().min(1, { message: "Parent is required!" }),
});
exports.examSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().optional(),
    title: zod_1.z.string().min(1, { message: "Title name is required!" }),
    startTime: zod_1.z.coerce.date({ message: "Start time is required!" }),
    endTime: zod_1.z.coerce.date({ message: "End time is required!" }),
    lessonId: zod_1.z.coerce.number({ message: "Lesson is required!" }),
});
exports.examTimetableSchema = zod_1.z.object({
    gradingLevel: zod_1.z
        .enum(["CRECHE", "NURSERY", "KINDERGARTEN", "PRIMARY", "JHS"], {
        errorMap: function () { return ({ message: "Grading level is required!" }); },
    })
        .optional()
        .default("PRIMARY"),
    classIds: zod_1.z
        .array(zod_1.z.string())
        .min(1, { message: "At least one class is required!" })
        .transform(function (ids) { return ids.map(Number); }),
    lessonId: zod_1.z.coerce.number({ message: "Lesson is required!" }),
    date: zod_1.z
        .string()
        .min(1, { message: "Exam date is required!" })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Exam date is invalid!" }),
    startTime: zod_1.z
        .string()
        .min(1, { message: "Start time is required!" })
        .regex(/^\d{2}:\d{2}$/, { message: "Start time is invalid!" }),
    endTime: zod_1.z
        .string()
        .min(1, { message: "End time is required!" })
        .regex(/^\d{2}:\d{2}$/, { message: "End time is invalid!" }),
    title: zod_1.z.string().min(1, { message: "Title is required!" }),
});
exports.examQuestionUploadSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: "Upload title is required!" }),
    lessonId: zod_1.z.coerce.number({ message: "Lesson is required!" }).min(1, { message: "Lesson is required!" }),
});
exports.parentSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    username: zod_1.z
        .string()
        .min(3, { message: "Username must be at least 3 characters long!" })
        .max(20, { message: "Username must be at most 20 characters long!" }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long!" })
        .optional()
        .or(zod_1.z.literal("")),
    name: zod_1.z.string().min(1, { message: "First name is required!" }),
    surname: zod_1.z.string().min(1, { message: "Last name is required!" }),
    email: zod_1.z
        .string()
        .email({ message: "Invalid email address!" })
        .optional()
        .or(zod_1.z.literal("")),
    phone: zod_1.z.string().min(1, { message: "Phone is required!" }),
    address: zod_1.z.string().min(1, { message: "Address is required!" }),
});
exports.profileSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, { message: "Username must be at least 3 characters long!" })
        .max(20, { message: "Username must be at most 20 characters long!" }),
    password: zod_1.z
        .string()
        .min(8, { message: "Password must be at least 8 characters long!" })
        .optional()
        .or(zod_1.z.literal("")),
    img: zod_1.z.string().optional().or(zod_1.z.literal("")),
});
exports.attendanceSchema = zod_1.z.discriminatedUnion("type", [
    zod_1.z.object({
        id: zod_1.z.coerce.number().optional(),
        type: zod_1.z.literal("student"),
        date: zod_1.z.string().min(1, { message: "Date is required!" }),
        present: zod_1.z.enum(["true", "false"]),
        studentId: zod_1.z.string().min(1, { message: "Student is required!" }),
        teacherId: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        id: zod_1.z.coerce.number().optional(),
        type: zod_1.z.literal("teacher"),
        date: zod_1.z.string().min(1, { message: "Date is required!" }),
        present: zod_1.z.enum(["true", "false"]),
        teacherId: zod_1.z.string().min(1, { message: "Teacher is required!" }),
        studentId: zod_1.z.string().optional(),
    }),
]);
