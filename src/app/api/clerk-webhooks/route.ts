import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// NOTE: For production validate Clerk webhook signatures. This handler
// expects a header `x-clerk-webhook-secret` that matches `CLERK_WEBHOOK_SECRET`.
// Replace with Clerk SDK signature verification in production.

export async function POST(req: NextRequest) {
  try {
    const secretHeader = req.headers.get("x-clerk-webhook-secret");
    const expected = process.env.CLERK_WEBHOOK_SECRET;
    if (!expected || secretHeader !== expected) {
      return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
    }

    const body = await req.json();

    // Clerk webhook payload typically contains `type` and `data`/`object`.
    const eventType = (body.type as string) || (body.event && body.event.type) || null;
    const eventData = (body.data as any) || body.object || body.event?.data || {};

    // For safety, when possible get full user from Clerk by id
    const clerkUserId = eventData?.id || eventData?.user?.id || eventData?.user_id || eventData?.userId || null;
    if (!clerkUserId) {
      return NextResponse.json({ error: "No user id in webhook payload." }, { status: 400 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    const role = (user.publicMetadata as any)?.role as string | undefined;

    if (!role) {
      // store backup so reconciler can inspect
      await prisma.$executeRawUnsafe(`INSERT INTO role_migration_backups (user_id, original_role, payload) VALUES ($1,$2,$3)`, clerkUserId, 'unknown', JSON.stringify(user));
      return NextResponse.json({ ok: true });
    }

    const username = user.username || (user.emailAddresses && user.emailAddresses[0]?.emailAddress) || clerkUserId;

    // handle created/updated events similarly by upserting minimal DB rows
    switch ((role || "").toLowerCase()) {
      case "admin":
        await prisma.admin.upsert({
          where: { id: clerkUserId },
          update: { username },
          create: { id: clerkUserId, username },
        });
        break;
      case "teacher":
        await prisma.teacher.upsert({
          where: { id: clerkUserId },
          update: { username, email: user.emailAddresses?.[0]?.emailAddress || null },
          create: {
            id: clerkUserId,
            username,
            name: user.firstName || username,
            surname: user.lastName || "",
            email: user.emailAddresses?.[0]?.emailAddress || null,
            phone: user.phoneNumbers?.[0]?.phoneNumber || null,
            address: "",
            img: null,
            bloodType: "O+",
            sex: "MALE",
            birthday: new Date(2000, 0, 1),
          },
        });
        break;
      case "parent":
        await prisma.parent.upsert({
          where: { id: clerkUserId },
          update: { username, email: user.emailAddresses?.[0]?.emailAddress || null },
          create: {
            id: clerkUserId,
            username,
            name: user.firstName || username,
            surname: user.lastName || "",
            email: user.emailAddresses?.[0]?.emailAddress || null,
            occupation: null,
            phone: user.phoneNumbers?.[0]?.phoneNumber || "",
            address: "",
          },
        });
        break;
      case "student":
        // Students require many fields; save a backup for the reconciler to complete later.
        await prisma.$executeRawUnsafe(`INSERT INTO role_migration_backups (user_id, original_role, payload) VALUES ($1,$2,$3)`, clerkUserId, 'student', JSON.stringify(user));
        break;
      default:
        await prisma.$executeRawUnsafe(`INSERT INTO role_migration_backups (user_id, original_role, payload) VALUES ($1,$2,$3)`, clerkUserId, role, JSON.stringify(user));
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Clerk webhook handler failed:", err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}
