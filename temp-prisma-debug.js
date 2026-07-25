require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter, log: ['query', 'error', 'warn'] });
  try {
    const result = await prisma.book.create({
      data: {
        title: 'Debug Book',
        publication: 'Debug',
        classId: 1,
        priceCedis: 10.5,
        quantity: 5,
        supplierName: 'Supplier',
        supplierContact: '123',
      },
    });
    console.log(result);
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
})();
