import DashboardShell from "@/components/DashboardShell";
import { getDashboardPath } from "@/lib/dashboard";
import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ClerkProvider } from "@clerk/nextjs";
import type { DashboardUser } from "@/types/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();
  const userId = session?.userId ?? session?.user?.id ?? null;
  const role = session?.user?.role ? String(session.user.role).toLowerCase() : undefined;
  const homeHref = getDashboardPath(role);
  const dashboardUser: DashboardUser | null = session?.user
    ? {
        id: session.user.id,
        username: session.user.username,
        role: String(session.user.role).toLowerCase(),
      }
    : null;

  let supervisorClassName: string | null = null;
  if (role === "teacher" && userId) {
    try {
      const supervisorClass = await prisma.class.findFirst({
        where: { supervisorId: userId },
        select: { name: true },
        orderBy: { name: "asc" },
      });
      supervisorClassName = supervisorClass?.name ?? null;
    } catch (error) {
      console.warn("Failed to load supervisor class info:", error);
    }
  }

  return (
    <ClerkProvider>
      <DashboardShell
        homeHref={homeHref}
        supervisorClassName={supervisorClassName}
        customUser={dashboardUser}
      >
        {children}
      </DashboardShell>
    </ClerkProvider>
  );
}