const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT = ['CRECHE','NURSERY','KINDERGARTEN','PRIMARY','JHS'];

async function run(){
  try{
    const existing = await prisma.grade.findMany({ select: { level: true } });
    const existingSet = new Set(existing.map(r=>r.level));
    const missing = DEFAULT.filter(l => !existingSet.has(l));
    if(missing.length === 0){
      console.log('No missing grading levels.');
      return;
    }
    const data = missing.map(l => ({ level: l }));
    await prisma.grade.createMany({ data });
    console.log('Inserted grading levels:', missing);
  }catch(err){
    console.error('Error seeding grading levels:', err);
    process.exitCode = 1;
  }finally{
    await prisma.$disconnect();
  }
}

if(require.main === module){
  run();
}

module.exports = { run };
