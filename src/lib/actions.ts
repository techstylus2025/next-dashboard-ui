"use server";

import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { getActiveAcademicPeriod } from "./academicContext";

const PARENTS_PATH = "/list/parents";
import {
  ClassSchema,
  ExamSchema,
  ParentSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient, auth } from "@clerk/nextjs/server";

const getUserRole = async (
  userId: string | null,
  sessionClaims?: { metadata?: Record<string, unknown> }
) => {
  let role = sessionClaims?.metadata?.role as string | undefined;

  if (!role && userId) {
    try {
      const user = await clerkClient.users.getUser(userId);
      role = user.publicMetadata?.role as string | undefined;
    } catch (err) {
      console.log("Unable to read user role from Clerk metadata", err);
    }
  }

  return role;
};

type CurrentState = { success: boolean; error: boolean };

type AttendanceActionData = {
  id?: number;
  type: "student" | "teacher";
  date: string;
  present: string | boolean;
  studentId?: string;
  studentIds?: string[];
  teacherId?: string;
};

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"teacher"}
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const client = await clerkClient();
    await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const client = await clerkClient();
    await client.users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    const parent = await prisma.parent.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) {
      return { success: false, error: true };
    }

    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"student"}
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const client = await clerkClient();
    await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        ...(data.password !== "" && { password: data.password }),
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: data.parentId,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const client = await clerkClient();
    await client.users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.password || data.password.length < 8) {
    return { success: false, error: true };
  }
  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "parent" },
    });

    await prisma.parent.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });

    revalidatePath(PARENTS_PATH);
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const client = await clerkClient();
    await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.parent.update({
      where: { id: data.id },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });

    revalidatePath(PARENTS_PATH);
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteParent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const linked = await prisma.student.count({ where: { parentId: id } });
    if (linked > 0) {
      return { success: false, error: true };
    }

    const client = await clerkClient();
    await client.users.deleteUser(id);

    await prisma.parent.delete({
      where: { id },
    });

    revalidatePath(PARENTS_PATH);
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAttendance = async (
  currentState: CurrentState,
  data: AttendanceActionData
) => {
  const type = data.type;
  const dateValue = data.date || "";
  const present = data.present === "true" || data.present === true;
  const studentId = data.studentId || null;
  const teacherId = data.teacherId || null;

  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims as any);

  if (!userId || !type || !dateValue) {
    return { success: false, error: true };
  }

  try {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return { success: false, error: true };
    }

    if (type === "teacher") {
      if (role !== "admin") {
        return { success: false, error: true };
      }

      if (!teacherId) {
        return { success: false, error: true };
      }

      await prisma.attendance.create({
        data: {
          date: parsedDate,
          present,
          teacher: {
            connect: { id: teacherId },
          },
        },
      });
    } else {
      const selectedStudentIds =
        data.studentIds && data.studentIds.length > 0
          ? data.studentIds
          : studentId
          ? [studentId]
          : [];

      if (selectedStudentIds.length === 0) {
        return { success: false, error: true };
      }

      if (role === "teacher") {
        const supervised = await prisma.student.findMany({
          where: {
            id: { in: selectedStudentIds },
            class: {
              supervisorId: userId,
            },
          },
        });
        if (supervised.length !== selectedStudentIds.length) {
          return { success: false, error: true };
        }
      }

      if (selectedStudentIds.length === 1) {
        await prisma.attendance.create({
          data: {
            date: parsedDate,
            present,
            student: {
              connect: { id: selectedStudentIds[0] },
            },
          },
        });
      } else {
        await prisma.attendance.createMany({
          data: selectedStudentIds.map((selectedStudentId) => ({
            date: parsedDate,
            present,
            studentId: selectedStudentId,
          })),
        });
      }
    }

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateAttendance = async (
  currentState: CurrentState,
  data: AttendanceActionData
) => {
  if (!data.id) {
    return { success: false, error: true };
  }

  const type = data.type;
  const dateValue = data.date || "";
  const present = data.present === "true" || data.present === true;
  const studentId = data.studentId || null;
  const teacherId = data.teacherId || null;

  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims as any);

  if (!userId || !type || !dateValue) {
    return { success: false, error: true };
  }

  try {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return { success: false, error: true };
    }

    const existing = await prisma.attendance.findUnique({
      where: { id: data.id },
      include: { student: { select: { classId: true } } },
    });

    if (!existing) {
      return { success: false, error: true };
    }

    if (role === "teacher" && type === "teacher") {
      return { success: false, error: true };
    }

    if (role === "teacher" && type === "student") {
      const supervised = await prisma.student.findFirst({
        where: {
          id: studentId,
          class: {
            supervisorId: userId,
          },
        },
      });
      if (!supervised) {
        return { success: false, error: true };
      }
    }

    await prisma.attendance.update({
      where: { id: data.id },
      data: {
        date: parsedDate,
        present,
        studentId: type === "student" ? studentId : null,
        teacherId: type === "teacher" ? teacherId : null,
      },
    });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteAttendance = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  if (!id) {
    return { success: false, error: true };
  }

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    await prisma.attendance.delete({
      where: { id: Number(id) },
    });

    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExamTimetable = async (
  currentState: CurrentState,
  data: {
    gradingLevel?: string;
    classIds: number[];
    lessonId: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  }
) => {
  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims);

  if (role !== "admin") {
    return { success: false, error: true };
  }

  const startDate = new Date(`${data.date}T${data.startTime}:00`);
  const endDate = new Date(`${data.date}T${data.endTime}:00`);

  if (endDate < startDate) {
    return { success: false, error: true };
  }

  const activePeriod = await getActiveAcademicPeriod();
  if (!activePeriod.termStart || !activePeriod.termEnd) {
    return { success: false, error: true };
  }

  if (startDate < activePeriod.termStart || endDate > activePeriod.termEnd) {
    return { success: false, error: true };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: data.lessonId },
    include: { class: true },
  });

  if (!lesson || !data.classIds.includes(lesson.classId)) {
    return { success: false, error: true };
  }

  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: startDate,
        endTime: endDate,
        lessonId: data.lessonId,
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const uploadExamQuestion = async (data: {
  title: string;
  lessonId: number;
  file: File | Blob;
}) => {
  console.log("[uploadExamQuestion] Input data:", {
    title: data.title,
    lessonId: data.lessonId,
    lessonIdType: typeof data.lessonId,
    fileType: data.file?.constructor.name,
    fileSize: (data.file as any)?.size,
  });

  const title = data.title?.toString().trim();
  const lessonId = Number(data.lessonId);
  const file = data.file;
  const hasArrayBuffer = file && typeof (file as any).arrayBuffer === "function";

  console.log("[uploadExamQuestion] Parsed values:", {
    title,
    titleValid: Boolean(title),
    lessonId,
    lessonIdValid: lessonId > 0,
    fileExists: Boolean(file),
    hasArrayBuffer,
  });

  if (!title || lessonId <= 0 || !file) {
    return {
      success: false,
      error: true,
      message: `Missing required fields: title=${Boolean(title)}, lesson=${lessonId > 0}, file=${Boolean(file)}`,
    } as any;
  }

  if (!hasArrayBuffer) {
    return {
      success: false,
      error: true,
      message: "The selected file could not be uploaded. Please choose a valid document.",
    } as any;
  }

  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims);

  if (role !== "teacher") {
    return {
      success: false,
      error: true,
      message: "Only teachers may upload exam questions.",
    } as any;
  }

  const activePeriod = await getActiveAcademicPeriod();
  if (!activePeriod.yearLabel || activePeriod.termNumber === null) {
    return {
      success: false,
      error: true,
      message: "Exam question uploads are only allowed during an active academic term.",
    } as any;
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { class: true },
  });

  if (
    !lesson ||
    (lesson.teacherId !== userId && lesson.class.supervisorId !== userId)
  ) {
    return {
      success: false,
      error: true,
      message: "You are not authorized to upload questions for the selected lesson.",
    } as any;
  }

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "exam-questions");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeFileName = `${Date.now()}-${(file as File).name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFileName);
    const buffer = Buffer.from(await (file as any).arrayBuffer());
    await fs.writeFile(filePath, buffer);

    await prisma.examQuestionUpload.create({
      data: {
        title,
        fileName: (file as File).name,
        fileUrl: `/uploads/exam-questions/${safeFileName}`,
        lessonId,
        uploadedById: userId!,
        status: "PENDING",
        academicYearLabel: activePeriod.yearLabel,
        termNumber: activePeriod.termNumber,
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log("uploadExamQuestion error:", err);
    return {
      success: false,
      error: true,
      message: "An internal error occurred while uploading the file.",
    } as any;
  }
};

export const uploadLessonDocument = async (data: {
  title: string;
  lessonId: number;
  weekNumber: number;
  file: File | Blob;
}) => {
  const title = data.title?.toString().trim();
  const lessonId = Number(data.lessonId);
  const weekNumber = Number(data.weekNumber);
  const file = data.file;
  const hasArrayBuffer = file && typeof (file as any).arrayBuffer === "function";

  if (!title || lessonId <= 0 || weekNumber <= 0 || !file) {
    return {
      success: false,
      error: true,
      message: "Missing required fields: title, lesson, week number, or file.",
    } as any;
  }

  if (!hasArrayBuffer) {
    return {
      success: false,
      error: true,
      message: "The selected file could not be uploaded. Please choose a valid document.",
    } as any;
  }

  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims);

  if (role !== "teacher") {
    return {
      success: false,
      error: true,
      message: "Only teachers may upload lesson documents.",
    } as any;
  }

  const activePeriod = await getActiveAcademicPeriod();
  if (!activePeriod.yearLabel || activePeriod.termNumber === null) {
    return {
      success: false,
      error: true,
      message: "Lesson uploads are only allowed during an active academic term.",
    } as any;
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { class: true },
  });

  if (
    !lesson ||
    (lesson.teacherId !== userId && lesson.class.supervisorId !== userId)
  ) {
    return {
      success: false,
      error: true,
      message: "You are not authorized to upload documents for the selected lesson.",
    } as any;
  }

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "exam-questions");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeFileName = `${Date.now()}-${(file as File).name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFileName);
    const buffer = Buffer.from(await (file as any).arrayBuffer());
    await fs.writeFile(filePath, buffer);

    await prisma.examQuestionUpload.create({
      data: {
        title,
        fileName: (file as File).name,
        fileUrl: `/uploads/exam-questions/${safeFileName}`,
        lessonId,
        weekNumber,
        uploadedById: userId!,
        status: "PENDING",
        academicYearLabel: activePeriod.yearLabel,
        termNumber: activePeriod.termNumber,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log("uploadLessonDocument error:", err);
    return {
      success: false,
      error: true,
      message: "An internal error occurred while uploading the file.",
    } as any;
  }
};

export const updateLessonDocument = async (
  data: {
    id: number;
    title: string;
    weekNumber: number;
    file?: File | Blob;
  }
) => {
  const title = data.title?.toString().trim();
  const weekNumber = Number(data.weekNumber);
  const uploadId = Number(data.id);
  const file = data.file;
  const hasArrayBuffer = !file || typeof (file as any).arrayBuffer === "function";

  if (!title || uploadId <= 0 || weekNumber <= 0) {
    return {
      success: false,
      error: true,
      message: "Missing required fields: title, week number, or upload id.",
    } as any;
  }

  if (!hasArrayBuffer) {
    return {
      success: false,
      error: true,
      message: "The selected file could not be processed. Please choose a valid document.",
    } as any;
  }

  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims);

  const existingUpload = await prisma.examQuestionUpload.findUnique({
    where: { id: uploadId },
  });

  if (!existingUpload) {
    return { success: false, error: true, message: "Upload not found." } as any;
  }

  if (role !== "admin" && existingUpload.uploadedById !== userId) {
    return { success: false, error: true, message: "Unauthorized." } as any;
  }

  let fileUpdate: { fileName?: string; fileUrl?: string } = {};

  if (file) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "exam-questions");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeFileName = `${Date.now()}-${(file as File).name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFileName);
    const buffer = Buffer.from(await (file as any).arrayBuffer());
    await fs.writeFile(filePath, buffer);

    if (existingUpload.fileUrl) {
      const existingPath = path.join(
        process.cwd(),
        "public",
        existingUpload.fileUrl.replace(/^\//, "")
      );
      try {
        await fs.unlink(existingPath);
      } catch (err) {
        console.log("updateLessonDocument file removal failed:", err);
      }
    }

    fileUpdate = {
      fileName: (file as File).name,
      fileUrl: `/uploads/exam-questions/${safeFileName}`,
    };
  }

  try {
    await prisma.examQuestionUpload.update({
      where: { id: uploadId },
      data: {
        title,
        weekNumber,
        ...fileUpdate,
        status: role !== "admin" ? "PENDING" : existingUpload.status,
        approvedBy: role !== "admin" ? null : existingUpload.approvedBy,
        approvedAt: role !== "admin" ? null : existingUpload.approvedAt,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log("updateLessonDocument error:", err);
    return { success: false, error: true, message: "Unable to update the upload." } as any;
  }
};

export const approveLessonDocument = async (
  currentState: CurrentState,
  data: { id: number }
) => {
  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims);

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    await prisma.examQuestionUpload.update({
      where: { id: data.id },
      data: {
        status: "APPROVED",
        approvedBy: userId || undefined,
        approvedAt: new Date(),
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLessonDocumentUpload = async (
  currentState: CurrentState,
  data: { id: number }
) => {
  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims);

  try {
    const existingUpload = await prisma.examQuestionUpload.findUnique({
      where: { id: data.id },
    });

    if (!existingUpload) {
      return { success: false, error: true };
    }

    const canDelete =
      role === "admin" || existingUpload.uploadedById === userId;

    if (!canDelete) {
      return { success: false, error: true };
    }

    if (existingUpload.fileUrl) {
      const filePath = path.join(
        process.cwd(),
        "public",
        existingUpload.fileUrl.replace(/^\//, "")
      );

      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.log("deleteLessonDocumentUpload file removal failed:", err);
      }
    }

    await prisma.examQuestionUpload.delete({
      where: { id: data.id },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const approveExamQuestion = async (
  currentState: CurrentState,
  data: { id: number }
) => {
  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims);

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    await prisma.examQuestionUpload.update({
      where: { id: data.id },
      data: {
        status: "APPROVED",
        approvedBy: userId || undefined,
        approvedAt: new Date(),
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExamQuestionUpload = async (
  currentState: CurrentState,
  data: { id: number }
) => {
  const { userId, sessionClaims } = await auth();
  const role = await getUserRole(userId, sessionClaims);

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    const existingUpload = await prisma.examQuestionUpload.findUnique({
      where: { id: data.id },
    });

    if (existingUpload?.fileUrl) {
      const filePath = path.join(
        process.cwd(),
        "public",
        existingUpload.fileUrl.replace(/^\//, "")
      );

      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.log("deleteExamQuestionUpload file removal failed:", err);
      }
    }

    await prisma.examQuestionUpload.delete({
      where: { id: data.id },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
        // ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};
