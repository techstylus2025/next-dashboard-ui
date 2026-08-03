const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.$connect();
    const columns = await prisma.$queryRaw`SELECT column_name, is_nullable, data_type, udt_name FROM information_schema.columns WHERE table_name = 'Grade' AND table_schema = 'public' ORDER BY ordinal_position`;
    console.log(JSON.stringify(columns, null, 2));

    const constraints = await prisma.$queryRaw`SELECT tc.constraint_name, tc.constraint_type FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name WHERE tc.table_name = 'Grade' AND tc.table_schema = 'public'`;
    console.log('--- constraints ---');
    console.log(JSON.stringify(constraints, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
