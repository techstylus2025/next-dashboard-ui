import DashboardShell from "@/components/DashboardShell";
import { getDashboardPath } from "@/lib/dashboard";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const homeHref = getDashboardPath(role);

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
    <DashboardShell
      homeHref={homeHref}
      supervisorClassName={supervisorClassName}
    >
      {children}
    </DashboardShell>
  );
}