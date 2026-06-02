"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { buildAnnouncementWhere } from "@/lib/announcementQueries";

const ANNOUNCEMENTS_PATH = "/list/announcements";

export async function getAnnouncementCount(): Promise<number> {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  return prisma.announcement.count({
    where: buildAnnouncementWhere(role, userId ?? undefined),
  });
}

export async function createAnnouncement(input: {
  title: string;
  description: string;
  date: string;
  classId?: number | null;
}): Promise<{ success: boolean; error: string | null }> {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { success: false, error: "Only administrators can create announcements." };
  }

  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) {
    return { success: false, error: "Title and description are required." };
  }

  try {
    await prisma.announcement.create({
      data: {
        title,
        description,
        date: new Date(input.date + "T12:00:00"),
        classId: input.classId ?? null,
      },
    });
    revalidatePath(ANNOUNCEMENTS_PATH);
    revalidatePath("/", "layout");
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not create announcement." };
  }
}

export async function updateAnnouncement(input: {
  id: number;
  title: string;
  description: string;
  date: string;
  classId?: number | null;
}): Promise<{ success: boolean; error: string | null }> {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { success: false, error: "Only administrators can update announcements." };
  }

  try {
    await prisma.announcement.update({
      where: { id: input.id },
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        date: new Date(input.date + "T12:00:00"),
        classId: input.classId ?? null,
      },
    });
    revalidatePath(ANNOUNCEMENTS_PATH);
    revalidatePath("/", "layout");
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not update announcement." };
  }
}

export async function deleteAnnouncement(
  id: number
): Promise<{ success: boolean; error: string | null }> {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { success: false, error: "Only administrators can delete announcements." };
  }

  try {
    await prisma.announcement.delete({ where: { id } });
    revalidatePath(ANNOUNCEMENTS_PATH);
    revalidatePath("/", "layout");
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not delete announcement." };
  }
}
