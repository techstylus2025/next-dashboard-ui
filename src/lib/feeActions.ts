"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { clerkClient } from "@clerk/nextjs/server";
import { getCurrentAuthContext, verifyPassword } from "@/lib/auth";
import { FEE_PAGE_ACCESS_COOKIE, FEE_PAGE_ACCESS_TTL_SECONDS, hasFeePageAccess } from "@/lib/feePageAccess";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";

async function getRole(): Promise<string | undefined> {
  const { userId, role } = await getCurrentAuthContext();
  if (role === "admin" && !(await hasFeePageAccess(userId))) return undefined;
  return role ?? undefined;
}

export async function verifyFeesPagePassword(password: string): Promise<{ success: boolean; error: string }> {
  const { userId, role } = await getCurrentAuthContext();
  if (role !== "admin" || !userId) {
    return { success: false, error: "Only administrators can access this page." };
  }
  if (typeof password !== "string" || password.length === 0) {
    return { success: false, error: "Enter your administrator password." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, role: true },
  });
  if (!user || user.role.toLowerCase() !== "admin") {
    return { success: false, error: "Administrator credentials could not be found." };
  }

  let validPassword = false;
  if (user.password) {
    validPassword = await verifyPassword(user.password, password);
  } else {
    try {
      const client = await clerkClient();
      await client.users.verifyPassword({ userId, password });
      validPassword = true;
    } catch (error) {
      const clerkError = error as {
        errors?: Array<{ code?: string }>;
        status?: number;
      };
      const rejectedPassword = clerkError.errors?.some(({ code }) =>
        code ? /password.*(incorrect|invalid)|incorrect.*password/i.test(code) : false
      );

      if (!rejectedPassword) {
        console.error("Administrator password verification failed", error);
        return { success: false, error: "Unable to verify your password right now. Please try again." };
      }
    }
  }

  if (!validPassword) {
    return { success: false, error: "The administrator password is incorrect." };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + FEE_PAGE_ACCESS_TTL_SECONDS * 1000);
  try {
    await prisma.session.deleteMany({
      where: { userAgent: "fees-page-access", expiresAt: { lte: new Date() } },
    });
    await prisma.session.create({
      data: { token, userId, expiresAt, userAgent: "fees-page-access" },
    });
  } catch (error) {
    console.error("Unable to create fees page access session", error);
    return { success: false, error: "Unable to open the fees page right now. Please try again." };
  }

  (await cookies()).set(FEE_PAGE_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/list/fees",
    maxAge: FEE_PAGE_ACCESS_TTL_SECONDS,
  });

  return { success: true, error: "" };
}

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

export async function createFeeSchedule(input: {
  classId: number;
  academicYear: string;
  term: "TERM_1" | "TERM_2" | "TERM_3";
  totalBillCedis: number;
}): Promise<{ success: boolean; error: string | null; paymentId?: number }> {
  const role = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can create fee schedules." };
  }
  if (input.totalBillCedis <= 0) {
    return { success: false, error: "Total bill must be greater than zero." };
  }
  const year = input.academicYear.trim();
  if (!year) {
    return { success: false, error: "Academic year is required." };
  }

  try {
    const total = toDecimal(input.totalBillCedis);
    await prisma.$transaction(async (tx) => {
      const schedule = await tx.feeSchedule.create({
        data: {
          classId: input.classId,
          academicYear: year,
          term: input.term,
          totalBillCedis: total,
        },
      });
      const students = await tx.student.findMany({
        where: { classId: input.classId, isArchived: false },
        select: { id: true },
      });
      if (students.length === 0) {
        await tx.feeSchedule.delete({ where: { id: schedule.id } });
        throw new Error("NO_STUDENTS");
      }
      await tx.studentFeeAssignment.createMany({
        data: students.map((s) => ({
          studentId: s.id,
          feeScheduleId: schedule.id,
          totalBillCedis: total,
        })),
      });
    });
    revalidatePath("/list/fees");
    return { success: true, error: null };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "NO_STUDENTS") {
      return {
        success: false,
        error: "No students in this class. Fee schedule was not created.",
      };
    }
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      return {
        success: false,
        error: "A fee for this class, academic year, and term already exists.",
      };
    }
    console.error(e);
    return { success: false, error: "Could not create fee schedule." };
  }
}

export async function recordFeePayment(input: {
  studentFeeAssignmentId: number;
  amountCedis: number;
  paidAt: Date;
  paymentMethod?: string;
  methodDetails?: string;
}): Promise<{ success: boolean; error: string | null; paymentId?: number }> {
  const role = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can record payments." };
  }
  if (input.amountCedis <= 0) {
    return { success: false, error: "Payment amount must be greater than zero." };
  }

  const assignment = await prisma.studentFeeAssignment.findUnique({
    where: { id: input.studentFeeAssignmentId },
    include: { payments: true },
  });
  if (!assignment) {
    return { success: false, error: "Fee assignment not found." };
  }

  const total = Number(assignment.totalBillCedis);
  const paid = assignment.payments.reduce(
    (s, p) => s + Number(p.amountCedis),
    0
  );
  const balance = total - paid;
  if (input.amountCedis > balance + 0.009) {
    return {
      success: false,
      error: `Payment exceeds balance (₵${balance.toFixed(2)} remaining).`,
    };
  }

  try {
    const payment = await prisma.feePayment.create({
      data: {
        studentFeeAssignmentId: input.studentFeeAssignmentId,
        amountCedis: toDecimal(input.amountCedis),
        paidAt: input.paidAt,
        paymentMethod: input.paymentMethod || "cash",
        methodDetails: input.methodDetails || null,
      },
    });
    revalidatePath("/list/fees");
    return { success: true, error: null, paymentId: payment.id };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error("FeePayment create error:", errorMsg, e);
    return { success: false, error: `Could not record payment: ${errorMsg}` };
  }
}

export async function updateFeePayment(input: {
  id: number;
  amountCedis: number;
  paidAt: Date;
}): Promise<{ success: boolean; error: string | null }> {
  const role = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can edit payments." };
  }
  if (input.amountCedis <= 0) {
    return { success: false, error: "Amount must be greater than zero." };
  }

  const payment = await prisma.feePayment.findUnique({
    where: { id: input.id },
    include: {
      assignment: {
        include: { payments: true },
      },
    },
  });
  if (!payment) {
    return { success: false, error: "Payment not found." };
  }

  const total = Number(payment.assignment.totalBillCedis);
  const otherPaid = payment.assignment.payments
    .filter((p) => p.id !== payment.id)
    .reduce((s, p) => s + Number(p.amountCedis), 0);
  const maxForThis = total - otherPaid;
  if (input.amountCedis > maxForThis + 0.009) {
    return {
      success: false,
      error: `Amount exceeds remaining balance for this bill (max ₵${maxForThis.toFixed(2)}).`,
    };
  }

  try {
    await prisma.feePayment.update({
      where: { id: input.id },
      data: {
        amountCedis: toDecimal(input.amountCedis),
        paidAt: input.paidAt,
      },
    });
    revalidatePath("/list/fees");
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not update payment." };
  }
}

export async function deleteFeePayment(id: number): Promise<{
  success: boolean;
  error: string | null;
}> {
  const role = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can delete payments." };
  }
  try {
    await prisma.feePayment.delete({ where: { id } });
    revalidatePath("/list/fees");
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Could not delete payment." };
  }
}

export async function updateFeeSchedule(input: {
  id: number;
  totalBillCedis: number;
  academicYear: string;
  term: "TERM_1" | "TERM_2" | "TERM_3";
}): Promise<{ success: boolean; error: string | null }> {
  const role = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can edit fee schedules." };
  }
  if (input.totalBillCedis <= 0) {
    return { success: false, error: "Total bill must be greater than zero." };
  }
  const year = input.academicYear.trim();
  if (!year) {
    return { success: false, error: "Academic year is required." };
  }

  const schedule = await prisma.feeSchedule.findUnique({
    where: { id: input.id },
    include: {
      assignments: { include: { payments: true } },
    },
  });
  if (!schedule) {
    return { success: false, error: "Fee schedule not found." };
  }

  const maxPaidOnAnyAssignment = schedule.assignments.reduce((max, assignment) => {
    const paid = assignment.payments.reduce(
      (sum, payment) => sum + Number(payment.amountCedis),
      0
    );
    return Math.max(max, paid);
  }, 0);

  if (input.totalBillCedis + 0.009 < maxPaidOnAnyAssignment) {
    return {
      success: false,
      error: `Total bill cannot be less than payments already recorded (max ₵${maxPaidOnAnyAssignment.toFixed(2)}).`,
    };
  }

  try {
    const total = toDecimal(input.totalBillCedis);
    await prisma.$transaction(async (tx) => {
      await tx.feeSchedule.update({
        where: { id: input.id },
        data: {
          academicYear: year,
          term: input.term,
          totalBillCedis: total,
        },
      });
      await tx.studentFeeAssignment.updateMany({
        where: { feeScheduleId: input.id },
        data: { totalBillCedis: total },
      });
    });
    revalidatePath("/list/fees");
    return { success: true, error: null };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      return {
        success: false,
        error: "A fee for this class, academic year, and term already exists.",
      };
    }
    console.error(e);
    return { success: false, error: "Could not update fee schedule." };
  }
}

export async function deleteFeeSchedule(id: number): Promise<{
  success: boolean;
  error: string | null;
}> {
  const role = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can delete fee schedules." };
  }

  const schedule = await prisma.feeSchedule.findUnique({
    where: { id },
    include: {
      assignments: { include: { payments: true } },
    },
  });
  if (!schedule) {
    return { success: false, error: "Fee schedule not found." };
  }

  try {
    await prisma.feeSchedule.delete({ where: { id } });
    revalidatePath("/list/fees");
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not delete fee schedule." };
  }
}
