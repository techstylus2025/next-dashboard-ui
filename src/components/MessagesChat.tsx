"use client";

import { useState } from "react";
import type { ChatMessage, ChatThread } from "@/lib/messageActions";

type MessagesChatProps = {
  role: string;
  currentUserId: string;
  currentName: string;
  initialThreads: ChatThread[];
  allParents?: Array<{ id: string; name: string; surname: string }>;
  allTeachers?: Array<{ id: string; name: string; surname: string }>;
};

const MessagesChat = ({
  role,
  currentUserId,
  currentName,
  initialThreads,
  allParents = [],
  allTeachers = [],
}: MessagesChatProps) => {
  const isAdmin = role === "admin";
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState(
    initialThreads[0]?.id ?? ""
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(isAdmin && initialThreads.length === 0);

  const activeThread =
    threads.find((thread) => thread.id === activeThreadId) || threads[0];

  const parentThreads = threads.filter(
    (thread) => thread.counterpartRole === "parent"
  );
  const teacherThreads = threads.filter(
    (thread) => thread.counterpartRole === "teacher"
  );

  const filteredParents = allParents.filter(
    (p) =>
      `${p.name} ${p.surname}`.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !threads.some((t) => t.counterpartId === p.id)
  );
  const filteredTeachers = allTeachers.filter(
    (t) =>
      `${t.name} ${t.surname}`.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !threads.some((th) => th.counterpartId === t.id)
  );

  const getInitials = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "U";
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const avatarColor = (name: string) => {
    const code = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "bg-sky-600",
      "bg-indigo-600",
      "bg-emerald-600",
      "bg-violet-600",
      "bg-amber-600",
      "bg-rose-600",
    ];
    return colors[code % colors.length];
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    const thread = threads.find((t) => t.id === threadId);
    if (thread?.unread && thread.unread > 0) {
      for (const msg of thread.messages) {
        if (msg.recipientId === currentUserId && msg.senderId !== currentUserId) {
          fetch("/api/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: msg.id }),
          }).catch((err) => console.error("Failed to mark message as read", err));
        }
      }
    }
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId ? { ...thread, unread: 0 } : thread
      )
    );
  };

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !activeThread) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
          senderRole: role,
          recipientId: activeThread.counterpartId,
          recipientRole: activeThread.counterpartRole,
          text: trimmed,
          type: activeThread.isComplaint ? "complaint" : "message",
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Unable to send message");
      }

      const message: ChatMessage = await response.json();
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === activeThread.id
            ? {
                ...thread,
                messages: [...thread.messages, message],
                unread: 0,
              }
            : thread
        )
      );
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 md:h-[76vh] md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_290px]">
      <section className="space-y-4 rounded-[1.75rem] border border-slate-200/80 bg-slate-50/80 p-3 shadow-sm sm:p-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Conversations</p>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? "Send direct messages to parents and teachers."
                  : "Reply to admin or submit a complaint."}
              </p>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              {threads.reduce((sum, thread) => sum + thread.unread, 0)} new
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="w-full rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-200 transition"
            >
              + New Message
            </button>
            {showSearch && (
              <input
                type="text"
                placeholder="Search parents or teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            )}
          </div>
        )}

        <div className="space-y-3">
          {isAdmin && showSearch && (
            <div className="space-y-3">
              {searchQuery && filteredParents.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Available Parents
                  </h3>
                  <div className="space-y-2">
                    {filteredParents.map((parent) => (
                      <button
                        key={parent.id}
                        type="button"
                        onClick={() => {
                          const newThread: ChatThread = {
                            id: `parent-${parent.id}`,
                            title: `${parent.name} ${parent.surname}`,
                            subtitle: "Parent conversation",
                            unread: 0,
                            messages: [],
                            counterpartId: parent.id,
                            counterpartRole: "parent",
                          };
                          setThreads([...threads, newThread]);
                          setActiveThreadId(newThread.id);
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-sky-300 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {parent.name} {parent.surname}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">No messages yet</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchQuery && filteredTeachers.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Available Teachers
                  </h3>
                  <div className="space-y-2">
                    {filteredTeachers.map((teacher) => (
                      <button
                        key={teacher.id}
                        type="button"
                        onClick={() => {
                          const newThread: ChatThread = {
                            id: `teacher-${teacher.id}`,
                            title: `${teacher.name} ${teacher.surname}`,
                            subtitle: "Teacher conversation",
                            unread: 0,
                            messages: [],
                            counterpartId: teacher.id,
                            counterpartRole: "teacher",
                          };
                          setThreads([...threads, newThread]);
                          setActiveThreadId(newThread.id);
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-sky-300 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {teacher.name} {teacher.surname}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">No messages yet</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchQuery && filteredParents.length === 0 && filteredTeachers.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">No matches found</p>
                </div>
              )}
            </div>
          )}
          {isAdmin && !showSearch && threads.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">No unread messages</p>
              <p className="mt-2 text-xs text-slate-400">Click &quot;New Message&quot; to start a conversation</p>
            </div>
          )}
          {isAdmin && !showSearch && parentThreads.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                Parent threads
              </h3>
              <div className="space-y-2">
                {parentThreads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => handleSelectThread(thread.id)}
                    className={`chat-thread-item ${
                      activeThread?.id === thread.id
                        ? 'chat-thread-item-active'
                        : 'chat-thread-item-default'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(thread.title)}`}>
                        {getInitials(thread.title)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="chat-thread-title">{thread.title}</p>
                          {thread.unread > 0 && (
                            <span className="chat-unread-badge">{thread.unread}</span>
                          )}
                        </div>
                        <p className="chat-thread-sub">{thread.subtitle}</p>
                        <p className="chat-thread-snippet">
                          {thread.messages[thread.messages.length - 1]?.text}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isAdmin && !showSearch && teacherThreads.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                Teacher threads
              </h3>
              <div className="space-y-2">
                {teacherThreads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => handleSelectThread(thread.id)}
                    className={`chat-thread-item ${
                      activeThread?.id === thread.id
                        ? 'chat-thread-item-active'
                        : 'chat-thread-item-default'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(thread.title)}`}>
                        {getInitials(thread.title)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="chat-thread-title">{thread.title}</p>
                          {thread.unread > 0 && (
                            <span className="chat-unread-badge">{thread.unread}</span>
                          )}
                        </div>
                        <p className="chat-thread-sub">{thread.subtitle}</p>
                        <p className="chat-thread-snippet">
                          {thread.messages[thread.messages.length - 1]?.text}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="space-y-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => handleSelectThread(thread.id)}
                  className={`chat-thread-item ${
                    activeThread?.id === thread.id
                      ? 'chat-thread-item-active'
                      : 'chat-thread-item-default'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(thread.title)}`}>
                      {getInitials(thread.title)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="chat-thread-title">{thread.title}</p>
                        {thread.unread > 0 && (
                          <span className="chat-unread-badge">{thread.unread}</span>
                        )}
                      </div>
                      <p className="chat-thread-sub">{thread.subtitle}</p>
                      <p className="chat-thread-snippet">
                        {thread.messages[thread.messages.length - 1]?.text}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(activeThread?.title ?? currentName)}`}>
              {getInitials(activeThread?.title ?? currentName)}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                {activeThread?.title}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {activeThread?.subtitle}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {activeThread?.messages.length} messages
          </span>
        </div>

        <div className="chat-messages">
          {activeThread?.messages.map((message) => {
            const fromMe = message.senderId === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${fromMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`chat-bubble ${fromMe ? 'chat-bubble--me' : 'chat-bubble--them'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold">
                      {fromMe ? "You" : message.senderName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {message.createdAt}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line">{message.text}</p>
                  {message.type === "complaint" && (
                    <span className="mt-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                      Complaint
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4">
          {error ? (
            <p className="mb-3 text-sm text-rose-600">{error}</p>
          ) : null}
          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                activeThread?.isComplaint
                  ? "Write your complaint in detail..."
                  : "Type a new message..."
              }
              className="chat-input"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !draft.trim()}
              className="chat-send-btn"
              aria-label="Send message"
              title="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <aside className="hidden space-y-4 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm xl:block">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Quick overview</p>
          <dl className="mt-4 grid gap-3">
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Open threads
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">
                {threads.length}
              </dd>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <dt className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Unread messages
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">
                {threads.reduce((sum, thread) => sum + thread.unread, 0)}
              </dd>
            </div>
          </dl>
        </div>

        {!isAdmin ? (
          <div className="rounded-3xl bg-sky-700 p-4 text-white shadow-lg">
            <p className="text-sm font-semibold">Need to complain?</p>
            <p className="mt-2 text-sm text-sky-100">
              Use the complaint thread to notify admin about urgent issues and
              service problems.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-50 p-4 text-slate-700">
            <p className="text-sm font-semibold">Admin action</p>
            <p className="mt-2 text-sm text-slate-500">
              Choose a parent or teacher thread to send a targeted message.
              Complaint messages are labeled for easy review.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default MessagesChat;
