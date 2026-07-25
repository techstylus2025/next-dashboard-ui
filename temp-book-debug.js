const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('checking classes');
    const classes = await prisma.class.findMany({ take: 5, select: { id: true, name: true } });
    console.log('classes', classes);

    console.log('checking book columns');
    const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Book' ORDER BY ordinal_position;`;
    console.log('columns', columns);

    console.log('creating book');
    const result = await prisma.book.create({
      data: {
        title: 'Debug Book',
        publication: 'Debug',
        classId: classes[0].id,
        priceCedis: 10.5,
        quantity: 3,
        supplierName: 'Supplier',
        supplierContact: '123',
      },
    });
    console.log('created', result);
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
