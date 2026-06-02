"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { PrismaClient } from "@prisma/client";

const db = prisma as unknown as PrismaClient;

const BOOKS_PATH = "/list/purchase-books";

async function getRole(): Promise<{ role?: string; userId?: string }> {
  const session = await auth();
  return {
    role: (session?.sessionClaims?.metadata as { role?: string })?.role,
    userId: session?.userId ?? undefined,
  };
}

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

export async function createBook(input: {
  title: string;
  classId: number;
  priceCedis: number;
  quantity: number;
  supplierName: string;
  supplierContact: string;
}): Promise<{ success: boolean; error: string | null }> {
  const { role } = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can add books." };
  }
  if (input.quantity < 0 || input.priceCedis <= 0) {
    return { success: false, error: "Invalid price or quantity." };
  }
  try {
    await db.book.create({
      data: {
        title: input.title.trim(),
        classId: input.classId,
        priceCedis: toDecimal(input.priceCedis),
        quantity: input.quantity,
        supplierName: input.supplierName.trim(),
        supplierContact: input.supplierContact.trim(),
      },
    });
    revalidatePath(BOOKS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not create book." };
  }
}

export async function updateBook(input: {
  id: number;
  title: string;
  classId: number;
  priceCedis: number;
  quantity: number;
  supplierName: string;
  supplierContact: string;
}): Promise<{ success: boolean; error: string | null }> {
  const { role } = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can edit books." };
  }
  try {
    await db.book.update({
      where: { id: input.id },
      data: {
        title: input.title.trim(),
        classId: input.classId,
        priceCedis: toDecimal(input.priceCedis),
        quantity: input.quantity,
        supplierName: input.supplierName.trim(),
        supplierContact: input.supplierContact.trim(),
      },
    });
    revalidatePath(BOOKS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not update book." };
  }
}

export async function deleteBook(
  id: number
): Promise<{ success: boolean; error: string | null }> {
  const { role } = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can delete books." };
  }
  try {
    const pendingItems = await db.bookOrderItem.count({
      where: {
        bookId: id,
        order: { status: "PENDING" },
      },
    });
    if (pendingItems > 0) {
      return {
        success: false,
        error: "Cannot delete: book is in pending orders.",
      };
    }
    await db.book.delete({ where: { id } });
    revalidatePath(BOOKS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not delete book." };
  }
}

export async function submitBookOrder(
  items: { bookId: number; quantity: number }[]
): Promise<{ success: boolean; error: string | null }> {
  const { role, userId } = await getRole();
  if (role !== "parent" || !userId) {
    return { success: false, error: "Only parents can place orders." };
  }
  const valid = items.filter((i) => i.quantity > 0);
  if (valid.length === 0) {
    return { success: false, error: "Select at least one book." };
  }

  try {
    const books = await db.book.findMany({
      where: { id: { in: valid.map((i) => i.bookId) } },
    });
    if (books.length !== valid.length) {
      return { success: false, error: "One or more books are unavailable." };
    }
    for (const item of valid) {
      const book = books.find((b) => b.id === item.bookId)!;
      if (book.quantity < item.quantity) {
        return {
          success: false,
          error: `Not enough stock for "${book.title}" (only ${book.quantity} left).`,
        };
      }
    }

    await db.bookOrder.create({
      data: {
        parentId: userId,
        items: {
          create: valid.map((i) => ({
            bookId: i.bookId,
            quantity: i.quantity,
          })),
        },
      },
    });
    revalidatePath(BOOKS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not submit order." };
  }
}

export async function confirmBookOrder(
  orderId: number
): Promise<{ success: boolean; error: string | null }> {
  const { role } = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can confirm orders." };
  }

  try {
    await db.$transaction(async (tx) => {
      const order = await tx.bookOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { book: true } } },
      });
      if (!order || order.status !== "PENDING") {
        throw new Error("INVALID_ORDER");
      }
      for (const item of order.items) {
        if (item.book.quantity < item.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK:${item.book.title}:${item.book.quantity}`
          );
        }
      }
      for (const item of order.items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      await tx.bookOrder.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });
    });
    revalidatePath(BOOKS_PATH);
    return { success: true, error: null };
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message === "INVALID_ORDER") {
        return { success: false, error: "Order not found or already processed." };
      }
      if (e.message.startsWith("INSUFFICIENT_STOCK:")) {
        const [, title, qty] = e.message.split(":");
        return {
          success: false,
          error: `Insufficient stock for "${title}" (only ${qty} available).`,
        };
      }
    }
    console.error(e);
    return { success: false, error: "Could not confirm order." };
  }
}

export async function cancelBookOrder(
  orderId: number
): Promise<{ success: boolean; error: string | null }> {
  const { role } = await getRole();
  if (role !== "admin") {
    return { success: false, error: "Only administrators can cancel orders." };
  }
  try {
    await db.bookOrder.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    revalidatePath(BOOKS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not cancel order." };
  }
}
