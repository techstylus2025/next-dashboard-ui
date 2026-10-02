import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { getCurrentAuthContext } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const authContext = await getCurrentAuthContext();
  if (authContext.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only administrators can sync users." }, { status: 403 });
  }

  const client = await clerkClient();
  const getUserList = (client.users as any).getUserList?.bind(client.users);
  if (typeof getUserList !== "function") {
    return NextResponse.json({ ok: false, error: "Clerk user listing is unavailable." }, { status: 500 });
  }

  let page = 1;
  let synced = 0;
  const limit = 100;

  while (true) {
    const result = await getUserList({ limit, page });
    const users = Array.isArray(result) ? result : result?.data ?? [];
    if (!users?.length) break;

    for (const clerkUser of users) {
      const id = String(clerkUser.id);
      const metadataRole = typeof clerkUser.publicMetadata?.role === "string"
        ? clerkUser.publicMetadata.role.toLowerCase()
        : null;
      if (!metadataRole) continue;

      const username = clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress || id;
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || null;
      const role = metadataRole.toUpperCase();

      await prisma.user.upsert({
        where: { id },
        update: { username, email, role },
        create: { id, username, email, password: null, role },
      });

      if (metadataRole === "admin") {
        await prisma.admin.upsert({ where: { id }, update: { username }, create: { id, username } });
      } else if (metadataRole === "teacher") {
        await prisma.teacher.upsert({
          where: { id },
          update: { username, email },
          create: {
            id,
            username,
            name: clerkUser.firstName || username,
            surname: clerkUser.lastName || "",
            email,
            phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || null,
            address: "",
            img: clerkUser.imageUrl || null,
            bloodType: "O+",
            sex: "MALE",
            birthday: new Date(2000, 0, 1),
          },
        });
      } else if (metadataRole === "parent") {
        await prisma.parent.upsert({
          where: { id },
          update: { username, email },
          create: {
            id,
            username,
            name: clerkUser.firstName || username,
            surname: clerkUser.lastName || "",
            email,
            occupation: null,
            phone: clerkUser.phoneNumbers?.[0]?.phoneNumber || `clerk-${id}`,
            address: "",
          },
        });
      }

      synced += 1;
    }

    if (users.length < limit) break;
    page += 1;
  }

  return NextResponse.json({ ok: true, synced });
}
