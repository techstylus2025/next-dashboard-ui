import prisma from "../src/lib/prisma";
import fs from "fs";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: ts-node -r dotenv/config scripts/migrate-teacher-to-admin.ts <userId>");
    process.exit(2);
  }
  const userId = args[0];

  try {
    // Ensure backup table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS role_migration_backups (
        backup_id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        original_role TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    const admin = await prisma.admin.findUnique({ where: { id: userId } });
    const teacher = await prisma.teacher.findUnique({ where: { id: userId } });

    if (!teacher) {
      console.log(`No teacher row found for id=${userId}. Nothing to migrate.`);
      await prisma.$disconnect();
      process.exit(0);
    }

    // Insert backups
    if (admin) {
      await prisma.$executeRawUnsafe(`INSERT INTO role_migration_backups (user_id, original_role, payload) VALUES ($1, $2, $3)`,
        userId, 'admin', JSON.stringify(admin));
    }
    await prisma.$executeRawUnsafe(`INSERT INTO role_migration_backups (user_id, original_role, payload) VALUES ($1, $2, $3)`,
      userId, 'teacher', JSON.stringify(teacher));

    // Write backup to local file as extra safety
    const backupFile = `migration-backup-${userId}-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify({ admin, teacher }, null, 2));

    // Decide merging strategy: keep admin record; if admin missing, create one from teacher
    if (!admin) {
      console.log(`Admin row missing for ${userId}. Creating admin from teacher record.`);
      await prisma.admin.create({ data: { id: teacher.id, username: teacher.username } });
    } else {
      console.log(`Admin row exists for ${userId}. Keeping admin.username='${admin.username}' and removing teacher row.`);
      // Optionally, keep teacher.username in audit backup only
    }

    // Delete teacher row
    await prisma.teacher.delete({ where: { id: userId } });

    console.log(`Migration completed for ${userId}. Backup written to ${backupFile}.`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    try { await prisma.$disconnect(); } catch {};
    process.exit(2);
  }
}

main();
