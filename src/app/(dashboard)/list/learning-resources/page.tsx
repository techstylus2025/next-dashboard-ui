import LearningResourcesLibrary from "@/components/learning-resources/LearningResourcesLibrary";
import { getCurrentAuthContext } from "@/lib/auth";
import { getDashboardPath } from "@/lib/dashboard";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function LearningResourcesPage() {
  const { userId, role } = await getCurrentAuthContext();
  if (!userId || !role) redirect("/sign-in");
  if (role !== "admin" && role !== "teacher") redirect(getDashboardPath(role));

  const [classes, resources] = await Promise.all([
    role === "admin"
      ? prisma.class.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve([]),
    prisma.lessonLearningResource.findMany({
      orderBy: [{ class: { name: "asc" } }, { title: "asc" }],
      include: {
        class: { select: { name: true } },
        lesson: {
          select: {
            name: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return (
    <LearningResourcesLibrary
      role={role}
      classes={classes}
      resources={resources.map((resource) => ({
        ...resource,
        createdAt: resource.createdAt.toISOString(),
      }))}
    />
  );
}
