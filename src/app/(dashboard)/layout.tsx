import DashboardShell from "@/components/DashboardShell";
import { getDashboardPath } from "@/lib/dashboard";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // auth() can throw if Clerk environment is not configured. Guard it so the
  // layout can render an informative fallback rather than crashing the page.
  let userId: string | null = null;
  let sessionClaims: any = undefined;
  let authError: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId ?? null;
    sessionClaims = authResult.sessionClaims;
  } catch (err) {
    // Log and continue with undefined role; DashboardShell will render limited view.
    console.warn("Clerk auth() failed in DashboardLayout:", err);
    authError = err instanceof Error ? err.message : String(err);
    userId = null;
    sessionClaims = undefined;
  }

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
      authError={authError}
    >
      {children}
    </DashboardShell>
  );
}