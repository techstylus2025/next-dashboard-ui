require('dotenv').config();
const prisma = require('./src/lib/prisma').default;

(async () => {
  try {
    const result = await prisma.book.create({
      data: {
        title: 'Env Test Book',
        publication: 'Env Test',
        classId: 1,
        priceCedis: 10.5,
        quantity: 5,
        supplierName: 'Supplier',
        supplierContact: '123',
      },
    });
    console.log('CREATED', JSON.stringify(result));
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
