require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query('ALTER TABLE "Class" DISABLE TRIGGER ALL;');
    await client.query('ALTER TABLE "Teacher" DISABLE TRIGGER ALL;');
    await client.query('ALTER TABLE "Parent" DISABLE TRIGGER ALL;');
    await client.query('ALTER TABLE "Student" DISABLE TRIGGER ALL;');
    console.log('disabled triggers');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
