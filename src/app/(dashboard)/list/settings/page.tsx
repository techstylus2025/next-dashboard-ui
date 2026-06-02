import SettingsManagement from "@/components/settings/SettingsManagement";
import { loadGradingScaleEntries } from "@/lib/gradingData";
import { loadSettingsPageData } from "@/lib/settingsData";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (role !== "admin") {
    redirect(`/${role || "sign-in"}`);
  }

  const [settingsData, gradingEntries] = await Promise.all([
    loadSettingsPageData(),
    loadGradingScaleEntries(),
  ]);

  const academicYears = settingsData.academicYears;

  return (
    <div className="flex-1 m-4 mt-0 min-h-[60vh] rounded-2xl bg-lamaSkyLight">
      <SettingsManagement
        academicYears={academicYears}
        gradingEntries={gradingEntries}
        teachers={settingsData.teachers}
        students={settingsData.students}
        schoolSettings={settingsData.schoolSettings}
        archivedCounts={settingsData.archivedCounts}
      />
    </div>
  );
}
