"use server";

import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { getActiveAcademicPeriod } from "./academicContext";
import { getAttendanceDateRestriction } from "./attendanceDateRules";
import util from "util";

const PARENTS_PATH = "/list/parents";
import {
  ClassSchema,
  ExamSchema,
  ExamTimetableSchema,
  ParentSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  teacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { getCurrentAuthContext, getServerSession, hashPassword } from "./auth";
import { teacherCanAccessAssignment } from "./assignmentAccess";

async function syncCanonicalUser(data: {
  id: string;
  username?: string | null;
  email?: string | null;
  password?: string | null;
  role: string;
}) {
  await prisma.user.upsert({
    where: { id: data.id },
    update: {
      username: data.username ?? null,
      email: data.email ?? null,
      ...(data.password ? { password: await hashPassword(data.password) } : {}),
      role: data.role.toUpperCase(),
    },
    create: {
      id: data.id,
      username: data.username ?? null,
      email: data.email ?? null,
      password: data.password ? await hashPassword(data.password) : null,
      role: data.role.toUpperCase(),
    },
  });
}

const getUserRole = async (
  userId: string | null,
  sessionClaims?: { metadata?: Record<string, unknown> }
) => {
  let role = sessionClaims?.metadata?.role as string | undefined;

  if (!role && userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = user.publicMetadata?.role as string | undefined;
    } catch (err) {
      console.log("Unable to read user role from Clerk metadata", err);
    }
  }

  return role;
};

type CurrentState = { success: boolean; error: boolean; message?: string };

const parseDateValue = (value: unknown) => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

const getErrorMessage = (err: unknown) => {
  if (typeof err === "object" && err !== null) {
    const maybeError = err as {
      message?: string;
      errors?: Array<{ message?: string }>;
      status?: number;
      statusText?: string;
    };

    if (Array.isArray(maybeError.errors) && maybeError.errors.length > 0) {
      const messages = maybeError.errors
        .map((error) => error.message)
        .filter((message): message is string => Boolean(message));
      if (messages.length > 0) {
        return messages.join(" \n");
      }
    }

    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }

    if (typeof maybeError.statusText === "string" && maybeError.statusText.trim()) {
      return maybeError.statusText;
    }
  }

  return "Something went wrong while saving the teacher.";
};

const buildClerkEmailAddresses = (email?: string, username?: string) => {
  const normalizedEmail = email?.trim();
  const normalizedUsername = username?.trim();

  if (normalizedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return [normalizedEmail];
  }

  return [`${normalizedUsername || "user"}@school.local`];
};

type AttendanceActionData = {
  id?: number;
  type: "student" | "teacher";
  date: string;
  present: string | boolean;
  studentId?: string;
  studentIds?: string[];
  teacherId?: string;
  teacherIds?: string[];
};

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    if (!data.gradeId || Number.isNaN(data.gradeId) || data.gradeId < 1) {
      return { success: false, error: true, message: "Grading level is required!" };
    }

    const matchingClasses = await prisma.class.findMany({
      where: { gradeId: data.gradeId },
      select: { id: true },
    });

    await prisma.subject.create({
      data: {
        name: data.name,
        gradeId: data.gradeId,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
        classes: {
          connect: matchingClasses.map((cls) => ({ id: cls.id })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: getErrorMessage(err) };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    if (!data.id || Number.isNaN(data.id) || data.id < 1) {
      return { success: false, error: true, message: "Subject is required!" };
    }

    if (!data.gradeId || Number.isNaN(data.gradeId) || data.gradeId < 1) {
      return { success: false, error: true, message: "Grading level is required!" };
    }

    const matchingClasses = await prisma.class.findMany({
      where: { gradeId: data.gradeId },
      select: { id: true },
    });

    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        gradeId: data.gradeId,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
        classes: {
          set: matchingClasses.map((cls) => ({ id: cls.id })),
        },
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: getErrorMessage(err) };
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
    // Log incoming data for debugging (use util.inspect to avoid stringify issues)
    try {
      await fs.appendFile(
        path.join(process.cwd(), "create-class-errors.log"),
        `[enter-createClass] ${new Date().toISOString()} payload=${util.inspect(data, { depth: 3 })}\n`
      );
      await fs.appendFile(
        path.join(process.cwd(), "create-class-errors.log"),
        `keys=${Object.keys(data || {}).join(',')}\n`
      );
    } catch {}

    // Basic validation for gradeId
    if (!data || typeof data.gradeId !== "number" || Number.isNaN(data.gradeId) || data.gradeId < 1) {
      return { success: false, error: true, message: "Grading level is required!" };
    }

    // Get the grade to determine gradingLevel
    const grade = await prisma.grade.findUnique({
      where: { id: data.gradeId },
      select: { id: true, level: true },
    });

    if (!grade) {
      try {
        await fs.appendFile(
          path.join(process.cwd(), "create-class-errors.log"),
          `[missing-grade] ${new Date().toISOString()} gradeId=${data.gradeId}\n`
        );
      } catch {}
      return { success: false, error: true, message: "Selected grading level not found." };
    }

    const matchingSubjects = await prisma.subject.findMany({
      where: { gradeId: grade.id },
      select: { id: true },
    });

    const createPayload: any = {
      name: (data as any).name,
      capacity: Number((data as any).capacity) || 0,
      gradeId: Number((data as any).gradeId),
      gradingLevel: grade.level,
      supervisorId: (data as any).supervisorId || null,
      subjects: {
        connect: matchingSubjects.map((subject) => ({ id: subject.id })),
      },
    };

    try {
      await fs.appendFile(
        path.join(process.cwd(), "create-class-errors.log"),
        `[create-payload] ${new Date().toISOString()} payload=${util.inspect(createPayload, { depth: 3 })}\n`
      );
    } catch {}

    await prisma.class.create({ data: createPayload });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    try {
      await fs.appendFile(
        path.join(process.cwd(), "create-class-errors.log"),
        `[caught] ${new Date().toISOString()} ${util.inspect(err, { depth: 4 })}\n`
      );
    } catch {}
    return { success: false, error: true, message: getErrorMessage(err) };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    // Log incoming update payload
    try {
      await fs.appendFile(
        path.join(process.cwd(), "create-class-errors.log"),
        `[enter-updateClass] ${new Date().toISOString()} payload=${util.inspect(data, { depth: 3 })}\n`
      );
      await fs.appendFile(
        path.join(process.cwd(), "create-class-errors.log"),
        `keys=${Object.keys(data || {}).join(',')}\n`
      );
    } catch {}

    if (!data || typeof data.gradeId !== "number" || Number.isNaN(data.gradeId) || data.gradeId < 1) {
      return { success: false, error: true, message: "Grading level is required!" };
    }

    // Get the grade to determine gradingLevel
    const grade = await prisma.grade.findUnique({
      where: { id: data.gradeId },
      select: { id: true, level: true },
    });

    if (!grade) {
      try {
        await fs.appendFile(
          path.join(process.cwd(), "create-class-errors.log"),
          `[missing-grade-update] ${new Date().toISOString()} gradeId=${data.gradeId}\n`
        );
      } catch {}
      return { success: false, error: true, message: "Selected grading level not found." };
    }

    const matchingSubjects = await prisma.subject.findMany({
      where: { gradeId: grade.id },
      select: { id: true },
    });

    const updatePayload: any = {
      name: (data as any).name,
      capacity: Number((data as any).capacity) || undefined,
      gradeId: Number((data as any).gradeId),
      gradingLevel: grade.level,
      supervisorId: (data as any).supervisorId || null,
      subjects: {
        set: matchingSubjects.map((subject) => ({ id: subject.id })),
      },
    };

    try {
      await fs.appendFile(
        path.join(process.cwd(), "create-class-errors.log"),
        `[update-payload] ${new Date().toISOString()} payload=${util.inspect(updatePayload, { depth: 3 })}\n`
      );
    } catch {}

    await prisma.class.update({ where: { id: data.id }, data: updatePayload });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    try {
      await fs.appendFile(
        path.join(process.cwd(), "create-class-errors.log"),
        `[caught-update] ${new Date().toISOString()} ${util.inspect(err, { depth: 4 })}\n`
      );
    } catch {}
    return { success: false, error: true, message: getErrorMessage(err) };
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
  const parsedTeacherData = teacherSchema.safeParse(data);
  if (!parsedTeacherData.success) {
    return {
      success: false,
      error: true,
      message: parsedTeacherData.error.issues[0]?.message ?? "Invalid teacher data.",
    };
  }

  const validTeacherData = parsedTeacherData.data;
  const assignmentError = await validateTeacherAssignments(
    validTeacherData.classIds ?? [],
    validTeacherData.subjects ?? [],
    true
  );
  if (assignmentError) {
    return { success: false, error: true, message: assignmentError };
  }

  try {
    const client = await clerkClient();
    const emailAddresses = buildClerkEmailAddresses(validTeacherData.email, validTeacherData.username);

    const user = await client.users.createUser({
      username: validTeacherData.username,
      emailAddress: emailAddresses,
      password: validTeacherData.password,
      firstName: validTeacherData.name,
      lastName: validTeacherData.surname,
      publicMetadata: { role: "teacher" },
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: validTeacherData.username,
        name: validTeacherData.name,
        surname: validTeacherData.surname,
        email: validTeacherData.email || null,
        phone: validTeacherData.phone || null,
        address: validTeacherData.address,
        img: validTeacherData.img || null,
        bloodType: validTeacherData.bloodType,
        sex: validTeacherData.sex,
        birthday: parseDateValue(validTeacherData.birthday) ?? new Date(),
        subjects: {
          connect: validTeacherData.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
        assignedClasses: {
          connect: validTeacherData.classIds?.map((classId) => ({ id: classId })),
        },
      },
    });
    await syncCanonicalUser({
      id: user.id,
      username: validTeacherData.username,
      email: validTeacherData.email || null,
      password: validTeacherData.password,
      role: "teacher",
    });

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return {
      success: false,
      error: true,
      message: getErrorMessage(err),
    };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const parsedTeacherData = teacherSchema.safeParse(data);
    if (!parsedTeacherData.success) {
      return {
        success: false,
        error: true,
        message: parsedTeacherData.error.issues[0]?.message ?? "Invalid teacher data.",
      };
    }

    const validTeacherData = parsedTeacherData.data;
    if (!validTeacherData.id) {
      return { success: false, error: true, message: "Teacher id is required." };
    }

    const assignmentError = await validateTeacherAssignments(
      validTeacherData.classIds ?? [],
      validTeacherData.subjects ?? [],
      false
    );
    if (assignmentError) {
      return { success: false, error: true, message: assignmentError };
    }

    const phone = validTeacherData.phone?.trim() || null;
    if (phone) {
      const existingTeacher = await prisma.teacher.findFirst({
        where: {
          phone,
          id: { not: validTeacherData.id },
        },
        select: { id: true },
      });
      if (existingTeacher) {
        return {
          success: false,
          error: true,
          message: "This phone number is already assigned to another teacher.",
        };
      }
    }

    const client = await clerkClient();
    const primaryEmail = validTeacherData.email?.trim() || undefined;

    await client.users.updateUser(validTeacherData.id, {
      username: validTeacherData.username,
      ...(primaryEmail ? { emailAddress: primaryEmail } : {}),
      ...(validTeacherData.password ? { password: validTeacherData.password } : {}),
      firstName: validTeacherData.name,
      lastName: validTeacherData.surname,
    });

    await prisma.teacher.update({
      where: {
        id: validTeacherData.id,
      },
      data: {
        ...(validTeacherData.password ? { password: validTeacherData.password } : {}),
        username: validTeacherData.username,
        name: validTeacherData.name,
        surname: validTeacherData.surname,
        email: validTeacherData.email || null,
        phone,
        address: validTeacherData.address,
        img: validTeacherData.img || null,
        bloodType: validTeacherData.bloodType,
        sex: validTeacherData.sex,
        birthday: parseDateValue(validTeacherData.birthday) ?? new Date(),
        subjects: {
          set: validTeacherData.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
        assignedClasses: {
          set: validTeacherData.classIds?.map((classId) => ({ id: classId })),
        },
      },
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    const prismaError = err as { code?: string; meta?: { target?: string[] | string } };
    const target = prismaError.meta?.target;
    if (
      prismaError.code === "P2002" &&
      (Array.isArray(target) ? target.includes("phone") : target?.includes("phone"))
    ) {
      return {
        success: false,
        error: true,
        message: "This phone number is already assigned to another teacher.",
      };
    }
    return {
      success: false,
      error: true,
      message: getErrorMessage(err),
    };
  }
};

async function validateTeacherAssignments(
  classIds: number[],
  subjectIds: string[],
  required: boolean
): Promise<string | null> {
  const uniqueClassIds = [...new Set(classIds)];
  const uniqueSubjectIds = [...new Set(subjectIds.map(Number))];
  if (required && (uniqueClassIds.length === 0 || uniqueSubjectIds.length === 0)) {
    return "Assign at least one class and one subject to the teacher.";
  }
  if (uniqueClassIds.length === 0 || uniqueSubjectIds.length === 0) {
    return null;
  }

  const classes = await prisma.class.findMany({
    where: { id: { in: uniqueClassIds } },
    select: { id: true, subjects: { select: { id: true } } },
  });
  if (classes.length !== uniqueClassIds.length) {
    return "One or more selected classes could not be found.";
  }

  const subjects = await prisma.subject.findMany({
    where: { id: { in: uniqueSubjectIds } },
    select: { id: true },
  });
  if (subjects.length !== uniqueSubjectIds.length) {
    return "One or more selected subjects could not be found.";
  }

  const classSubjectIds = new Set(
    classes.flatMap((classItem) => classItem.subjects.map((subject) => subject.id))
  );
  if (uniqueSubjectIds.some((subjectId) => !classSubjectIds.has(subjectId))) {
    return "Select subjects offered by at least one of the assigned classes.";
  }

  return null;
}

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
): Promise<CurrentState> => {
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
        otherNames: data.otherNames || null,
        nationality: data.nationality,
        religion: data.religion,
        address: data.address,
        gpsAddress: data.gpsAddress,
        languagesSpoken: data.languagesSpoken || null,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        department: data.department,
        classId: data.classId,
        gradeId: classItem?.gradeId ?? 0,
        parentId: data.parentId,
        previousSchoolName: data.previousSchoolName,
        previousClass: data.previousClass,
        yearsAttended: data.yearsAttended,
        reasonForTransfer: data.reasonForTransfer || null,
        knownMedicalConditions: data.knownMedicalConditions || null,
        hasAllergies: data.hasAllergies,
        allergyDetails: data.allergyDetails || null,
        hasHearingDifficulties: data.hasHearingDifficulties,
        hearingDetails: data.hearingDetails || null,
        wearsCorrectiveGlasses: data.wearsCorrectiveGlasses,
        correctiveGlassesDetails: data.correctiveGlassesDetails || null,
        physicallyFitForSports: data.physicallyFitForSports,
        fitnessDetails: data.fitnessDetails || null,
        otherIssues: data.otherIssues || null,
        emergencyContactPerson: data.emergencyContactPerson,
        emergencyContactNumber: data.emergencyContactNumber,
        alternativeEmergencyContactPerson: data.alternativeEmergencyContactPerson,
        alternativeEmergencyContactNumber: data.alternativeEmergencyContactNumber,
        declarationName: data.declarationName,
        declarationDate: data.declarationDate ? new Date(data.declarationDate) : null,
      },
    });
    await syncCanonicalUser({
      id: user.id,
      username: data.username,
      password: data.password,
      role: "student",
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
): Promise<CurrentState> => {
  const { role } = await getCurrentAuthContext();
  if (role !== "admin") {
    return { success: false, error: true, message: "Only an administrator can update student records." };
  }

  if (!data.id) {
    return { success: false, error: true, message: "Student id is required." };
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
        otherNames: data.otherNames || null,
        nationality: data.nationality,
        religion: data.religion,
        address: data.address,
        gpsAddress: data.gpsAddress,
        languagesSpoken: data.languagesSpoken || null,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        department: data.department,
        classId: data.classId,
        parentId: data.parentId,
        previousSchoolName: data.previousSchoolName,
        previousClass: data.previousClass,
        yearsAttended: data.yearsAttended,
        reasonForTransfer: data.reasonForTransfer || null,
        knownMedicalConditions: data.knownMedicalConditions || null,
        hasAllergies: data.hasAllergies,
        allergyDetails: data.allergyDetails || null,
        hasHearingDifficulties: data.hasHearingDifficulties,
        hearingDetails: data.hearingDetails || null,
        wearsCorrectiveGlasses: data.wearsCorrectiveGlasses,
        correctiveGlassesDetails: data.correctiveGlassesDetails || null,
        physicallyFitForSports: data.physicallyFitForSports,
        fitnessDetails: data.fitnessDetails || null,
        otherIssues: data.otherIssues || null,
        emergencyContactPerson: data.emergencyContactPerson,
        emergencyContactNumber: data.emergencyContactNumber,
        alternativeEmergencyContactPerson: data.alternativeEmergencyContactPerson,
        alternativeEmergencyContactNumber: data.alternativeEmergencyContactNumber,
        declarationName: data.declarationName,
        declarationDate: data.declarationDate ? new Date(data.declarationDate) : null,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false, message: undefined };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: getErrorMessage(err) };
  }
};

export const promoteStudents = async (
  currentState: CurrentState,
  data: { studentIds?: string[]; fromClassId?: number; toClassId?: number; promoteAll?: boolean }
) => {
  const { role } = await getCurrentAuthContext();
  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    if (data.promoteAll && data.fromClassId && data.toClassId) {
      if (data.fromClassId === data.toClassId) {
        return { success: false, error: true };
      }

      const updateResult = await prisma.student.updateMany({ where: { classId: data.fromClassId }, data: { classId: data.toClassId } });
      if (updateResult.count === 0) {
        return { success: false, error: true };
      }
    } else if (data.studentIds && data.studentIds.length && data.toClassId) {
      const students = await prisma.student.findMany({ where: { id: { in: data.studentIds }, isArchived: false } });
      if (students.some((student) => student.classId === data.toClassId)) {
        return { success: false, error: true };
      }
      const updateResult = await prisma.student.updateMany({ where: { id: { in: data.studentIds } }, data: { classId: data.toClassId } });
      if (updateResult.count === 0) {
        return { success: false, error: true };
      }
    } else {
      return { success: false, error: true };
    }

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
  const { role } = await getCurrentAuthContext();
  if (role !== "admin") {
    return { success: false, error: true };
  }

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
  // server-side validation to avoid unhandled rejections that lead to 422 responses
  try {
    const { parentSchema } = await import("./formValidationSchemas.js");
    const parsed = parentSchema.safeParse(data as any);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i: any) => i.message).join("; ");
      return { success: false, error: true, message: `Validation: ${msg}` };
    }
  } catch (e) {
    // if schema import fails, continue to main logic
  }
  // debug trace file - write checkpoints to help diagnose 422/Unprocessable Entity
  const debugLog = (msg: string) =>
    fs.appendFile(path.join(process.cwd(), "create-parent-debug.log"), `${new Date().toISOString()} ${msg}\n`).catch(() => {});
  await debugLog("enter-createParent");
  // For create, password is required
  if (!data.password || data.password.length < 8) {
    return { success: false, error: true, message: "Password must be at least 8 characters long." };
  }
  
  try {
    await debugLog("before-username-check");
    // Check if username already exists
    const existingUsername = await prisma.parent.findUnique({
      where: { username: data.username },
    });
    await debugLog("after-username-check");
    if (existingUsername) {
      await debugLog("username-exists");
      return { success: false, error: true, message: "Username already exists." };
    }

    // Check if email already exists (if provided)
    if (data.email && data.email.trim()) {
      const existingEmail = await prisma.parent.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        return { success: false, error: true, message: "Email already exists." };
      }
    }

    // Check if phone already exists
    const existingPhone = await prisma.parent.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      return { success: false, error: true, message: "Phone number already exists." };
    }

    await debugLog("before-clerk-client");
    const client = await clerkClient();
    await debugLog("after-clerk-client");

    // Pre-flight checks against Clerk to avoid 422 from the auth provider
    try {
      await debugLog("before-clerk-username-check");
      const getUserList = (client.users as any).getUserList;
      let usersByUsername: any[] = [];
      if (typeof getUserList === "function") {
        usersByUsername = await getUserList({ username: [data.username] });
      }
      await debugLog(`clerk-users-by-username:${usersByUsername?.length ?? 0}`);
      if (usersByUsername && usersByUsername.length > 0) {
        await debugLog("clerk-username-exists");
        return { success: false, error: true, message: "Username already exists in the auth provider." };
      }
      if (data.email && data.email.trim()) {
        await debugLog("before-clerk-email-check");
        let usersByEmail: any[] = [];
        if (typeof getUserList === "function") {
          usersByEmail = await getUserList({ emailAddress: [data.email] });
        }
        await debugLog(`clerk-users-by-email:${usersByEmail?.length ?? 0}`);
        if (usersByEmail && usersByEmail.length > 0) {
          await debugLog("clerk-email-exists");
          return { success: false, error: true, message: "Email already exists in the auth provider." };
        }
      }
    } catch (clerkCheckErr) {
      await debugLog(`clerk-check-error:${String(clerkCheckErr)}`);
      // continue to createUser; the provider will return an error we catch below
    }

    await debugLog("before-clerk-createUser");
    const user = await client.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "parent" },
      emailAddress: buildClerkEmailAddresses(data.email, data.username),
    });
    await debugLog("after-clerk-createUser");

    await debugLog("before-prisma-create-parent");
    await prisma.parent.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        occupation: data.occupation || null,
        phone: data.phone,
        address: data.address,
      },
    });
    await syncCanonicalUser({
      id: user.id,
      username: data.username,
      email: data.email || null,
      password: data.password,
      role: "parent",
    });
    await debugLog("after-prisma-create-parent");

    revalidatePath(PARENTS_PATH);
    return { success: true, error: false };
  } catch (err) {
    console.log("Create parent error:", err);
    const inspected = typeof err === "string" ? err : util.inspect(err, { depth: null });
    try {
      await fs.appendFile(
        path.join(process.cwd(), "create-parent-errors.log"),
        `\n---- ${new Date().toISOString()} ----\n${inspected}\n`
      );
    } catch (writeErr) {
      console.log("Failed to write create-parent log:", writeErr);
    }
    await debugLog(`caught:${String(err)}`);
    const maybeErr = err as any;
    const msgFromErr = maybeErr && (maybeErr.message || maybeErr.statusText || maybeErr.code || maybeErr.longMessage || (maybeErr.response && JSON.stringify(maybeErr.response)));
    const msg = msgFromErr || String(inspected) || "Failed to create parent. Please try again.";
    return { success: false, error: true, message: msg };
  }
  await debugLog("exit-createParent-success");
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.id) {
    return { success: false, error: true, message: "Parent ID is required." };
  }
  try {
    // Check if new username already exists (if changing username)
    const existingParent = await prisma.parent.findUnique({
      where: { id: data.id },
    });
    
    if (existingParent && existingParent.username !== data.username) {
      const usernameExists = await prisma.parent.findUnique({
        where: { username: data.username },
      });
      if (usernameExists) {
        return { success: false, error: true, message: "Username already exists." };
      }
    }

    // Check if email already exists (if changing email)
    if (data.email && data.email.trim()) {
      if (existingParent && existingParent.email !== data.email) {
        const emailExists = await prisma.parent.findUnique({
          where: { email: data.email },
        });
        if (emailExists) {
          return { success: false, error: true, message: "Email already exists." };
        }
      }
    }

    // Check if phone already exists (if changing phone)
    if (existingParent && existingParent.phone !== data.phone) {
      const phoneExists = await prisma.parent.findUnique({
        where: { phone: data.phone },
      });
      if (phoneExists) {
        return { success: false, error: true, message: "Phone number already exists." };
      }
    }

    const client = await clerkClient();
    await client.users.updateUser(data.id, {
      username: data.username,
      ...(data.password && data.password.trim() && { password: data.password }),
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
        occupation: data.occupation || null,
        phone: data.phone,
        address: data.address,
      },
    });

    revalidatePath(PARENTS_PATH);
    return { success: true, error: false };
  } catch (err) {
    console.log("Update parent error:", util.inspect(err, { depth: null }));
    return { success: false, error: true, message: "Failed to update parent. Please try again." };
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
  const studentId = data.studentId ?? undefined;
  const teacherId = data.teacherId ?? undefined;

  const { userId, role } = await getCurrentAuthContext();

  if (!userId || !type || !dateValue) {
    return { success: false, error: true };
  }

  try {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return { success: false, error: true };
    }

    const attendanceRestriction = await getAttendanceDateRestriction(dateValue);
    if (attendanceRestriction) {
      return { success: false, error: true, message: attendanceRestriction };
    }

    if (type === "teacher") {
      if (role !== "admin") {
        return { success: false, error: true };
      }

      const selectedTeacherIds = [...new Set(
        data.teacherIds && data.teacherIds.length > 0
          ? data.teacherIds
          : teacherId
          ? [teacherId]
          : []
      )];

      if (selectedTeacherIds.length === 0) {
        return { success: false, error: true };
      }

      const activeTeachers = await prisma.teacher.findMany({
        where: { id: { in: selectedTeacherIds }, isArchived: false },
        select: { id: true },
      });
      if (activeTeachers.length !== selectedTeacherIds.length) {
        return { success: false, error: true };
      }

      const dayStart = new Date(`${dateValue.slice(0, 10)}T00:00:00.000Z`);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      const existingAttendance = await prisma.attendance.findMany({
        where: {
          teacherId: { in: selectedTeacherIds },
          studentId: null,
          isArchived: false,
          date: { gte: dayStart, lt: dayEnd },
        },
        select: { id: true, teacherId: true },
      });

      if (existingAttendance.length) {
        await prisma.attendance.updateMany({
          where: { id: { in: existingAttendance.map((record) => record.id) } },
          data: { present },
        });
      }

      const existingTeacherIds = new Set(existingAttendance.map((record) => record.teacherId));
      const teachersToCreate = selectedTeacherIds.filter((selectedId) => !existingTeacherIds.has(selectedId));
      if (teachersToCreate.length) {
        await prisma.attendance.createMany({
          data: teachersToCreate.map((selectedTeacherId) => ({
            date: dayStart,
            present,
            teacherId: selectedTeacherId,
          })),
        });
      }
    } else {
      if (role !== "admin" && role !== "teacher") {
        return { success: false, error: true };
      }

      const selectedStudentIds = [...new Set(
        data.studentIds && data.studentIds.length > 0
          ? data.studentIds
          : studentId
          ? [studentId]
            : []
      )];

      if (selectedStudentIds.length === 0) {
        return { success: false, error: true };
      }

      if (role === "teacher") {
        const supervised = await prisma.student.findMany({
          where: {
            id: { in: selectedStudentIds },
            isArchived: false,
            class: {
              supervisorId: userId,
            },
          },
          select: { id: true },
        });
        if (supervised.length !== selectedStudentIds.length) {
          return { success: false, error: true };
        }
      }

      const nextDate = new Date(parsedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const existingAttendance = await prisma.attendance.findMany({
        where: {
          studentId: { in: selectedStudentIds },
          teacherId: null,
          isArchived: false,
          date: { gte: parsedDate, lt: nextDate },
        },
        select: { id: true, studentId: true },
      });

      if (existingAttendance.length) {
        await prisma.attendance.updateMany({
          where: { id: { in: existingAttendance.map((record) => record.id) } },
          data: { present },
        });
      }

      const existingStudentIds = new Set(existingAttendance.map((record) => record.studentId));
      const studentsToCreate = selectedStudentIds.filter((selectedStudentId) => !existingStudentIds.has(selectedStudentId));
      if (studentsToCreate.length) {
        await prisma.attendance.createMany({
          data: studentsToCreate.map((selectedStudentId) => ({
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
  const studentId = data.studentId ?? undefined;
  const teacherId = data.teacherId ?? undefined;

  const session = await getServerSession();
  const userId = session?.userId ?? null;
  const role = session?.user?.role ? String(session.user.role).toLowerCase() : undefined;

  if (!userId || !type || !dateValue) {
    return { success: false, error: true };
  }

  try {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return { success: false, error: true };
    }

    const attendanceRestriction = await getAttendanceDateRestriction(dateValue);
    if (attendanceRestriction) {
      return { success: false, error: true, message: attendanceRestriction };
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

  const serverSession = await getServerSession();
  const userId = serverSession?.userId ?? null;
  const sessionClaims = { metadata: { role: serverSession?.user?.role } };
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

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  if (!id) return { success: false, error: true };

  const serverSession = await getServerSession();
  const userId = serverSession?.userId ?? null;
  const sessionClaims = { metadata: { role: serverSession?.user?.role } };
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    const assignmentId = Number(id);
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return { success: false, error: true };
    }

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { lessonId: true },
    });
    if (!existing) return { success: false, error: true };

    if (
      role !== "admin" &&
      (role !== "teacher" ||
        !userId ||
        !(await teacherCanAccessAssignment(userId, existing.lessonId)))
    ) {
      return { success: false, error: true };
    }

    await prisma.assignment.delete({ where: { id: assignmentId } });
    revalidatePath("/list/assignments");
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
  const { role } = await getCurrentAuthContext();
  if (role !== "admin") {
    return { success: false, error: true, message: "Only administrators can create exams." };
  }

  try {
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
  const { role } = await getCurrentAuthContext();
  if (role !== "admin") {
    return { success: false, error: true, message: "Only administrators can update exams." };
  }
  if (data.endTime <= data.startTime) {
    return { success: false, error: true, message: "The exam end time must be after its start time." };
  }

  try {
    const existingExam = await prisma.exam.findUnique({
      where: { id: data.id },
      select: { id: true, invigilators: { select: { id: true } } },
    });
    if (!existingExam) {
      return { success: false, error: true, message: "Exam not found." };
    }

    if (existingExam.invigilators.length > 0) {
      const conflict = await prisma.exam.findFirst({
        where: {
          id: { not: existingExam.id },
          isArchived: false,
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime },
          invigilators: {
            some: { id: { in: existingExam.invigilators.map(({ id }) => id) } },
          },
        },
        select: { id: true },
      });
      if (conflict) {
        return {
          success: false,
          error: true,
          message: "The updated exam time conflicts with another exam assigned to one of its invigilators.",
        };
      }
    }

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
  data: ExamTimetableSchema
) => {
  const { role } = await getCurrentAuthContext();

  if (role !== "admin") {
    return { success: false, error: true, message: "Only administrators can create exams." };
  }

  const startDate = new Date(`${data.date}T${data.startTime}:00`);
  const endDate = new Date(`${data.date}T${data.endTime}:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    return { success: false, error: true, message: "The exam end time must be after its start time." };
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
    return { success: false, error: true, message: "Select a lesson belonging to one of the selected classes." };
  }

  try {
    const invigilatorIds = [...new Set(data.invigilatorIds)];
    if (invigilatorIds.length === 0) {
      return {
        success: false,
        error: true,
        message: "Select at least one invigilator.",
      };
    }
    const activeTeachers = await prisma.teacher.findMany({
      where: { id: { in: invigilatorIds }, isArchived: false },
      select: { id: true },
    });
    if (activeTeachers.length !== invigilatorIds.length) {
      return {
        success: false,
        error: true,
        message: "Choose only active teachers as invigilators.",
      };
    }

    if (invigilatorIds.length > 0) {
      const conflictingExam = await prisma.exam.findFirst({
        where: {
          isArchived: false,
          startTime: { lt: endDate },
          endTime: { gt: startDate },
          invigilators: { some: { id: { in: invigilatorIds } } },
        },
        include: {
          lesson: { include: { class: { select: { name: true } } } },
          invigilators: {
            where: { id: { in: invigilatorIds } },
            select: { name: true, surname: true },
          },
        },
      });
      if (conflictingExam) {
        const names = conflictingExam.invigilators
          .map((teacher) => `${teacher.name} ${teacher.surname}`.trim())
          .join(", ");
        const verb = conflictingExam.invigilators.length > 1 ? "are" : "is";
        return {
          success: false,
          error: true,
          message: `${names} ${verb} already assigned to an overlapping exam for ${conflictingExam.lesson.class.name}.`,
        };
      }
    }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: startDate,
        endTime: endDate,
        lessonId: data.lessonId,
        invigilators: {
          connect: invigilatorIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, message: "Unable to create the exam timetable." };
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

  const { userId, role } = await getCurrentAuthContext();

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
        documentType: "EXAM_QUESTION",
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

const teacherHasLessonAssignment = async (
  teacherId: string,
  lessonId: number
): Promise<boolean> => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      class: {
        select: {
          assignedTeachers: {
            where: { id: teacherId, isArchived: false },
            select: { id: true },
          },
        },
      },
      subject: {
        select: {
          id: true,
          teachers: {
            where: { id: teacherId, isArchived: false },
            select: { id: true },
          },
        },
      },
    },
  });

  return Boolean(
    lesson &&
      (lesson.teacherId === teacherId ||
        (lesson.class.assignedTeachers.length > 0 &&
          lesson.subject.teachers.length > 0))
  );
};

const isValidLessonDocumentAsset = (fileName: string, fileUrl: string) => {
  const normalizedName = fileName.trim();
  if (!normalizedName || normalizedName.length > 255) {
    return false;
  }

  try {
    const url = new URL(fileUrl);
    const urlFileName = decodeURIComponent(url.pathname.split("/").pop() || "");
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      /\/raw\/upload\//i.test(url.pathname) &&
      (/\.(pdf|doc|docx)$/i.test(normalizedName) ||
        /\.(pdf|doc|docx)$/i.test(urlFileName))
    );
  } catch {
    return false;
  }
};

export const uploadLessonDocument = async (data: {
  title: string;
  lessonId: number;
  weekNumber: number;
  fileName: string;
  fileUrl: string;
}) => {
  const title = data.title?.toString().trim();
  const lessonId = Number(data.lessonId);
  const weekNumber = Number(data.weekNumber);
  const fileName = data.fileName?.trim();
  const fileUrl = data.fileUrl?.trim();

  if (!title || !Number.isInteger(lessonId) || lessonId <= 0 || !Number.isInteger(weekNumber) || weekNumber <= 0) {
    return {
      success: false,
      error: true,
      message: "Enter a title, select a lesson, and enter a valid week number.",
    } as any;
  }

  if (!fileName || !fileUrl || !isValidLessonDocumentAsset(fileName, fileUrl)) {
    return {
      success: false,
      error: true,
      message: "Choose a valid PDF, DOC, or DOCX document before submitting.",
    } as any;
  }

  const { userId } = await getCurrentAuthContext();
  if (!userId) {
    return {
      success: false,
      error: true,
      message: "Sign in with a teacher account to upload lesson documents.",
    } as any;
  }

  const teacherProfile = await prisma.teacher.findFirst({
    where: { id: userId, isArchived: false },
    select: { id: true },
  });
  if (!teacherProfile) {
    return {
      success: false,
      error: true,
      message: "Only teacher accounts may upload lesson documents.",
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

  if (!(await teacherHasLessonAssignment(teacherProfile.id, lessonId))) {
    return {
      success: false,
      error: true,
      message: "You may only upload documents for a subject and class assigned to you.",
    } as any;
  }

  try {
    await prisma.examQuestionUpload.create({
      data: {
        documentType: "LESSON_DOCUMENT",
        title,
        fileName,
        fileUrl,
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
  } catch (error) {
    console.error("uploadLessonDocument failed to save upload metadata:", error);
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
    file?: { fileName: string; fileUrl: string };
  }
) => {
  const title = data.title?.toString().trim();
  const weekNumber = Number(data.weekNumber);
  const uploadId = Number(data.id);
  const file = data.file;

  if (!title || uploadId <= 0 || weekNumber <= 0) {
    return {
      success: false,
      error: true,
      message: "Missing required fields: title, week number, or upload id.",
    } as any;
  }

  if (
    file &&
    !isValidLessonDocumentAsset(file.fileName, file.fileUrl)
  ) {
    return {
      success: false,
      error: true,
      message: "Choose a valid PDF, DOC, or DOCX document before saving.",
    } as any;
  }

  const serverSession = await getServerSession();
  const userId = serverSession?.userId ?? null;
  const sessionClaims = { metadata: { role: serverSession?.user?.role } };
  const role = await getUserRole(userId, sessionClaims as any);

  const existingUpload = await prisma.examQuestionUpload.findUnique({
    where: { id: uploadId },
  });

  if (!existingUpload || existingUpload.documentType !== "LESSON_DOCUMENT") {
    return { success: false, error: true, message: "Upload not found." } as any;
  }

  if (role !== "admin" && existingUpload.uploadedById !== userId) {
    return { success: false, error: true, message: "Unauthorized." } as any;
  }

  if (role === "teacher") {
    const teacherProfile = await prisma.teacher.findFirst({
      where: { id: userId ?? undefined, isArchived: false },
      select: { id: true },
    });
    if (
      !teacherProfile ||
      !(await teacherHasLessonAssignment(teacherProfile.id, existingUpload.lessonId))
    ) {
      return {
        success: false,
        error: true,
        message: "You may only manage uploads for a subject and class assigned to you.",
      } as any;
    }
  }

  let fileUpdate: { fileName?: string; fileUrl?: string } = {};

  if (file) {
    if (existingUpload.fileUrl.startsWith("/uploads/")) {
      const existingPath = path.join(process.cwd(), "public", existingUpload.fileUrl.replace(/^\//, ""));
      try {
        await fs.unlink(existingPath);
      } catch (error) {
        console.warn("Unable to remove replaced local lesson document:", error);
      }
    }

    fileUpdate = {
      fileName: file.fileName.trim(),
      fileUrl: file.fileUrl.trim(),
    };
  }

  try {
    await prisma.examQuestionUpload.update({
      where: { id: uploadId, documentType: "LESSON_DOCUMENT" },
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
  const { userId, role } = await getCurrentAuthContext();

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    const existingUpload = await prisma.examQuestionUpload.findFirst({
      where: { id: data.id, documentType: "LESSON_DOCUMENT" },
      select: { id: true },
    });
    if (!existingUpload) return { success: false, error: true };

    await prisma.examQuestionUpload.update({
      where: { id: data.id, documentType: "LESSON_DOCUMENT" },
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
  const serverSession = await getServerSession();
  const userId = serverSession?.userId ?? null;
  const sessionClaims = { metadata: { role: serverSession?.user?.role } };
  const role = await getUserRole(userId, sessionClaims as any);

  try {
    const existingUpload = await prisma.examQuestionUpload.findUnique({
      where: { id: data.id },
    });

    if (!existingUpload || existingUpload.documentType !== "LESSON_DOCUMENT") {
      return { success: false, error: true };
    }

    const canDelete =
      role === "admin" || existingUpload.uploadedById === userId;

    if (!canDelete) {
      return { success: false, error: true };
    }

    if (existingUpload.fileUrl.startsWith("/uploads/")) {
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
      where: { id: data.id, documentType: "LESSON_DOCUMENT" },
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
  const { userId, role } = await getCurrentAuthContext();

  if (role !== "admin") {
    return { success: false, error: true };
  }

  try {
    const existingUpload = await prisma.examQuestionUpload.findFirst({
      where: { id: data.id, documentType: "EXAM_QUESTION" },
      select: { id: true },
    });
    if (!existingUpload) return { success: false, error: true };

    await prisma.examQuestionUpload.update({
      where: { id: data.id, documentType: "EXAM_QUESTION" },
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

export const updateExamQuestionUpload = async (data: {
  id: number;
  title: string;
  lessonId: number;
  file?: File | Blob;
}) => {
  const { userId, role } = await getCurrentAuthContext();
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true, message: "You are not authorized to edit this upload." } as any;
  }

  const title = data.title.trim();
  const lessonId = Number(data.lessonId);
  if (!title || lessonId <= 0 || (data.file && typeof data.file.arrayBuffer !== "function")) {
    return { success: false, error: true, message: "Enter a title, select a lesson, and choose a valid document." } as any;
  }

  const existingUpload = await prisma.examQuestionUpload.findFirst({
    where: {
      id: data.id,
      documentType: "EXAM_QUESTION",
      ...(role === "teacher" ? { uploadedById: userId } : {}),
    },
  });
  if (!existingUpload) {
    return { success: false, error: true, message: "Exam question upload not found or unauthorized." } as any;
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { class: true },
  });
  if (!lesson || (role === "teacher" && lesson.teacherId !== userId && lesson.class.supervisorId !== userId)) {
    return { success: false, error: true, message: "You are not authorized to use the selected lesson." } as any;
  }

  const fileUpdate: { fileName?: string; fileUrl?: string } = {};
  if (data.file) {
    const file = data.file as File;
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "exam-questions");
    await fs.mkdir(uploadsDir, { recursive: true });
    const safeFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFileName);
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));
    fileUpdate.fileName = file.name;
    fileUpdate.fileUrl = `/uploads/exam-questions/${safeFileName}`;
  }

  try {
    await prisma.examQuestionUpload.update({
      where: { id: data.id, documentType: "EXAM_QUESTION" },
      data: {
        title,
        lessonId,
        ...fileUpdate,
        ...(role === "teacher" ? { status: "PENDING", approvedBy: null, approvedAt: null } : {}),
      },
    });
    revalidatePath("/list/exams");
    return { success: true, error: false };
  } catch (error) {
    console.error("updateExamQuestionUpload error:", error);
    return { success: false, error: true, message: "Unable to update the exam question upload." } as any;
  }
};

export const deleteExamQuestionUpload = async (
  currentState: CurrentState,
  data: { id: number }
) => {
  const { userId, role } = await getCurrentAuthContext();
  if (!userId || (role !== "admin" && role !== "teacher")) {
    return { success: false, error: true };
  }

  try {
    const existingUpload = await prisma.examQuestionUpload.findUnique({
      where: { id: data.id },
    });

    if (
      !existingUpload ||
      existingUpload.documentType !== "EXAM_QUESTION" ||
      (role === "teacher" && existingUpload.uploadedById !== userId)
    ) {
      return { success: false, error: true };
    }

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
      where: { id: data.id, documentType: "EXAM_QUESTION" },
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
  const { role } = await getCurrentAuthContext();
  if (role !== "admin") {
    return { success: false, error: true };
  }

  const id = data.get("id") as string;

  try {
    await prisma.exam.delete({
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
