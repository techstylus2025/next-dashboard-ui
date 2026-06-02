import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { UserRole, PasswordChangeStatus } from "@prisma/client";
import prisma from "./prisma";
import { createMessage, type UserRoleSlug } from "./messageActions";

const isValidUserRole = (role: unknown): role is UserRoleSlug =>
  role === "admin" || role === "teacher" || role === "parent" || role === "student";

const mapToPrismaUserRole = (role: UserRoleSlug): UserRole => {
  switch (role) {
    case "admin":
      return UserRole.ADMIN;
    case "teacher":
      return UserRole.TEACHER;
    case "parent":
      return UserRole.PARENT;
    case "student":
      return UserRole.STUDENT;
  }
};

export type ProfilePageData = {
  role: UserRoleSlug;
  profile: any;
  counts?: Record<string, number>;
};

export async function getProfilePageData(
  userId: string,
  role: UserRoleSlug
): Promise<ProfilePageData | null> {
  if (!userId) return null;

  if (role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: userId },
      include: {
        class: {
          select: { name: true, grade: { select: { level: true } } },
        },
        grade: { select: { level: true } },
        parent: { select: { id: true, name: true, surname: true, email: true, phone: true } },
        attendances: {
          select: { date: true, present: true },
          orderBy: { date: "desc" },
          take: 8,
        },
        results: {
          select: {
            id: true,
            score: true,
            exam: {
              select: {
                id: true,
                lesson: { select: { subject: { select: { name: true } } } },
              },
            },
            assignment: {
              select: {
                id: true,
                lesson: { select: { subject: { select: { name: true } } } },
              },
            },
          },
          orderBy: { id: "desc" },
          take: 6,
        },
        feeAssignments: {
          select: {
            id: true,
            totalBillCedis: true,
            feeSchedule: {
              select: {
                academicYear: true,
                term: true,
                class: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    return student ? { role, profile: student } : null;
  }

  if (role === "teacher") {
    const teacher = await prisma.teacher.findUnique({
      where: { id: userId },
      include: {
        subjects: { select: { id: true, name: true } },
        classes: { select: { id: true, name: true } },
        lessons: {
          select: { id: true, name: true, class: { select: { name: true } } },
          orderBy: { startTime: "desc" },
          take: 8,
        },
        attendances: {
          select: { date: true, present: true },
          orderBy: { date: "desc" },
          take: 8,
        },
        examQuestionUploads: {
          select: { id: true, title: true, status: true, approvedAt: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        },
      },
    });
    return teacher ? { role, profile: teacher } : null;
  }

  if (role === "parent") {
    const parent = await prisma.parent.findUnique({
      where: { id: userId },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            surname: true,
            class: { select: { name: true } },
            grade: { select: { level: true } },
          },
        },
        bookOrders: {
          select: { id: true, status: true, createdAt: true, updatedAt: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
      },
    });
    return parent ? { role, profile: parent } : null;
  }

  if (role === "admin") {
    const [admin, studentCount, teacherCount, parentCount, pendingRequestCount] = await prisma.$transaction([
      prisma.admin.findUnique({ where: { id: userId } }),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.parent.count(),
      prisma.passwordChangeRequest.count({ where: { status: "PENDING" } }),
    ]);

    const profile = admin
      ? admin
      : {
          id: userId,
          username: userId,
          email: null,
          phone: null,
          img: null,
          birthday: null,
        };

    if (!admin) {
      const clerkUser = await currentUser();
      profile.username = clerkUser?.username ?? userId;
      profile.email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
      profile.phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber ?? null;
      profile.img = clerkUser?.imageUrl ?? null;
    }

    return {
      role,
      profile,
      counts: {
        students: studentCount,
        teachers: teacherCount,
        parents: parentCount,
        pendingPasswordRequests: pendingRequestCount,
      },
    };
  }

  return null;
}

export async function getUserPendingPasswordRequest(userId: string) {
  const pending = await prisma.passwordChangeRequest.findFirst({
    where: { requestedById: userId, status: "PENDING" },
    orderBy: { requestedAt: "desc" },
  });
  if (!pending) return null;
  return {
    id: pending.id,
    requestedAt: pending.requestedAt.toISOString(),
    status: pending.status,
  };
}

export async function getPendingPasswordChangeRequests() {
  const requests = await prisma.passwordChangeRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { requestedAt: "asc" },
  });

  const students = await prisma.student.findMany({
    select: { id: true, name: true, surname: true },
  });
  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, surname: true },
  });
  const parents = await prisma.parent.findMany({
    select: { id: true, name: true, surname: true },
  });
  const admins = await prisma.admin.findMany({
    select: { id: true, username: true },
  });

  const typeMap = new Map<string, string>([
    ...students.map((item) => [item.id, `${item.name} ${item.surname}`]),
    ...teachers.map((item) => [item.id, `${item.name} ${item.surname}`]),
    ...parents.map((item) => [item.id, `${item.name} ${item.surname}`]),
    ...admins.map((item) => [item.id, item.username]),
  ]);

  return requests.map((request) => ({
    id: request.id,
    requestedById: request.requestedById,
    requestedByRole: request.requestedByRole.toLowerCase() as UserRoleSlug,
    requestedAt: request.requestedAt.toISOString(),
    displayName: typeMap.get(request.requestedById) ?? request.requestedById,
    status: request.status,
  }));
}

export async function approvePasswordChangeRequest(
  requestId: number,
  adminId: string,
  reviewComment?: string
) {
  const request = await prisma.passwordChangeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== "PENDING") {
    throw new Error("Password change request not found or already handled.");
  }

  await clerkClient.users.updateUser(request.requestedById, {
    password: request.newPassword,
  });

  await prisma.passwordChangeRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedById: adminId,
      reviewComment: reviewComment ?? null,
    },
  });

  await createMessage({
    senderId: "admin",
    senderRole: "admin",
    recipientId: request.requestedById,
    recipientRole: request.requestedByRole,
    text: "Your password change request has been approved by the administrator.",
    type: "message",
  });
}

export async function rejectPasswordChangeRequest(
  requestId: number,
  adminId: string,
  reviewComment?: string
) {
  const request = await prisma.passwordChangeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== "PENDING") {
    throw new Error("Password change request not found or already handled.");
  }

  await prisma.passwordChangeRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedById: adminId,
      reviewComment: reviewComment ?? null,
    },
  });

  await createMessage({
    senderId: "admin",
    senderRole: "admin",
    recipientId: request.requestedById,
    recipientRole: request.requestedByRole,
    text: "Your password change request has been rejected by the administrator.",
    type: "message",
  });
}

export { isValidUserRole, mapToPrismaUserRole };
