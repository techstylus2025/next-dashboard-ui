require('dotenv').config();
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

(async () => {
  try {
    const [teacherCount, studentCount, parentCount, archivedTeachers, archivedStudents, archivedParents] = await Promise.all([
      db.teacher.count({ where: { isArchived: false } }),
      db.student.count({ where: { isArchived: false } }),
      db.parent.count({ where: { isArchived: false } }),
      db.teacher.count({ where: { isArchived: true } }),
      db.student.count({ where: { isArchived: true } }),
      db.parent.count({ where: { isArchived: true } }),
    ]);
    console.log('Counts:', { teacherCount, studentCount, parentCount, archivedTeachers, archivedStudents, archivedParents });
    const sampleParent = await db.parent.findFirst({ select: { id: true, name: true, surname: true, isArchived: true, archivedAt: true }, orderBy: { createdAt: 'asc' } });
    console.log('Sample parent:', sampleParent);
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
    await pool.end();
  }
})();
