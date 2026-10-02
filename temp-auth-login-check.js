require('dotenv').config();

(async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({ where: { OR: [{ email: 'admin' }, { username: 'admin' }] } });
    console.log('AUTH_ROW', JSON.stringify(user, null, 2));
  } finally {
    await prisma.$disconnect();
  }
})();
