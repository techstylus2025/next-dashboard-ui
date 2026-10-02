"use client";

import Image from "next/image";
import { ClerkProvider, useAuth, useSignIn, useUser } from "@clerk/nextjs";
import { FormEvent, useState } from "react";
import {
  Bell as EyeOff,
  FileText as LockKeyhole,
  Sparkles as Eye,
  Users as UserRound,
} from "lucide-react";
import { getRoleRedirectPath } from "@/lib/signInRedirect";

async function readAuthResponse(response: Response) {
  const body = await response.text();
  if (!body) {
    throw new Error(`Sign-in service returned an empty response (HTTP ${response.status}).`);
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`Sign-in service returned an invalid response (HTTP ${response.status}).`);
  }
}

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { getToken } = useAuth();
  const { signIn } = useSignIn();
  const { isSignedIn, user } = useUser();

  const syncClerkSession = async () => {
    const clerkToken = await getToken({ skipCache: true });
    if (!clerkToken) {
      throw new Error("Clerk session token is unavailable. Please sign in again.");
    }

    const syncResponse = await fetch("/api/auth/sync-clerk", {
      method: "POST",
      headers: { Authorization: `Bearer ${clerkToken}` },
    });
    const syncData = await readAuthResponse(syncResponse);
    if (!syncResponse.ok) {
      throw new Error(syncData?.error || "Unable to sync your account.");
    }

    return syncData;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username || !password || isLoading || isRedirecting) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: username, password }),
      });
      const data = await readAuthResponse(response);

      if (response.ok) {
        setIsRedirecting(true);
        const role = String(data?.user?.role || "").toLowerCase();
        window.location.replace(getRoleRedirectPath(role, role));
        return;
      }

      if (isSignedIn && user) {
        const normalizedIdentifier = username.trim().toLowerCase();
        const activeIdentifiers = [
          user.username,
          user.primaryEmailAddress?.emailAddress,
          ...user.emailAddresses.map((email) => email.emailAddress),
        ]
          .filter((value): value is string => Boolean(value))
          .map((value) => value.trim().toLowerCase());

        if (!activeIdentifiers.includes(normalizedIdentifier)) {
          throw new Error("A different account is already signed in. Sign out before continuing.");
        }

        const syncData = await syncClerkSession();
        setIsRedirecting(true);
        const role = String(syncData?.user?.role || "").toLowerCase();
        window.location.replace(getRoleRedirectPath(role, role));
        return;
      }

      const clerkResult = await signIn.create({ identifier: username, password });
      if (clerkResult.error) {
        throw new Error(clerkResult.error.message || data?.error || "Invalid username or password.");
      }
      if (signIn.status !== "complete") {
        throw new Error("Additional sign-in verification is required.");
      }

      const finalizeResult = await signIn.finalize();
      if (finalizeResult.error) {
        throw new Error(finalizeResult.error.message || "Unable to activate your Clerk session.");
      }
      const syncData = await syncClerkSession();
      setIsRedirecting(true);
      const role = String(syncData?.user?.role || "").toLowerCase();
      window.location.replace(getRoleRedirectPath(role, role));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
      setIsLoading(false);
    }
  };

  const showUnavailableMessage = () => {
    setError("This sign-in option is not configured. Use your school username and password.");
  };

  return (
    <main className="login-page">
      <div className="decorative-shape decorative-shape-top" />
      <div className="decorative-shape decorative-shape-bottom" />

      <section className="login-card" aria-label="School sign in">
        <div className="login-panel">
          <div className="login-content">
            <div className="school-brand">
              <div className="logo-wrapper">
                <Image
                  src="/logo.png"
                  alt="King's Heart Montessori School"
                  width={72}
                  height={94}
                  priority
                  className="school-logo"
                />
              </div>
              <div className="brand-name">
                <span className="welcome-text">WELCOME TO</span>
                <h1>
                  KING&apos;S HEART
                  <span>MONTESSORI SCHOOL</span>
                </h1>
              </div>
            </div>

            <p className="login-description">
              Log in to access the school management
              <br />
              system and continue your work.
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <UserRound size={18} strokeWidth={1.5} className="input-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  aria-label="Username"
                  required
                />
              </div>

              <div className="input-group">
                <LockKeyhole size={18} strokeWidth={1.5} className="input-icon" aria-hidden="true" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  aria-label="Password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} strokeWidth={1.5} /> : <Eye size={17} strokeWidth={1.5} />}
                </button>
              </div>

              <div className="form-options">
                <button type="button" className="forgot-password" onClick={showUnavailableMessage}>
                  Forgot password?
                </button>
              </div>

              {error ? <p className="login-error" role="alert">{error}</p> : null}

              <button type="submit" className="sign-in-button" disabled={isLoading || isRedirecting}>
                {isLoading ? "SIGNING IN..." : "SIGN IN"}
              </button>
            </form>

            <div className="signup-text">
              <span>Don&apos;t have an account?</span>{" "}
              <button type="button" onClick={showUnavailableMessage}>Contact Administrator</button>
            </div>
          </div>
        </div>

        <div className="branding-panel">
          <div className="branding-overlay" />
          <div className="branding-content">
            <div className="large-logo">
              <Image src="/logo.png" alt="" width={115} height={150} priority className="large-school-logo" />
            </div>
            <h2>
              KING&apos;S HEART
              <span>MONTESSORI SCHOOL</span>
            </h2>
            <div className="branding-divider" />
            <p>
              Welcome to the King&apos;s Heart Montessori School Management System. Manage academic records, students, teachers and school activities from one convenient platform.
            </p>
            <div className="motto">
              <span>EXCELLENT UPBRINGING.</span>
              <span>EXCELLENT ADULTHOOD.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

const LoginPage = () => (
  <ClerkProvider>
    <LoginForm />
  </ClerkProvider>
);

export default LoginPage;
