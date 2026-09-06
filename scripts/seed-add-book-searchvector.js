require('dotenv').config();
const { Pool } = require('pg');
(async ()=>{
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try{
    await pool.query('ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS search_vector tsvector');
    await pool.query("UPDATE \"Book\" SET search_vector = to_tsvector('english', coalesce(\"title\",'') || ' ' || coalesce(\"supplierName\",''))");
    await pool.query('CREATE INDEX IF NOT EXISTS idx_book_search_vector ON "Book" USING GIN (search_vector)');
    console.log('Added search_vector to Book and created index');
  }catch(e){ console.error('err', e.message || e); }
  finally{ await pool.end(); }
})();
