import { currentUser } from "@clerk/nextjs/server";
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

const isAdminRole = (role: string | undefined): role is "admin" =>
  role === "admin";

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const getSenderName = (
  senderId: string,
  senderRole: UserRoleSlug,
  parentMap: Map<string, string>,
  teacherMap: Map<string, string>
) => {
  if (senderRole === "admin") return "Admin";
  if (senderRole === "parent") return parentMap.get(senderId) ?? "Parent";
  if (senderRole === "teacher") return teacherMap.get(senderId) ?? "Teacher";
  return "User";
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
  const parents = await prisma.parent.findMany({
    select: { id: true, name: true, surname: true },
  });

  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, surname: true },
  });

  const parentMap = new Map<string, string>(
    parents.map((parent) => [parent.id, `${parent.name} ${parent.surname}`])
  );
  const teacherMap = new Map<string, string>(
    teachers.map((teacher) => [teacher.id, `${teacher.name} ${teacher.surname}`])
  );

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          senderId: ADMIN_ID,
          senderRole: UserRole.ADMIN,
        },
        {
          recipientId: ADMIN_ID,
          recipientRole: UserRole.ADMIN,
          readAt: null,
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

  // Do NOT pre-register all parents and teachers - only show unread threads


  for (const message of messages) {
    const isOutgoing = message.senderId === ADMIN_ID;
    const counterpartId = isOutgoing ? message.recipientId : message.senderId;
    const counterpartRole = isOutgoing
      ? enumToClientRole(message.recipientRole)
      : enumToClientRole(message.senderRole);
    const threadKey = `${counterpartRole}-${counterpartId}`;

    if (!threadsByKey.has(threadKey)) {
      const title =
        counterpartRole === "parent"
          ? parentMap.get(counterpartId)
          : teacherMap.get(counterpartId);
      registerPeer(
        counterpartId,
        counterpartRole,
        title ?? "Unknown user",
        counterpartRole === "parent"
          ? "Parent conversation"
          : "Teacher conversation"
      );
    }

    const senderName = getSenderName(
      message.senderId,
      enumToClientRole(message.senderRole),
      parentMap,
      teacherMap
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

    if (message.recipientId === ADMIN_ID && !message.readAt) {
      thread.unread += 1;
    }
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
        { senderId: userId },
        { recipientId: userId },
        { senderId: ADMIN_ID, recipientId: userId },
        { senderId: userId, recipientId: ADMIN_ID },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const adminMessages: ChatMessage[] = [];
  const complaintMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (
      message.senderId !== ADMIN_ID &&
      message.recipientId !== ADMIN_ID &&
      message.senderId !== userId &&
      message.recipientId !== userId
    ) {
      continue;
    }

    const senderRole = enumToClientRole(message.senderRole);
    const senderName = senderRole === "admin" ? "Admin" : "You";
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

    if (message.type === MessageType.COMPLAINT) {
      complaintMessages.push(formatted);
    } else {
      adminMessages.push(formatted);
    }
  }

  const threads: ChatThread[] = [
    {
      id: "admin",
      title: "School Admin",
      subtitle: "Chat with the administration team",
      unread: adminMessages.filter((msg) => msg.recipientId === userId).length,
      messages: adminMessages,
      counterpartId: ADMIN_ID,
      counterpartRole: "admin",
    },
  ];

  if (role === "parent") {
    threads.push({
      id: "complaint",
      title: "Complaints",
      subtitle: "Report a concern to the admin",
      unread: complaintMessages.filter((msg) => msg.recipientId === ADMIN_ID).length,
      messages: complaintMessages,
      isComplaint: true,
      counterpartId: ADMIN_ID,
      counterpartRole: "admin",
    });
  }

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

export async function getCurrentMessages(userId: string, role: UserRoleSlug) {
  const user = await currentUser();
  if (!user) return [];

  if (role === "admin") {
    return getAdminMessageThreads();
  }
  return getUserMessageThreads(userId, role);
}

export async function markMessageAsRead(messageId: number): Promise<void> {
  await prisma.message.update({
    where: { id: messageId },
    data: { readAt: new Date() },
  });
}

export async function getAllParentsAndTeachers() {
  const parents = await prisma.parent.findMany({
    select: { id: true, name: true, surname: true },
  });
  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, surname: true },
  });
  return { parents, teachers };
}

