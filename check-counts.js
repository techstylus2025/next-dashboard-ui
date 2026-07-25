require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const rows = await client.query({
      text: 'SELECT (SELECT COUNT(*) FROM "Admin") as admin, (SELECT COUNT(*) FROM "Student") as student, (SELECT COUNT(*) FROM "Teacher") as teacher, (SELECT COUNT(*) FROM "Parent") as parent, (SELECT COUNT(*) FROM "Class") as class, (SELECT COUNT(*) FROM "Grade") as grade',
    });
    console.log(JSON.stringify(rows.rows[0], null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
