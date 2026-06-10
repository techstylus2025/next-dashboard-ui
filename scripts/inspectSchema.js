require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  try {
    const tRes = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%student%' ORDER BY table_schema, table_name");
    console.log('tables:', tRes.rows);
    const cRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='Student' ORDER BY column_name");
    console.log('student columns:', cRes.rows);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
