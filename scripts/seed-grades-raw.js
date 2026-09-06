const { Pool } = require('pg');

const DEFAULT = ['CRECHE','NURSERY','KINDERGARTEN','PRIMARY','JHS'];

async function run(){
  const connectionString = process.env.DATABASE_URL;
  if(!connectionString){
    console.error('DATABASE_URL not set');
    process.exitCode = 1;
    return;
  }
  const pool = new Pool({ connectionString });
  try{
    for(const level of DEFAULT){
      await pool.query('INSERT INTO "Grade" (level) VALUES ($1) ON CONFLICT (level) DO NOTHING', [level]);
    }
    console.log('Seeded default grading levels');
  }catch(err){
    console.error('Error seeding grades:', err.message||err);
    process.exitCode = 1;
  }finally{
    await pool.end();
  }
}

if(require.main===module) run();
module.exports = { run };
