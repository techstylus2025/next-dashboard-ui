import MessagesChat from "@/components/MessagesChat";
import type { ChatThread, UserRoleSlug } from "@/lib/messageActions";
import {
  ADMIN_ID,
  getAdminMessageThreads,
  getUserMessageThreads,
  getAllParentsAndTeachers,
} from "@/lib/messageActions";
import { currentUser } from "@clerk/nextjs/server";

const MessagesPage = async () => {
  const user = await currentUser();
  const role = (user?.publicMetadata?.role as UserRoleSlug | undefined) ?? "parent";
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.fullName ||
    user?.username ||
    "User";
  const currentUserId = role === "admin" ? ADMIN_ID : user?.id ?? "";

  const threads: ChatThread[] =
    role === "admin"
      ? await getAdminMessageThreads()
      : await getUserMessageThreads(currentUserId, role);

  const { parents, teachers } =
    role === "admin" ? await getAllParentsAndTeachers() : { parents: [], teachers: [] };

  const pageHeading =
    role === "admin"
      ? "Admin Chat Center"
      : role === "teacher"
      ? "Teacher Messaging Hub"
      : "Parent Messaging Hub";

  const pageSubtitle =
    role === "admin"
      ? "View unread messages or search to start a new conversation with parents and teachers."
      : "Reply to admin messages or send feedback and complaints through the same inbox.";

  return (
    <div className="p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-white shadow-lg shadow-slate-900/20">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            Messages
          </p>
          <h1 className="mt-3 text-3xl font-semibold">{pageHeading}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">{pageSubtitle}</p>
        </header>
        <MessagesChat
          role={role}
          currentUserId={currentUserId}
          currentName={displayName}
          initialThreads={threads}
          allParents={parents}
          allTeachers={teachers}
        />
      </div>
    </div>
  );
};

export default MessagesPage;

