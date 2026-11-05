import AccessControlManagement from "@/components/admin/AccessControlManagement";
import { getCurrentAuthContext } from "@/lib/auth";
import { loadAccessControlSettings } from "@/lib/accessControl";
import { redirect } from "next/navigation";

export default async function AccessControlPage() {
  const auth = await getCurrentAuthContext();
  if (!auth.userId || auth.role !== "admin") {
    redirect(auth.role ? `/${auth.role}` : "/sign-in");
  }

  const accessSettings = await loadAccessControlSettings();

  return (
    <main className="min-h-full space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <AccessControlManagement
        maintenanceMode={accessSettings.maintenanceMode}
        deniedRoles={accessSettings.deniedRoles}
        deniedUsers={accessSettings.deniedUsers}
      />
    </main>
  );
}
