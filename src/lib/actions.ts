"use server";

import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import { getActiveAcademicPeriod } from "./academicContext";
import util from "util";

const PARENTS_PATH = "/list/parents";
import {
  ClassSchema,
  ExamSchema,
  ParentSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  teacherSchema,
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

    const createPayload: any = {
      name: (data as any).name,
      capacity: Number((data as any).capacity) || 0,
      gradeId: Number((data as any).gradeId),
      gradingLevel: grade.level,
      supervisorId: (data as any).supervisorId || null,
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

    const updatePayload: any = {
      name: (data as any).name,
      capacity: Number((data as any).capacity) || undefined,
      gradeId: Number((data as any).gradeId),
      gradingLevel: grade.level,
      supervisorId: (data as any).supervisorId || null,
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
      },
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
  try {
    const client = await clerkClient();
    const primaryEmail = validTeacherData.email?.trim() || undefined;

    await client.users.updateUser(validTeacherData.id, {
      username: validTeacherData.username,
      ...(primaryEmail ? { emailAddress: primaryEmail } : {}),
      ...(validTeacherData.password !== "" && { password: validTeacherData.password }),
      firstName: validTeacherData.name,
      lastName: validTeacherData.surname,
    });

    await prisma.teacher.update({
      where: {
        id: validTeacherData.id,
      },
      data: {
        ...(validTeacherData.password !== "" && { password: validTeacherData.password }),
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
          set: validTeacherData.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
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
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const promoteStudents = async (
  currentState: CurrentState,
  data: { studentIds?: string[]; fromClassId?: number; toClassId?: number; promoteAll?: boolean }
) => {
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

      const selectedTeacherIds =
        data.teacherIds && data.teacherIds.length > 0
          ? data.teacherIds
          : teacherId
          ? [teacherId]
          : [];

      if (selectedTeacherIds.length === 0) {
        return { success: false, error: true };
      }

      if (selectedTeacherIds.length === 1) {
        await prisma.attendance.create({
          data: {
            date: parsedDate,
            present,
            teacher: {
              connect: { id: selectedTeacherIds[0] },
            },
          },
        });
      } else {
        await prisma.attendance.createMany({
          data: selectedTeacherIds.map((selectedTeacherId) => ({
            date: parsedDate,
            present,
            teacherId: selectedTeacherId,
          })),
        });
      }
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
  const studentId = data.studentId ?? undefined;
  const teacherId = data.teacherId ?? undefined;

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

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  if (!id) return { success: false, error: true };

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    const existing = await prisma.assignment.findUnique({ where: { id: Number(id) }, include: { lesson: true } });
    if (!existing) return { success: false, error: true };

    if (role === "admin") {
      // admin can delete
    } else if (role === "teacher") {
      if (existing.lesson.teacherId !== userId) {
        return { success: false, error: true };
      }
    } else {
      return { success: false, error: true };
    }

    await prisma.assignment.delete({ where: { id: Number(id) } });
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
  const role = await getUserRole(userId, sessionClaims as any);

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
  const role = await getUserRole(userId, sessionClaims as any);

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
  const role = await getUserRole(userId, sessionClaims as any);

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
  const role = await getUserRole(userId, sessionClaims as any);

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
  const role = await getUserRole(userId, sessionClaims as any);

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
  const role = await getUserRole(userId, sessionClaims as any);

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
  const role = await getUserRole(userId, sessionClaims as any);

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
  const role = await getUserRole(userId, sessionClaims as any);

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
