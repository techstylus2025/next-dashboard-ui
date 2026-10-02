import MessagesChat from "@/components/MessagesChat";
import type { UserRoleSlug } from "@/lib/messageActions";
import { getCurrentAuthContext } from "@/lib/auth";
import {
  ADMIN_ID,
  getAdminMessageThreads,
  getUserMessageThreads,
  getAllConversationUsers,
  getMessageUserName,
} from "@/lib/messageActions";
import { redirect } from "next/navigation";

const MessagesPage = async () => {
  const authContext = await getCurrentAuthContext();
  const role = authContext.role as UserRoleSlug | null;
  if (!authContext.userId || !role || !["admin", "teacher", "parent", "student"].includes(role)) {
    redirect("/sign-in");
  }
  const displayName = await getMessageUserName(authContext.userId, role);
  const currentUserId = role === "admin" ? ADMIN_ID : authContext.userId;

  const threads =
    role === "admin"
      ? await getAdminMessageThreads()
      : await getUserMessageThreads(currentUserId, role);

  const contacts =
    role === "admin" ? await getAllConversationUsers() : [];

  return (
    <div className="min-h-full bg-slate-50 p-3 sm:p-5">
      <MessagesChat
        role={role}
        currentUserId={currentUserId}
        currentName={displayName}
        initialThreads={threads}
        contacts={contacts}
      />
    </div>
  );
};

export default MessagesPage;

