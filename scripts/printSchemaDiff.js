require('dotenv').config();
const { execFileSync } = require('child_process');
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not defined');
}
try {
  const out = execFileSync('npx.cmd', ['prisma', 'migrate', 'diff', '--from-schema-datamodel', 'prisma/schema.prisma', '--to-database', url, '--script'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(out);
} catch (err) {
  if (err.stdout) console.log(err.stdout.toString());
  if (err.stderr) console.error(err.stderr.toString());
  process.exit(1);
}
