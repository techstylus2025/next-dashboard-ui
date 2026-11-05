import DashboardShell from "@/components/DashboardShell";
import { getDashboardPath } from "@/lib/dashboard";
import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ClerkProvider } from "@clerk/nextjs";
import type { DashboardUser } from "@/types/auth";
import { getAccessRestriction } from "@/lib/accessControl";
import { redirect } from "next/navigation";
import { getSchoolBranding } from "@/lib/schoolBranding";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession({ skipAccessControl: true });
  const userId = session?.userId ?? session?.user?.id ?? null;
  const role = session?.user?.role ? String(session.user.role).toLowerCase() : undefined;
  if (!session?.user) redirect("/sign-in");
  const restriction = await getAccessRestriction({
    userId: session.user.id,
    username: session.user.username,
    email: session.user.email,
    role,
  });
  if (restriction === "ACCESS_DENIED") redirect("/access-denied");
  if (restriction === "MAINTENANCE_MODE") redirect("/maintenance");

  const homeHref = getDashboardPath(role);
  const school = await getSchoolBranding();
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
        schoolName={school.name}
        schoolLogoUrl={school.logoUrl}
      >
        {children}
      </DashboardShell>
    </ClerkProvider>
  );
}