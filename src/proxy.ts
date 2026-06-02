import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { getDashboardPath } from "./lib/dashboard";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

export default clerkMiddleware(async (auth, req) => {
  const pathname = decodeURIComponent(req.nextUrl.pathname);

  // Legacy URL with space — redirect to canonical route
  if (
    pathname === "/list/purchase books" ||
    pathname === "/list/purchase%20books"
  ) {
    return NextResponse.redirect(new URL("/list/purchase-books", req.url));
  }

  if (pathname === "/settings") {
    return NextResponse.redirect(new URL("/list/settings", req.url));
  }

  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (pathname === "/" || pathname === "") {
    if (userId && role) {
      return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
    }
    return NextResponse.next();
  }

  for (const { matcher, allowedRoles } of matchers) {
    if (!matcher(req)) continue;

    if (!role) {
      // If there's a userId but no role yet, allow the request to proceed.
      // This handles a race where the client is signed in but server-side
      // session claims (metadata) haven't propagated yet.
      if (userId) {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL(`/${role}`, req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
