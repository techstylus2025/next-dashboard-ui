import prisma from "../src/lib/prisma";
import fs from "fs";
import { clerkClient } from "@clerk/nextjs/server";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: ts-node -r dotenv/config scripts/migrate-admin-to-teacher.ts <userId>");
    process.exit(2);
  }
  const userId = args[0];

  try {
    // Try to find a teacher backup in the DB backup table
    const backups = await prisma.$queryRawUnsafe(`SELECT payload FROM role_migration_backups WHERE user_id = $1 AND original_role = 'teacher' ORDER BY created_at DESC LIMIT 1`, userId) as any[];

    let teacherPayload: any = null;

    if (backups && backups.length > 0) {
      teacherPayload = backups[0].payload;
    } else {
      // fallback to local file
      const files = fs.readdirSync(process.cwd());
      const candidate = files.find((f) => f.startsWith(`migration-backup-${userId}-`) && f.endsWith('.json'));
      if (candidate) {
        const content = fs.readFileSync(candidate, 'utf-8');
        const parsed = JSON.parse(content);
        teacherPayload = parsed.teacher ?? null;
      }
    }

    if (!teacherPayload) {
      console.error('No teacher backup payload found for', userId);
      process.exit(2);
    }

    // If teacher already exists, skip create
    const existingTeacher = await prisma.teacher.findUnique({ where: { id: userId } });
    if (!existingTeacher) {
      // map fields carefully
      const createData: any = {
        id: teacherPayload.id,
        username: teacherPayload.username || teacherPayload.email || teacherPayload.id,
        name: teacherPayload.name || teacherPayload.username || null,
        surname: teacherPayload.surname || null,
        email: teacherPayload.email || null,
        phone: teacherPayload.phone || null,
        address: teacherPayload.address || null,
        img: teacherPayload.img ?? null,
        bloodType: teacherPayload.bloodType || 'O+',
        sex: teacherPayload.sex || 'MALE',
        createdAt: teacherPayload.createdAt ? new Date(teacherPayload.createdAt) : undefined,
        birthday: teacherPayload.birthday ? new Date(teacherPayload.birthday) : undefined,
        isArchived: teacherPayload.isArchived ?? false,
        archivedAt: teacherPayload.archivedAt ? new Date(teacherPayload.archivedAt) : null,
      };

      await prisma.teacher.create({ data: createData });
      console.log('Teacher record created for', userId);
    } else {
      console.log('Teacher already exists for', userId);
    }

    // Delete admin row if exists
    const existingAdmin = await prisma.admin.findUnique({ where: { id: userId } });
    if (existingAdmin) {
      await prisma.admin.delete({ where: { id: userId } });
      console.log('Deleted admin row for', userId);
    } else {
      console.log('No admin row present for', userId);
    }

    // Update Clerk publicMetadata role to 'teacher' if possible
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, { publicMetadata: { role: 'teacher' } });
      console.log('Updated Clerk publicMetadata.role -> teacher');
    } catch (clerkErr) {
      console.warn('Failed to update Clerk metadata:', clerkErr);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    try { await prisma.$disconnect(); } catch {}
    process.exit(2);
  }
}

main();
