import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  const { sessionClaims, userId } = await auth();
  let role = (sessionClaims?.metadata as { role?: string })?.role ?? null;

  // If role not present in sessionClaims, try fetching the user public metadata
  if (!role && userId) {
    try {
      const user = await clerkClient.users.getUser(userId);
      role = (user?.publicMetadata as { role?: string })?.role ?? null;
      const publicMetadata = user?.publicMetadata ?? null;

      return new Response(
        JSON.stringify({ role, userId, sessionClaims: sessionClaims ?? null, publicMetadata }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (e) {
      console.warn("Failed to fetch Clerk user for role fallback:", e);
    }
  }

  return new Response(JSON.stringify({ role, userId, sessionClaims: sessionClaims ?? null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
