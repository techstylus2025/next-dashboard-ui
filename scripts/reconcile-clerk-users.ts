import prisma from "../src/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

async function main() {
  try {
    const client = await clerkClient();
    const getUserList = (client.users as any).getUserList;
    if (typeof getUserList !== "function") {
      console.error("Clerk SDK does not expose getUserList on this version");
      process.exit(2);
    }

    const pageSize = 100;
    let page = 1;
    let totalProcessed = 0;

    while (true) {
      const users = await getUserList({ limit: pageSize, page });
      if (!users || users.length === 0) break;

      for (const user of users) {
        const id = user.id as string;
        const role = (user.publicMetadata as any)?.role as string | undefined;
        const username = user.username || (user.emailAddresses && user.emailAddresses[0]?.emailAddress) || id;

        try {
          switch ((role || "").toLowerCase()) {
            case "admin":
              await prisma.admin.upsert({ where: { id }, update: { username }, create: { id, username } });
              break;
            case "teacher":
              await prisma.teacher.upsert({
                where: { id },
                update: { username, email: user.emailAddresses?.[0]?.emailAddress || null },
                create: {
                  id,
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
                where: { id },
                update: { username, email: user.emailAddresses?.[0]?.emailAddress || null },
                create: {
                  id,
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
              // Save to backups table for manual completion
              await prisma.$executeRawUnsafe(`INSERT INTO role_migration_backups (user_id, original_role, payload) VALUES ($1,$2,$3)`, id, 'student', JSON.stringify(user));
              break;
            default:
              // Unknown role - write to backups
              await prisma.$executeRawUnsafe(`INSERT INTO role_migration_backups (user_id, original_role, payload) VALUES ($1,$2,$3)`, id, role ?? 'unknown', JSON.stringify(user));
              break;
          }
          totalProcessed++;
        } catch (err) {
          console.error(`Failed to upsert user ${id}:`, err);
        }
      }

      if (users.length < pageSize) break;
      page++;
    }

    console.log(`Reconcile complete. Processed ${totalProcessed} users.`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Reconcile failed:", err);
    try { await prisma.$disconnect(); } catch {}
    process.exit(2);
  }
}

main();
