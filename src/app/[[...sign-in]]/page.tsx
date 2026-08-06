"use client";

import { useClerk, useSignIn, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { getRoleRedirectPath } from "@/lib/signInRedirect";

const LoginPage = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { setActive } = useClerk();
  const signInSignal = useSignIn();
  const signIn = signInSignal?.signIn;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && user && !isRedirecting) {
      const clientRole = (user as any)?.publicMetadata?.role as string | undefined;
      setIsRedirecting(true);

      const pollInterval = 400;
      const maxAttempts = 12;
      let attempts = 0;

      const poll = async () => {
        try {
          const res = await fetch("/api/session/role");
          const data = await res.json();
          const serverRole = data?.role ?? null;
          const redirectPath = getRoleRedirectPath(clientRole, serverRole);
          if (serverRole || clientRole) {
            window.location.replace(redirectPath);
            return;
          }
        } catch (e) {
          console.warn("Error polling session role:", e);
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          window.location.replace(getRoleRedirectPath(clientRole, null));
        }
      };

      poll();
    }
  }, [isLoaded, isSignedIn, user, isRedirecting]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mx-auto relative flex h-40 w-40 items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div className="loading-logo-spinner animate-slow-spin">
                <span className="loading-logo-dot dot-1" />
                <span className="loading-logo-dot dot-2" />
                <span className="loading-logo-dot dot-3" />
                <span className="loading-logo-dot dot-4" />
                <span className="loading-logo-dot dot-5" />
                <span className="loading-logo-dot dot-6" />
                <span className="loading-logo-dot dot-7" />
                <span className="loading-logo-dot dot-8" />
              </div>
            </div>
            <Image src="/logo.png" alt="Loading" width={56} height={56} className="relative z-10 rounded-full bg-slate-950/90 p-1" />
          </div>
          <p className="mt-4 text-sm text-slate-300">Loading sign in...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn && user) {
    return null;
  }

  if (isRedirecting) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signIn) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignedIn && user) {
        const clientRole = (user as any)?.publicMetadata?.role as string | undefined;
        window.location.replace(getRoleRedirectPath(clientRole, null));
        return;
      }

      const result = await (signIn as any).create({
        identifier,
        password,
      });

      if (result?.error) {
        setError(result.error?.message || "Invalid credentials");
        return;
      }

      if (result?.status === "complete" && result.createdSessionId && setActive) {
        try {
          await setActive({ session: result.createdSessionId });
        } catch (activeError) {
          console.error("Failed to activate Clerk session", activeError);
          setError("We could not finish signing you in. Please try again.");
          return;
        }
      }

      if (result?.status === "needs_second_factor") {
        setError("Additional verification is required. Please complete the next step.");
        return;
      }

      setError(null);
      setIsRedirecting(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid username or password.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(135deg,_rgba(2,6,23,0.96)_0%,_rgba(15,23,42,0.9)_45%,_rgba(30,41,59,0.9)_100%)]" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.2),_transparent_35%)]" />

      <div className="relative z-20 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-3 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid w-full max-w-6xl gap-4 rounded-[28px] border border-white/15 bg-white/10 p-3 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:p-6">
          <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/45 p-6 text-white sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(34,211,238,0.18),transparent_40%,rgba(59,130,246,0.16))]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  Secure portal
                </div>
                <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">
                  Welcome back to King&apos;s Heart.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                  Access attendance, lessons, examinations, and student records through a single, secure dashboard.
                </p>
                <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50/90">
                  <p className="font-medium">Manage daily school operations with confidence.</p>
                  <p className="mt-1 text-cyan-100/80">From staff coordination to academic records, everything stays organized in one place.</p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-2xl font-semibold text-white">24/7</p>
                  <p className="mt-1 text-sm text-slate-300">Staff access</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-2xl font-semibold text-white">100%</p>
                  <p className="mt-1 text-sm text-slate-300">Protected data</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] bg-white/95 p-5 shadow-inner shadow-slate-200/70 sm:p-7 lg:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 shadow-sm sm:h-24 sm:w-24">
                <Image src="/logo.png" alt="Logo" width={68} height={68} className="object-contain" />
              </div>

              <h1 className="mt-5 text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent sm:text-4xl">
                KING&apos;S HEART
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">School Management System</p>
              <p className="mt-1 text-xs text-slate-500">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="space-y-2">
                <label htmlFor="identifier" className="block text-sm font-semibold text-slate-700">
                  Username
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-300 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 animate-pulse">
                  <span className="mr-2 inline-block">⚠️</span>
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!signIn || isSubmitting}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-cyan-700 hover:to-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-4 text-center">
              <p className="text-xs text-slate-500">
                © 2026 King&apos;s Heart School. All rights reserved.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
