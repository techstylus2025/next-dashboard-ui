import prisma from "@/lib/prisma";

export type ActivityAction = "PAGE_VIEW" | "LOGIN" | "LOGOUT";

export async function createActivityLog(data: {
  userId: string;
  username?: string | null;
  role: string;
  action: ActivityAction;
  path?: string | null;
}) {
  await prisma.activityLog.create({
    data: {
      userId: data.userId,
      username: data.username ?? null,
      role: data.role.toLowerCase(),
      action: data.action,
      path: data.path ?? null,
    },
  });
}
