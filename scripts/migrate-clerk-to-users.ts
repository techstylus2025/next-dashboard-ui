import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import prisma from "../src/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import crypto from "crypto";

type Role = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";

async function upsertFromRoleTable(tableName: string, role: Role) {
  console.log(`Scanning ${tableName} for rows...`);
  const rows: any[] = await (prisma as any)[tableName].findMany({});
  for (const row of rows) {
    try {
      const id = row.id;
      const username = row.username || null;
      const email = row.email || null;
      await prisma.user.upsert({
        where: { id },
        update: { username, email, role },
        create: { id, username, email, role },
      });
    } catch (err) {
      console.error(`Failed upsert ${tableName} ${row.id}:`, err);
    }
  }
  console.log(`Finished ${tableName}.`);
}

async function fetchAllClerkUsers() {
  const client = await clerkClient();
  // clerk SDK shape varies; try getUserList
  const getUserList = (client.users as any).getUserList || (client as any).getUserList;
  if (!getUserList) {
    throw new Error("Clerk SDK does not expose getUserList on this version");
  }

  const pageSize = 100;
  let page = 1;
  const out: any[] = [];
  while (true) {
    const users = await getUserList({ limit: pageSize, page });
    if (!users || users.length === 0) break;
    out.push(...users);
    if (users.length < pageSize) break;
    page++;
  }
  return out;
}

async function main() {
  try {
    // 1) Upsert from role tables to create canonical User rows
    await upsertFromRoleTable("admin", "ADMIN");
    await upsertFromRoleTable("teacher", "TEACHER");
    await upsertFromRoleTable("parent", "PARENT");
    await upsertFromRoleTable("student", "STUDENT");

    // 2) Fetch Clerk users and ensure User rows exist; generate reset tokens for users with no password
    console.log("Fetching Clerk users...");
    let clerkUsers: any[] = [];
    try {
      clerkUsers = await fetchAllClerkUsers();
      console.log(`Found ${clerkUsers.length} Clerk users`);
    } catch (err) {
      console.warn("Clerk fetch failed, continuing with role-table-only migration:", (err as any)?.message || String(err));
      clerkUsers = [];
    }

    const resetTokens: Record<string, string> = {};
    const backup: Record<string, any> = {};

    for (const u of clerkUsers) {
      const id = u.id as string;
      const username = u.username || (u.emailAddresses && u.emailAddresses[0]?.emailAddress) || null;
      const email = u.emailAddresses?.[0]?.emailAddress || null;
      const roleMeta = (u.publicMetadata as any)?.role || null;
      const role = (roleMeta && typeof roleMeta === "string" ? roleMeta.toUpperCase() : null) as Role | null;

      try {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
          await prisma.user.create({ data: { id, username, email, role: role || "STUDENT" } as any });
        } else {
          // update role/username/email if missing
          await prisma.user.update({ where: { id }, data: { username: existing.username || username, email: existing.email || email, role: existing.role || role || "STUDENT" } as any });
        }

        // If the user has no password (migrated from Clerk), generate a one-time reset token
        const userRec = await prisma.user.findUnique({ where: { id } });
        if (userRec && !userRec.password) {
          const token = crypto.randomBytes(24).toString("hex");
          resetTokens[id] = token;
        }

        backup[id] = u;
      } catch (err) {
        console.error(`Error processing Clerk user ${id}:`, err);
      }
    }

    // write outputs
    const outDir = path.join(process.cwd(), "scripts", "migration-output");
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, "clerk_users_backup.json"), JSON.stringify(backup, null, 2), "utf8");
    await fs.writeFile(path.join(outDir, "reset_tokens.json"), JSON.stringify(resetTokens, null, 2), "utf8");

    console.log("Migration complete. Outputs written to scripts/migration-output/");
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    try { await prisma.$disconnect(); } catch {}
    process.exit(2);
  }
}

main();
