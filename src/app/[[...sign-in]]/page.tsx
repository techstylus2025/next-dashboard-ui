"use client";

import { useSignIn, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

const LoginPage = () => {
  const { isSignedIn, user, isLoaded } = useUser();
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
      const clientRole = user?.publicMetadata?.role as string | undefined;
      setIsRedirecting(true);

      const pollInterval = 400;
      const maxAttempts = 12;
      let attempts = 0;

      const poll = async () => {
        try {
          const res = await fetch("/api/session/role");
          const data = await res.json();
          const serverRole = data?.role ?? null;
          if (serverRole) {
            const redirectPath = `/${serverRole || clientRole}`;
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
          window.location.replace(clientRole ? `/${clientRole}` : "/admin");
        }
      };

      poll();
    }
  }, [isLoaded, isSignedIn, user, isRedirecting]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mx-auto relative flex h-40 w-40 items-center justify-center bg-transparent overflow-visible">
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
            <div className="relative z-10 flex items-center justify-center">
              <span className="absolute h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" aria-hidden="true" />
              <span className="absolute h-24 w-24 rounded-full bg-slate-950/10" aria-hidden="true" />
              <Image src="/logo.png" alt="Loading" width={56} height={56} className="relative z-10" />
            </div>
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
        const clientRole = user?.publicMetadata?.role as string | undefined;
        window.location.replace(clientRole ? `/${clientRole}` : "/admin");
        return;
      }

      const result = await signIn.create({
        identifier,
        password,
      });

      if (result.errors && result.errors.length > 0) {
        setError(result.errors[0]?.message || "Invalid credentials");
        return;
      }

      if (result.status === "complete") {
        setError(null);
      } else {
        setError(`Sign-in failed with status: ${result.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid username or password.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.55)), url('/school_building.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundBlendMode: 'overlay',
        }}
      />
      
      {/* Dark gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/65 via-slate-950/35 to-slate-900/70 z-10" />

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-md">
        {/* Form Card */}
        <div className="rounded-2xl bg-white/95 backdrop-blur-md p-8 shadow-2xl ring-1 ring-white/20">
          <div className="text-center">
            {/* Logo */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
              <Image src="/logo.png" alt="Logo" width={70} height={70} className="drop-shadow-lg" />
            </div>

            {/* Title */}
            <h1 className="mt-6 text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              KING&apos;S HEART
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600">School Management System</p>
            <p className="mt-1 text-xs text-slate-500">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Username Input */}
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
                className="w-full rounded-lg border border-slate-300 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white"
                placeholder="Enter your username"
                required
              />
            </div>

            {/* Password Input */}
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
                className="w-full rounded-lg border border-slate-300 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Error Message */}
            {error ? (
              <div className="rounded-lg border border-red-300 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 animate-pulse">
                <span className="inline-block mr-2">⚠️</span>
                {error}
              </div>
            ) : null}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!signIn || isSubmitting}
              className="w-full mt-6 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-cyan-700 hover:to-blue-700 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
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

          {/* Footer Info */}
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-center text-xs text-slate-500">
              © 2026 King&apos;s Heart School. All rights reserved.
            </p>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-6 text-center text-xs text-white/80">
          <p>🔒 Your credentials are secure and encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
