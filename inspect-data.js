require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  const classes = await prisma.class.findMany({
    include: { supervisor: true, grade: true },
    orderBy: { id: 'asc' },
  });
  console.log('CLASSES', JSON.stringify(classes, null, 2));

  const grades = await prisma.grade.findMany({ orderBy: { id: 'asc' } });
  console.log('GRADES', JSON.stringify(grades, null, 2));

  const teachers = await prisma.teacher.findMany({
    where: { isArchived: false },
    select: { id: true, name: true, surname: true },
    orderBy: { id: 'asc' },
  });
  console.log('TEACHERS', JSON.stringify(teachers, null, 2));

  await prisma.$disconnect();
  await pool.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
