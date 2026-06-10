require('dotenv').config();
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
(async () => {
  try {
    const [teachers, students, parents, totalTeachers, totalStudents, totalParents] = await Promise.all([
      db.teacher.count({ where: { isArchived: false } }),
      db.student.count({ where: { isArchived: false } }),
      db.parent.count({ where: { isArchived: false } }),
      db.teacher.count(),
      db.student.count(),
      db.parent.count(),
    ]);
    console.log({ teachers, students, parents, totalTeachers, totalStudents, totalParents });
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
    await pool.end();
  }
})();
