import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug");

  const { sessionClaims, userId } = await auth();
  let role = (sessionClaims?.metadata as { role?: string })?.role ?? null;

  // If role not present in sessionClaims, try fetching the user public metadata
  if (!role && userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = (user?.publicMetadata as { role?: string })?.role ?? null;
      const publicMetadata = user?.publicMetadata ?? null;

      const payload: any = { role, userId, sessionClaims: sessionClaims ?? null, publicMetadata };
      if (debug) {
        payload.debug = { cookie: req.headers.get("cookie") ?? null };
      }

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.warn("Failed to fetch Clerk user for role fallback:", e);
    }
  }

  const payload: any = { role, userId, sessionClaims: sessionClaims ?? null };
  if (debug) payload.debug = { cookie: req.headers.get("cookie") ?? null };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
