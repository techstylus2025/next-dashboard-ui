require('dotenv').config();
const { Pool } = require('pg');
(async ()=>{
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try{
    const r = await pool.query('SELECT id, name, capacity, "gradeId", "supervisorId" FROM "Class" ORDER BY id DESC LIMIT 5');
    console.log(JSON.stringify(r.rows,null,2));
  }catch(e){ console.error('err', e.message||e); }
  finally{ await pool.end(); }
})();
