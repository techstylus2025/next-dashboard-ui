import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export const FEE_PAGE_ACCESS_COOKIE = "fee_page_access";
export const FEE_PAGE_ACCESS_TTL_SECONDS = 15 * 60;

export async function hasFeePageAccess(userId: string | null) {
  if (!userId) return false;

  const token = (await cookies()).get(FEE_PAGE_ACCESS_COOKIE)?.value;
  if (!token) return false;

  const session = await prisma.session.findFirst({
    where: {
      token,
      userId,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  return Boolean(session);
}
