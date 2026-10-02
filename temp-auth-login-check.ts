import prisma from './src/lib/prisma';

async function main() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: 'admin' }, { username: 'admin' }] },
  });
  console.log('AUTH_ROW', JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
