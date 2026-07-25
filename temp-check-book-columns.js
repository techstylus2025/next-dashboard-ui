require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Book' ORDER BY ordinal_position");
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    await pool.end();
  }
})();
