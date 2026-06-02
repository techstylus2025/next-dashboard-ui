"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "./prisma";

const EVENTS_PATH = "/list/events";

export async function createEvent(input: {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  classId?: number | null;
}) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { success: false, error: "Only administrators can create events." };
  }

  const title = input.title.trim();
  if (!title) {
    return { success: false, error: "Title is required." };
  }

  try {
    const start = new Date(`${input.date}T${input.startTime}`);
    const end = new Date(`${input.date}T${input.endTime}`);

    await prisma.event.create({
      data: {
        title,
        description: input.description?.trim() ?? "",
        startTime: start,
        endTime: end,
        classId: input.classId ?? null,
      },
    });
    revalidatePath(EVENTS_PATH);
    revalidatePath("/", "layout");
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not create event." };
  }
}

export async function updateEvent(input: {
  id: number;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  classId?: number | null;
}) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { success: false, error: "Only administrators can update events." };
  }

  try {
    const start = new Date(`${input.date}T${input.startTime}`);
    const end = new Date(`${input.date}T${input.endTime}`);

    await prisma.event.update({
      where: { id: input.id },
      data: {
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        startTime: start,
        endTime: end,
        classId: input.classId ?? null,
      },
    });
    revalidatePath(EVENTS_PATH);
    revalidatePath("/", "layout");
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not update event." };
  }
}

export async function deleteEvent(input: { id: number }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { success: false, error: "Only administrators can delete events." };
  }

  try {
    await prisma.event.delete({ where: { id: input.id } });
    revalidatePath(EVENTS_PATH);
    revalidatePath("/", "layout");
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not delete event." };
  }
}
