require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  try {
    const counts = {
      admin: await prisma.admin.count(),
      student: await prisma.student.count(),
      teacher: await prisma.teacher.count(),
      parent: await prisma.parent.count(),
      class: await prisma.class.count(),
      grade: await prisma.grade.count(),
      subject: await prisma.subject.count(),
    };
    console.log(JSON.stringify(counts, null, 2));
    const classes = await prisma.class.findMany({ take: 10, include: { grade: true, supervisor: true } });
    console.log('sample classes', JSON.stringify(classes, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
})();
