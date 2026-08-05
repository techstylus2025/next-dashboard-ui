import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

/** Full client type from generated schema (avoids stale narrowed adapter types). */
const db = prisma as unknown as PrismaClient;

function safeParentName(parent: { name?: string | null; surname?: string | null } | null) {
  if (!parent) return "Unknown parent";
  const name = parent.name?.trim() || "";
  const surname = parent.surname?.trim() || "";
  return [name, surname].filter(Boolean).join(" ") || "Unknown parent";
}

export async function loadPurchaseBooksPageData(
  role: string | undefined,
  userId: string | undefined
) {
  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const booksRaw = await db.book.findMany({
    include: { class: { select: { name: true } } },
    orderBy: [{ class: { name: "asc" } }, { title: "asc" }],
  });

  const canAdmin = role === "admin";
  const isParent = role === "parent";

  const books = booksRaw.map((b) => {
    const className = b.class?.name ?? "Unknown class";
    const base = {
      id: b.id,
      title: b.title,
      publication: b.publication,
      classId: b.classId,
      className,
      price: Number(b.priceCedis),
      quantity: b.quantity,
    };
    if (canAdmin) {
      return {
        ...base,
        supplierName: b.supplierName,
        supplierContact: b.supplierContact,
      };
    }
    return base;
  });

  const ordersRaw =
    canAdmin || (isParent && userId)
      ? await db.bookOrder.findMany({
          where: canAdmin ? {} : { parentId: userId! },
          include: {
            parent: { select: { name: true, surname: true } },
            items: {
              include: {
                book: {
                  include: { class: { select: { name: true } } },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const orders = ordersRaw.map((o) => ({
    id: o.id,
    parentName: safeParentName(o.parent),
    status: o.status,
    pickupCode: o.pickupCode || `BK-${String(o.id).padStart(4, "0")}`,
    createdAt: o.createdAt.toISOString(),
    items: (o.items ?? []).map((item) => ({
      id: item.id,
      bookTitle: item.book?.title ?? "Unknown book",
      className: item.book?.class?.name ?? "Unknown class",
      quantity: item.quantity,
      unitPrice: Number(item.book?.priceCedis ?? 0),
    })),
  }));

  const pendingOrderCount = canAdmin
    ? await db.bookOrder.count({ where: { status: "PENDING" } })
    : 0;

  return {
    classes,
    books,
    orders,
    pendingOrderCount,
    canAdmin,
    isParent,
  };
}
