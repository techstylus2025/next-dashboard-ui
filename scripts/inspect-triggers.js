require('dotenv').config();
const { Pool } = require('pg');
(async ()=>{
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try{
    const trg = await pool.query("SELECT tgname, tgrelid::regclass::text as table_name, pg_get_triggerdef(oid) as def FROM pg_trigger WHERE tgname LIKE 'tsvectorupdate_%'");
    console.log('triggers:', JSON.stringify(trg.rows,null,2));
    const col = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='Class' AND column_name='search_vector'");
    console.log('class_search_vector:', JSON.stringify(col.rows,null,2));
    const cols = await pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE column_name='search_vector'");
    console.log('all_search_vector_cols:', JSON.stringify(cols.rows,null,2));
  }catch(e){ console.error('err', e.message || e); }
  finally{ await pool.end(); }
})();
