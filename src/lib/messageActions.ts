import { MessageType, UserRole } from "@prisma/client";
import prisma from "./prisma";

export type UserRoleSlug = "admin" | "teacher" | "parent" | "student";
export type ClientMessageType = "message" | "complaint";

export const ADMIN_ID = "admin";

export type ChatMessage = {
  id: number;
  senderId: string;
  senderRole: UserRoleSlug;
  senderName: string;
  recipientId: string;
  recipientRole: UserRoleSlug;
  text: string;
  type: ClientMessageType;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  title: string;
  subtitle: string;
  unread: number;
  messages: ChatMessage[];
  isComplaint?: boolean;
  counterpartId: string;
  counterpartRole: UserRoleSlug;
};

export type MessageContact = {
  id: string;
  name: string;
  role: Exclude<UserRoleSlug, "admin">;
};

const roleToEnum = (role: UserRoleSlug): UserRole => {
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

const enumToClientRole = (role: UserRole): UserRoleSlug => {
  switch (role) {
    case UserRole.ADMIN:
      return "admin";
    case UserRole.TEACHER:
      return "teacher";
    case UserRole.PARENT:
      return "parent";
    case UserRole.STUDENT:
      return "student";
  }
};

const enumToClientMessageType = (type: MessageType): ClientMessageType =>
  type === MessageType.COMPLAINT ? "complaint" : "message";

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const getSenderName = (
  senderId: string,
  senderRole: UserRoleSlug,
  parentMap: Map<string, string>,
  teacherMap: Map<string, string>,
  studentMap: Map<string, string>
) => {
  if (senderRole === "admin") return "Admin";
  if (senderRole === "parent") return parentMap.get(senderId) ?? "Parent";
  if (senderRole === "teacher") return teacherMap.get(senderId) ?? "Teacher";
  return studentMap.get(senderId) ?? "Student";
};

export async function getUnreadMessageCount(
  userId: string,
  role: UserRoleSlug
): Promise<number> {
  if (role === "admin") {
    return prisma.message.count({
      where: {
        recipientId: ADMIN_ID,
        recipientRole: UserRole.ADMIN,
        readAt: null,
      },
    });
  }

  return prisma.message.count({
    where: {
      recipientId: userId,
      readAt: null,
    },
  });
}

export async function getAdminMessageThreads(): Promise<ChatThread[]> {
  const [parents, teachers, students] = await Promise.all([
    prisma.parent.findMany({
      where: { isArchived: false },
      select: { id: true, name: true, surname: true },
    }),
    prisma.teacher.findMany({
      where: { isArchived: false },
      select: { id: true, name: true, surname: true },
    }),
    prisma.student.findMany({
      where: { isArchived: false },
      select: { id: true, name: true, surname: true },
    }),
  ]);

  const parentMap = new Map<string, string>(
    parents.map((parent) => [parent.id, `${parent.name} ${parent.surname}`])
  );
  const teacherMap = new Map<string, string>(
    teachers.map((teacher) => [teacher.id, `${teacher.name} ${teacher.surname}`])
  );
  const studentMap = new Map<string, string>(
    students.map((student) => [student.id, `${student.name} ${student.surname}`])
  );

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          senderId: ADMIN_ID,
          senderRole: UserRole.ADMIN,
          recipientRole: { not: UserRole.ADMIN },
        },
        {
          recipientId: ADMIN_ID,
          recipientRole: UserRole.ADMIN,
          senderRole: { not: UserRole.ADMIN },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const threadsByKey = new Map<string, ChatThread>();

  const registerPeer = (
    counterpartId: string,
    counterpartRole: UserRoleSlug,
    title: string,
    subtitle: string
  ) => {
    const key = `${counterpartRole}-${counterpartId}`;
    if (!threadsByKey.has(key)) {
      threadsByKey.set(key, {
        id: key,
        title,
        subtitle,
        unread: 0,
        messages: [],
        counterpartId,
        counterpartRole,
      });
    }
  };

  for (const message of messages) {
    const isOutgoing = message.senderId === ADMIN_ID;
    const counterpartId = isOutgoing ? message.recipientId : message.senderId;
    const counterpartRole = isOutgoing
      ? enumToClientRole(message.recipientRole)
      : enumToClientRole(message.senderRole);
    const threadKey = `${counterpartRole}-${counterpartId}`;

    if (!threadsByKey.has(threadKey)) {
      const title = counterpartRole === "parent"
        ? parentMap.get(counterpartId)
        : counterpartRole === "teacher"
          ? teacherMap.get(counterpartId)
          : studentMap.get(counterpartId);
      registerPeer(
        counterpartId,
        counterpartRole,
        title ?? "Unknown user",
        `${counterpartRole[0].toUpperCase()}${counterpartRole.slice(1)} conversation`
      );
    }

    const senderName = getSenderName(
      message.senderId,
      enumToClientRole(message.senderRole),
      parentMap,
      teacherMap,
      studentMap
    );
    const thread = threadsByKey.get(threadKey)!;
    thread.messages.push({
      id: message.id,
      senderId: message.senderId,
      senderRole: enumToClientRole(message.senderRole),
      senderName,
      recipientId: message.recipientId,
      recipientRole: enumToClientRole(message.recipientRole),
      text: message.text,
      type: enumToClientMessageType(message.type),
      createdAt: formatTime(message.createdAt),
    });

    if (message.recipientId === ADMIN_ID && !message.readAt) thread.unread += 1;
  }

  return Array.from(threadsByKey.values()).sort((a, b) => {
    if (a.unread !== b.unread) return b.unread - a.unread;
    return a.title.localeCompare(b.title);
  });
}

export async function getUserMessageThreads(
  userId: string,
  role: UserRoleSlug
): Promise<ChatThread[]> {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: ADMIN_ID, senderRole: UserRole.ADMIN, recipientId: userId, recipientRole: roleToEnum(role) },
        { senderId: userId, senderRole: roleToEnum(role), recipientId: ADMIN_ID, recipientRole: UserRole.ADMIN },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const adminMessages: ChatMessage[] = [];
  let unread = 0;

  for (const message of messages) {
    const senderRole = enumToClientRole(message.senderRole);
    const senderName = senderRole === "admin" ? "Admin" : "You";
    if (message.recipientId === userId && !message.readAt) unread += 1;
    const formatted: ChatMessage = {
      id: message.id,
      senderId: message.senderId,
      senderRole,
      senderName,
      recipientId: message.recipientId,
      recipientRole: enumToClientRole(message.recipientRole),
      text: message.text,
      type: enumToClientMessageType(message.type),
      createdAt: formatTime(message.createdAt),
    };

    adminMessages.push(formatted);
  }

  const threads: ChatThread[] = [
    {
      id: "admin",
      title: "School Admin",
      subtitle: "Chat with the administration team",
      unread,
      messages: adminMessages,
      counterpartId: ADMIN_ID,
      counterpartRole: "admin",
    },
  ];

  return threads;
}

export async function createMessage(input: {
  senderId: string;
  senderRole: UserRoleSlug;
  recipientId: string;
  recipientRole: UserRoleSlug;
  text: string;
  type: ClientMessageType;
}) {
  if (
    (input.senderRole === "admin" && (input.senderId !== ADMIN_ID || input.recipientRole === "admin")) ||
    (input.senderRole !== "admin" && (input.recipientId !== ADMIN_ID || input.recipientRole !== "admin"))
  ) {
    throw new Error("Conversations must be between an administrator and one other user.");
  }

  if (input.senderRole === "admin") {
    if (input.recipientRole === "admin") throw new Error("Admin conversations must have one non-admin recipient.");
    const recipientExists = await findNonAdminUser(input.recipientId, input.recipientRole);
    if (!recipientExists) throw new Error("Conversation recipient was not found.");
  } else if (!(await findNonAdminUser(input.senderId, input.senderRole))) {
    throw new Error("Conversation sender was not found.");
  }

  const message = await prisma.message.create({
    data: {
      senderId: input.senderId,
      senderRole: roleToEnum(input.senderRole),
      recipientId: input.recipientId,
      recipientRole: roleToEnum(input.recipientRole),
      text: input.text,
      type:
        input.type === "complaint" ? MessageType.COMPLAINT : MessageType.MESSAGE,
    },
  });

  return {
    id: message.id,
    senderId: message.senderId,
    senderRole: enumToClientRole(message.senderRole),
    senderName: input.senderRole === "admin" ? "Admin" : "You",
    recipientId: message.recipientId,
    recipientRole: enumToClientRole(message.recipientRole),
    text: message.text,
    type: enumToClientMessageType(message.type),
    createdAt: formatTime(message.createdAt),
  };
}

export async function markMessageAsRead(messageId: number, userId: string, role: UserRoleSlug): Promise<boolean> {
  const recipientId = role === "admin" ? ADMIN_ID : userId;
  const result = await prisma.message.updateMany({
    where: {
      id: messageId,
      recipientId,
      recipientRole: roleToEnum(role),
      senderId: role === "admin" ? { not: ADMIN_ID } : ADMIN_ID,
    },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

export async function findNonAdminUser(userId: string, role: Exclude<UserRoleSlug, "admin">) {
  if (role === "parent") {
    return prisma.parent.findFirst({ where: { id: userId, isArchived: false }, select: { id: true } });
  }
  if (role === "teacher") {
    return prisma.teacher.findFirst({ where: { id: userId, isArchived: false }, select: { id: true } });
  }
  return prisma.student.findFirst({ where: { id: userId, isArchived: false }, select: { id: true } });
}

export async function getMessageUserName(userId: string, role: UserRoleSlug): Promise<string> {
  if (role === "admin") return "School Administration";
  const user = await findNonAdminUser(userId, role);
  if (!user) return "User";
  if (role === "parent") {
    const parent = await prisma.parent.findUnique({ where: { id: userId }, select: { name: true, surname: true } });
    return `${parent?.name ?? ""} ${parent?.surname ?? ""}`.trim() || "Parent";
  }
  if (role === "teacher") {
    const teacher = await prisma.teacher.findUnique({ where: { id: userId }, select: { name: true, surname: true } });
    return `${teacher?.name ?? ""} ${teacher?.surname ?? ""}`.trim() || "Teacher";
  }
  const student = await prisma.student.findUnique({ where: { id: userId }, select: { name: true, surname: true } });
  return `${student?.name ?? ""} ${student?.surname ?? ""}`.trim() || "Student";
}

export async function getAllConversationUsers(): Promise<MessageContact[]> {
  const [parents, teachers, students] = await Promise.all([
    prisma.parent.findMany({
      where: { isArchived: false },
      select: { id: true, name: true, surname: true },
    }),
    prisma.teacher.findMany({
      where: { isArchived: false },
      select: { id: true, name: true, surname: true },
    }),
    prisma.student.findMany({
      where: { isArchived: false },
      select: { id: true, name: true, surname: true },
    }),
  ]);
  return [
    ...parents.map((person) => ({ id: person.id, name: `${person.name} ${person.surname}`, role: "parent" as const })),
    ...teachers.map((person) => ({ id: person.id, name: `${person.name} ${person.surname}`, role: "teacher" as const })),
    ...students.map((person) => ({ id: person.id, name: `${person.name} ${person.surname}`, role: "student" as const })),
  ].sort((a, b) => a.name.localeCompare(b.name));
}

