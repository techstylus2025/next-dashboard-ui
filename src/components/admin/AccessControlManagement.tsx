"use client";

import {
  addDeniedUser,
  removeDeniedUser,
  setMaintenanceMode,
  setRoleAccessDenied,
} from "@/lib/accessControlActions";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Settings2, ShieldCheck, UserRound } from "lucide-react";

const roles = [
  { value: "teacher", label: "Teachers", description: "Teaching staff accounts" },
  { value: "student", label: "Students", description: "Student accounts" },
  { value: "parent", label: "Parents", description: "Parent and guardian accounts" },
] as const;

type Props = {
  maintenanceMode: boolean;
  deniedRoles: string[];
  deniedUsers: Array<{ id: string; identifier: string; createdAt: Date }>;
};

export default function AccessControlManagement({
  maintenanceMode,
  deniedRoles,
  deniedUsers,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [identifier, setIdentifier] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const runAction = (
    action: () => Promise<{ success: boolean; error: string | null }>,
    successMessage: string
  ) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.success) {
          setFeedback(result.error || "Could not update access settings.");
          return;
        }
        setFeedback(successMessage);
        router.refresh();
      } catch (error) {
        console.error("Access-control update failed:", error);
        setFeedback("Could not update access settings. Please try again.");
      }
    });
  };

  const handleAddUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runAction(async () => {
      const result = await addDeniedUser(identifier);
      if (result.success) setIdentifier("");
      return result;
    }, "User added to the blocked list.");
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
              <ShieldCheck size={16} /> Security &amp; availability
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Access control</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Control who can sign in and temporarily restrict the school app while you perform maintenance.
            </p>
          </div>
          <div className={`flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm ${
            maintenanceMode
              ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
              : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
          }`}>
            <span className={`h-2 w-2 rounded-full ${maintenanceMode ? "bg-amber-300" : "bg-emerald-300"}`} />
            {maintenanceMode ? "Maintenance is active" : "App is available"}
          </div>
        </div>
      </section>

      {feedback && (
        <p role="status" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {feedback}
        </p>
      )}

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Settings2 size={20} />
            </span>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">Maintenance mode</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                When enabled, non-admin users are sent to the maintenance page. Administrators retain full access.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium text-slate-900">{maintenanceMode ? "Currently enabled" : "Currently disabled"}</p>
              <p className="mt-1 text-xs text-slate-500">The change takes effect on the next request.</p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => runAction(
                () => setMaintenanceMode(!maintenanceMode),
                maintenanceMode ? "Maintenance mode disabled." : "Maintenance mode enabled."
              )}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                maintenanceMode ? "bg-emerald-700 hover:bg-emerald-800" : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {maintenanceMode ? "Turn off maintenance" : "Turn on maintenance"}
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Block entire roles</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Blocked roles cannot sign in or continue using an existing session. Admin access is always retained.
              </p>
            </div>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {roles.map((role) => {
              const blocked = deniedRoles.includes(role.value);
              return (
                <div key={role.value} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{role.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{role.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={blocked}
                    aria-label={`Block ${role.label.toLowerCase()}`}
                    disabled={pending}
                    onClick={() => runAction(
                      () => setRoleAccessDenied(role.value, !blocked),
                      blocked ? `${role.label} access restored.` : `${role.label} access blocked.`
                    )}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
                      blocked ? "bg-rose-600" : "bg-slate-300"
                    }`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      blocked ? "left-6" : "left-1"
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <UserRound size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Block an individual user</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Enter the exact school username or email address. Their next sign-in and any active app session will be denied.
            </p>
          </div>
        </div>
        <form onSubmit={handleAddUser} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="blocked-user-identifier">Username or email address</label>
          <input
            id="blocked-user-identifier"
            autoComplete="off"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Username or email address"
            className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
          <button
            type="submit"
            disabled={pending || !identifier.trim()}
            className="min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Block user
          </button>
        </form>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900">Blocked users ({deniedUsers.length})</h3>
          {deniedUsers.length === 0 ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-5 text-sm text-slate-500">No individual users are blocked.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {deniedUsers.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{entry.identifier}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Added {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(entry.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => runAction(
                      () => removeDeniedUser(entry.id),
                      `${entry.identifier} can access the app again.`
                    )}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
                  >
                    Restore access
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
