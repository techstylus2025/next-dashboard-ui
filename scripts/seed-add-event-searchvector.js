require('dotenv').config();
const { Pool } = require('pg');
(async ()=>{
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try{
    await pool.query('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS search_vector tsvector');
    await pool.query("UPDATE \"Event\" SET search_vector = to_tsvector('english', coalesce(title,'' ) || ' ' || coalesce(description,''))");
    await pool.query('CREATE INDEX IF NOT EXISTS idx_event_search_vector ON "Event" USING GIN (search_vector)');

    await pool.query('ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS search_vector tsvector');
    await pool.query("UPDATE \"Announcement\" SET search_vector = to_tsvector('english', coalesce(title,'' ) || ' ' || coalesce(description,''))");
    await pool.query('CREATE INDEX IF NOT EXISTS idx_announcement_search_vector ON "Announcement" USING GIN (search_vector)');

    console.log('Added search_vector to Event and Announcement and created indexes');
  }catch(e){ console.error('err', e.message || e); }
  finally{ await pool.end(); }
})();
