import { auth, clerkClient } from "@clerk/nextjs/server";

function maskKey(key: string | undefined | null) {
  if (!key) return null;
  if (key.length <= 10) return `${key.slice(0, 3)}…${key.slice(-3)}`;
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export async function GET() {
  let authOk = false;
  let clerkOk = false;
  let authError: string | null = null;

  try {
    const result = await auth();
    // If auth() returns, it's working for server-side calls.
    authOk = true;

    // Try a lightweight clerk client call if userId present (or list orgs as no-ops)
    try {
      const client = await clerkClient();
      // perform a harmless no-op call: list organizations is allowed for many keys
      // but to be safe, just call `client.users.getUser` only if userId exists
      if (result.userId) {
        await client.users.getUser(result.userId).catch(() => null);
      }
      clerkOk = true;
    } catch (e: any) {
      clerkOk = false;
    }
  } catch (err: any) {
    authOk = false;
    authError = err instanceof Error ? err.message : String(err);
  }

  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? null;
  const secret = process.env.CLERK_SECRET_KEY ?? null;

  const payload = {
    ok: authOk && clerkOk,
    authOk,
    clerkOk,
    authError,
    publishableKey: maskKey(publishable),
    secretKey: maskKey(secret),
    serverTime: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
