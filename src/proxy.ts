import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { getDashboardPath } from "./lib/dashboard";
import { routeAccessMap } from "./lib/settings";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_ROLE_COOKIE_NAME = "session_role";

const PUBLIC_PATHS = [
  "/sign-in",
  "/",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/health",
  "/api/auth/request-reset",
  "/api/auth/reset",
  "/api/auth/sync-clerk",
  "/api/session/role",
  "/api/auth/me",
  "/_next",
  "/favicon.ico",
];

const pathMatches = (pathname: string, pattern: string) => {
  if (pattern.endsWith("(.*)")) {
    return pathname.startsWith(pattern.slice(0, -4));
  }
  return pathname === pattern;
};

export const proxy = clerkMiddleware(async (_auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    PUBLIC_PATHS.some((path) => path === pathname || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const role = req.cookies.get(SESSION_ROLE_COOKIE_NAME)?.value?.toLowerCase() || null;

  if (pathname === "/sign-in") {
    return NextResponse.next();
  }

  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (pathname === "/") {
    if (role) {
      return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
    }
    return NextResponse.next();
  }

  for (const [pattern, allowedRoles] of Object.entries(routeAccessMap)) {
    if (!pathMatches(pathname, pattern)) continue;

    if (!role) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|api/auth/health|api/auth/login|api/auth/logout|api/auth/request-reset|api/auth/reset|api/session/role|api/auth/me|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|css|js|ico|woff2?|ttf|map)$).*)",
  ],
};