import prisma from "../src/lib/prisma";
import fs from "fs";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: ts-node -r dotenv/config scripts/restore-admin-from-backup.ts <userId>");
    process.exit(2);
  }
  const userId = args[0];

  try {
    const backups = await prisma.$queryRawUnsafe(`SELECT payload FROM role_migration_backups WHERE user_id = $1 AND original_role = 'admin' ORDER BY created_at DESC LIMIT 1`, userId) as any[];

    let adminPayload: any = null;

    if (backups && backups.length > 0) {
      adminPayload = backups[0].payload;
    } else {
      // fallback to local file
      const files = fs.readdirSync(process.cwd());
      const candidate = files.find((f) => f.startsWith(`migration-backup-${userId}-`) && f.endsWith('.json'));
      if (candidate) {
        const content = fs.readFileSync(candidate, 'utf-8');
        const parsed = JSON.parse(content);
        adminPayload = parsed.admin ?? null;
      }
    }

    if (!adminPayload) {
      console.error('No admin backup payload found for', userId);
      process.exit(2);
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { id: userId } });
    if (existingAdmin) {
      console.log('Admin already exists for', userId);
    } else {
      const createData: any = {
        id: adminPayload.id,
        username: adminPayload.username || adminPayload.email || adminPayload.id,
      };
      await prisma.admin.create({ data: createData });
      console.log('Admin record restored for', userId);

      const backupFile = `restore-admin-backup-${userId}-${Date.now()}.json`;
      fs.writeFileSync(backupFile, JSON.stringify({ restoredAdmin: createData, source: adminPayload }, null, 2));
      console.log('Local restore backup written to', backupFile);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Restore failed:', err);
    try { await prisma.$disconnect(); } catch {}
    process.exit(2);
  }
}

main();
