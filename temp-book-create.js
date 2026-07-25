const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const result = await prisma.book.create({
      data: {
        title: 'Test Book',
        publication: 'Test',
        classId: 1,
        priceCedis: new Prisma.Decimal('10.00'),
        quantity: 5,
        supplierName: 'Supplier',
        supplierContact: '123',
      },
    });
    console.log('CREATED', result);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
