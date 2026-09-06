require('dotenv').config();
const { Pool } = require('pg');
(async ()=>{
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try{
    await pool.query('ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS search_vector tsvector');
    await pool.query('UPDATE "Class" SET search_vector = to_tsvector(\'english\', coalesce(name,\'\'))');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_class_search_vector ON "Class" USING GIN (search_vector)');
    console.log('Added search_vector to Class and created index');
  }catch(e){ console.error('err', e.message || e); }
  finally{ await pool.end(); }
})();
