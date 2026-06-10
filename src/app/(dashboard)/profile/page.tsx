import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import ProfileUpdateForm from "@/components/ProfileUpdateForm";
import { getProfilePageData, getUserPendingPasswordRequest } from "@/lib/profileActions";
import type { UserRoleSlug } from "@/lib/messageActions";

const ProfilePage = async () => {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="p-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">You must be signed in to view your profile.</p>
        </div>
      </div>
    );
  }

  const role = (user.publicMetadata.role as UserRoleSlug | undefined) ?? "parent";
  const profileData = await getProfilePageData(user.id, role);
  const pendingRequest = await getUserPendingPasswordRequest(user.id);

  if (!profileData) {
    return (
      <div className="p-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Unable to load your profile details.</p>
        </div>
      </div>
    );
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.fullName || user.username || "User";
  const profile = profileData.profile;

  type DetailRow = { label: string; value: string | number };
  type DetailSection = { title: string; rows: DetailRow[] };

  const summaryItems = [
    { label: "Role", value: profileData.role },
    { label: "Username", value: profile.username },
    { label: "Email", value: profile.email ?? user.emailAddresses?.[0]?.emailAddress ?? "Not set" },
    { label: "Phone", value: profile.phone ?? "Not set" },
    { label: "Birthday", value: profile.birthday ? new Date(profile.birthday).toLocaleDateString() : "Not set" },
  ];

  const detailSections: DetailSection[] = [];

  if (role === "student") {
    summaryItems.push({ label: "Class", value: profile.class?.name ?? "Unknown" });
    summaryItems.push({ label: "Grade", value: profile.grade?.level ?? "Unknown" });
    if (profile.parent) {
      summaryItems.push({ label: "Parent", value: `${profile.parent.name} ${profile.parent.surname}` });
    }
  }

  if (role === "teacher") {
    summaryItems.push({ label: "Subjects", value: profile.subjects?.map((subject: any) => subject.name).join(", ") || "None" });
    summaryItems.push({ label: "Classes", value: profile.classes?.map((klass: any) => klass.name).join(", ") || "None" });
  }

  if (role === "parent") {
    summaryItems.push({ label: "Children", value: profile.students?.length ?? 0 });
  }

  if (role === "admin") {
    summaryItems.push({ label: "Managed users", value: `${profileData.counts?.students ?? 0} students, ${profileData.counts?.teachers ?? 0} teachers, ${profileData.counts?.parents ?? 0} parents` });
  }
  
  if (role === "student") {
    detailSections.push({
      title: "Recent grades",
      rows: profile.results?.map((result: any) => ({
        label: result.lesson?.subject?.name ?? "Subject",
        value: `Score: ${result.score} • ${result.remark ?? "No remark"}`,
      })) ?? [],
    });
    detailSections.push({
      title: "Recent attendance",
      rows: profile.attendances?.map((attendance: any) => ({
        label: new Date(attendance.date).toLocaleDateString(),
        value: attendance.present ? "Present" : "Absent",
      })) ?? [],
    });
    detailSections.push({
      title: "Fee assignments",
      rows: profile.feeAssignments?.map((assignment: any) => ({
        label: `${assignment.feeSchedule?.class?.name ?? "Class"} • ${assignment.feeSchedule?.academicYear}`,
        value: `${assignment.feeSchedule?.term ?? "Term"} • ₵${assignment.totalBillCedis}`,
      })) ?? [],
    });
  }

  if (role === "teacher") {
    detailSections.push({
      title: "Pending lesson uploads",
      rows: profile.examQuestionUploads?.slice(0, 6).map((upload: any) => ({
        label: upload.title,
        value: upload.status.toLowerCase(),
      })) ?? [],
    });
    detailSections.push({
      title: "Recent lessons",
      rows: profile.lessons?.slice(0, 6).map((lesson: any) => ({
        label: lesson.title ?? "Lesson",
        value: lesson.class?.name ?? "Class not set",
      })) ?? [],
    });
  }

  if (role === "parent") {
    detailSections.push({
      title: "Children",
      rows: profile.students?.map((student: any) => ({
        label: `${student.name} ${student.surname}`,
        value: `${student.class?.name ?? "Class"} • Grade ${student.grade?.level ?? "?"}`,
      })) ?? [],
    });
    detailSections.push({
      title: "Recent book orders",
      rows: profile.bookOrders?.map((order: any) => ({
        label: `Order #${order.id}`,
        value: `${order.status} • ${new Date(order.createdAt).toLocaleDateString()}`,
      })) ?? [],
    });
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white shadow-xl shadow-slate-900/10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Profile</p>
          <h1 className="mt-4 text-3xl font-semibold">{displayName}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Here is your full profile summary, with the most important records and academic details linked to your account.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Account summary</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Core account details and the most relevant profile information for your role.
                  </p>
                </div>
                {profile.img ? (
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                    <Image src={profile.img} alt="Profile avatar" width={120} height={120} className="h-28 w-28 object-cover" />
                  </div>
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
                    No profile photo
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {summaryItems.map((item) => (
                  <div key={item.label} className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {detailSections.map((section) => (
              <section key={section.title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">A quick view of your most recent related records.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {section.rows.length} items
                  </span>
                </div>
                <div className="space-y-3">
                  {section.rows.length > 0 ? (
                    section.rows.map((row) => (
                      <div key={`${row.label}-${row.value}`} className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-900">{row.label}</p>
                        <p className="mt-1 text-sm text-slate-500">{row.value}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No records available yet.</p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <aside className="space-y-6">
            <ProfileUpdateForm initialData={{ username: profile.username, img: profile.img }} pendingRequest={pendingRequest} />

            {pendingRequest ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
                Your password change request is pending approval. It was submitted on {new Date(pendingRequest.requestedAt).toLocaleString()}.
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
