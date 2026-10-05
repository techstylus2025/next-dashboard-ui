"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { verifyFeesPagePassword } from "@/lib/feeActions";

export default function FeesPasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await verifyFeesPagePassword(password);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setPassword("");
      router.refresh();
    } catch {
      setError("Unable to verify your password right now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 sm:p-7">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <BadgeCheck size={22} aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Administrator access</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Verify to open fees</h1>
        <p className="mt-2 text-sm leading-5 text-slate-500">
          Enter your administrator password to view fee schedules and payment records.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Administrator password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              disabled={pending}
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || password.length === 0}
            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Verifying…" : "Verify password"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">Access remains unlocked for 15 minutes.</p>
      </section>
    </main>
  );
}
