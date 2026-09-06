const { Pool } = require('pg');
require('dotenv').config();

(async function(){
  const connectionString = process.env.DATABASE_URL;
  if(!connectionString){
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const pool = new Pool({ connectionString });
  try{
    const res = await pool.query('SELECT id, level FROM "Grade" ORDER BY id');
    console.log(JSON.stringify(res.rows, null, 2));
  }catch(e){
    console.error('Query error', e.message || e);
    process.exitCode = 1;
  }finally{
    await pool.end();
  }
})();
