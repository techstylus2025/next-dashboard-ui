import prisma from './src/lib/prisma.ts';

async function main() {
  console.log('examQuestionUpload' in prisma ? 'hasProperty' : 'noProperty');
  console.log('examQuestionUpload type:', typeof (prisma as any).examQuestionUpload);
  console.log('prisma keys', Object.keys(prisma).filter(k => k.toString().toLowerCase().includes('exam')).join(', '));
  try {
    const count = await (prisma as any).examQuestionUpload.count({ where: {} });
    console.log('count', count);
  } catch (err) {
    console.error('count error', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
