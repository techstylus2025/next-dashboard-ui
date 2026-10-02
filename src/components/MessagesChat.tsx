"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bell, MessageSquare, Users } from "lucide-react";
import type { ChatMessage, ChatThread, MessageContact, UserRoleSlug } from "@/lib/messageActions";

type MessagesChatProps = {
  role: UserRoleSlug;
  currentUserId: string;
  currentName: string;
  initialThreads: ChatThread[];
  contacts?: MessageContact[];
};

const roleLabel: Record<UserRoleSlug, string> = {
  admin: "Administrator",
  teacher: "Teacher",
  parent: "Parent",
  student: "Student",
};

export default function MessagesChat({
  role,
  currentUserId,
  currentName,
  initialThreads,
  contacts = [],
}: MessagesChatProps) {
  const isAdmin = role === "admin";
  const [threads, setThreads] = useState(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState(initialThreads[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [messageType, setMessageType] = useState<"message" | "complaint">("message");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInboxOnMobile, setShowInboxOnMobile] = useState(true);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? null;
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads.filter((thread) => !query || `${thread.title} ${thread.subtitle}`.toLowerCase().includes(query));
  }, [threads, search]);
  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!isAdmin || !query) return [];
    return contacts.filter((contact) => contact.name.toLowerCase().includes(query));
  }, [contacts, isAdmin, search]);
  const unreadCount = threads.reduce((total, thread) => total + thread.unread, 0);

  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [activeThread?.messages.length]);

  useEffect(() => {
    const refreshThreads = async () => {
      try {
        const response = await fetch("/api/messages/threads", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json() as { threads: ChatThread[] };
        setThreads((current) => {
          const serverThreads = payload.threads ?? [];
          const serverIds = new Set(serverThreads.map((thread) => thread.id));
          const draftThreads = current.filter((thread) => thread.messages.length === 0 && !serverIds.has(thread.id));
          return [...serverThreads, ...draftThreads];
        });
      } catch {
        // Preserve the current transcript when background refresh is unavailable.
      }
    };

    const intervalId = window.setInterval(() => void refreshThreads(), 12000);
    return () => window.clearInterval(intervalId);
  }, []);

  const selectThread = (thread: ChatThread) => {
    setActiveThreadId(thread.id);
    setShowInboxOnMobile(false);
    setError(null);
    if (thread.unread > 0) {
      for (const message of thread.messages) {
        if (message.recipientId !== currentUserId || message.senderId === currentUserId) continue;
        void fetch("/api/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: message.id }),
        });
      }
      setThreads((current) => current.map((item) => item.id === thread.id ? { ...item, unread: 0 } : item));
    }
  };

  const openContact = (contact: MessageContact) => {
    const id = `${contact.role}-${contact.id}`;
    const existing = threads.find((thread) => thread.id === id);
    const thread = existing ?? {
      id,
      title: contact.name,
      subtitle: `${roleLabel[contact.role]} · Direct conversation`,
      unread: 0,
      messages: [],
      counterpartId: contact.id,
      counterpartRole: contact.role,
    } satisfies ChatThread;
    if (!existing) setThreads((current) => [thread, ...current]);
    setActiveThreadId(id);
    setShowInboxOnMobile(false);
    setSearch("");
    setError(null);
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeThread || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: activeThread.counterpartId,
          recipientRole: activeThread.counterpartRole,
          text,
          type: role === "parent" ? messageType : "message",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Unable to send message.");

      const message = payload as ChatMessage;
      setThreads((current) => current.map((thread) => thread.id === activeThread.id
        ? { ...thread, messages: [...thread.messages, message], unread: 0 }
        : thread));
      setDraft("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
      <header className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">School communication</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Messages</h1>
          <p className="mt-1 text-sm text-slate-600">Private conversations between the school administrator and each user.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Bell size={16} aria-hidden="true" />
          <span>{unreadCount} unread</span>
        </div>
      </header>

      <section className="grid min-h-[min(760px,calc(100dvh-190px))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className={`${showInboxOnMobile ? "flex" : "hidden"} min-h-[70dvh] flex-col border-b border-slate-200 bg-slate-50 md:flex md:min-h-0 md:border-b-0 md:border-r`}>
          <div className="space-y-3 border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Inbox</h2>
                <p className="mt-0.5 text-xs text-slate-500">{isAdmin ? "Admin and user conversations" : "Your conversation with admin"}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">{threads.length}</span>
            </div>
            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isAdmin ? "Search people or messages" : "Search messages"} className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </label>
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {filteredThreads.map((thread) => {
              const lastMessage = thread.messages[thread.messages.length - 1];
              const selected = thread.id === activeThreadId;
              return (
                <button key={thread.id} type="button" onClick={() => selectThread(thread)} className={`w-full rounded-md border p-3 text-left transition-colors ${selected ? "border-sky-200 bg-sky-50" : "border-transparent hover:bg-white hover:border-slate-200"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${selected ? "bg-sky-700 text-white" : "bg-slate-200 text-slate-700"}`}>{thread.title.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{thread.title}</span>
                        {thread.unread > 0 ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-700 px-1.5 text-[11px] font-semibold text-white">{thread.unread}</span> : null}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{thread.subtitle}</span>
                      <span className="mt-1 block truncate text-xs text-slate-600">{lastMessage?.text ?? "Start a conversation"}</span>
                    </span>
                  </div>
                </button>
              );
            })}

            {isAdmin && search.trim() ? (
              <div className="border-t border-slate-200 pt-3">
                <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">People</p>
                {filteredContacts.length ? filteredContacts.map((contact) => (
                  <button key={`${contact.role}-${contact.id}`} type="button" onClick={() => openContact(contact)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-white">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">{contact.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">{contact.name}</span>
                      <span className="block text-xs capitalize text-slate-500">{roleLabel[contact.role]}</span>
                    </span>
                    <span className="text-slate-400" aria-hidden="true">+</span>
                  </button>
                )) : <p className="px-3 py-2 text-xs text-slate-500">No matching users.</p>}
              </div>
            ) : null}

            {!filteredThreads.length && !(isAdmin && search.trim()) ? (
              <div className="px-4 py-12 text-center">
                <MessageSquare size={22} className="mx-auto text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-800">No conversations yet</p>
                <p className="mt-1 text-xs text-slate-500">{isAdmin ? "Search for a user to start a conversation." : "The school admin can message you here."}</p>
              </div>
            ) : null}
          </div>
        </aside>

        <section className={`${showInboxOnMobile ? "hidden" : "flex"} min-h-[70dvh] min-w-0 flex-col md:flex`}>
          {activeThread ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
                <button type="button" onClick={() => setShowInboxOnMobile(true)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Back to inbox">←</button>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800">{activeThread.title.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold text-slate-900">{activeThread.title}</h2>
                  <p className="text-xs text-slate-500">{activeThread.subtitle}</p>
                </div>
                <span className="hidden items-center gap-1.5 text-xs text-emerald-700 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Private conversation</span>
              </header>

              <div ref={transcriptRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-4 py-5 sm:px-6">
                {activeThread.messages.length ? activeThread.messages.map((message) => {
                  const fromMe = message.senderId === currentUserId;
                  return (
                    <div key={message.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                      <article className={`max-w-[min(82%,42rem)] rounded-lg px-3.5 py-2.5 shadow-sm ${fromMe ? "bg-sky-700 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                        <div className={`flex items-center justify-between gap-5 text-[11px] ${fromMe ? "text-sky-100" : "text-slate-500"}`}>
                          <span className="font-semibold">{fromMe ? "You" : message.senderName}</span>
                          <time>{message.createdAt}</time>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                        {message.type === "complaint" ? <span className={`mt-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${fromMe ? "bg-white/15 text-white" : "bg-amber-50 text-amber-800"}`}>Complaint</span> : null}
                      </article>
                    </div>
                  );
                }) : (
                  <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-800"><MessageSquare size={21} /></span>
                    <p className="mt-3 text-sm font-semibold text-slate-800">Start the conversation</p>
                    <p className="mt-1 max-w-sm text-xs text-slate-500">Send a private message to {activeThread.title}. Only this user and the school administrator can see this conversation.</p>
                  </div>
                )}
              </div>

              <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="border-t border-slate-200 bg-white p-3 sm:p-4">
                {error ? <p className="mb-2 text-sm text-rose-700">{error}</p> : null}
                {role === "parent" ? (
                  <div className="mb-2 flex gap-2">
                    <button type="button" onClick={() => setMessageType("message")} className={`rounded px-2.5 py-1 text-xs font-medium ${messageType === "message" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>Message</button>
                    <button type="button" onClick={() => setMessageType("complaint")} className={`rounded px-2.5 py-1 text-xs font-medium ${messageType === "complaint" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"}`}>Complaint</button>
                  </div>
                ) : null}
                <div className="flex items-end gap-2">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={2} maxLength={10000} placeholder={`Message ${activeThread.title}…`} className="max-h-40 min-h-11 flex-1 resize-y rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                  <button type="submit" disabled={sending || !draft.trim()} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-sky-700 px-3.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"><span aria-hidden="true">↗</span><span className="hidden sm:inline">Send</span></button>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Enter to send · Shift+Enter for a new line</p>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Users size={22} /></span>
              <h2 className="mt-4 text-base font-semibold text-slate-900">Choose a conversation</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Select a person from your inbox{isAdmin ? " or search the directory to start a new conversation" : " to view your private conversation with the admin"}.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}