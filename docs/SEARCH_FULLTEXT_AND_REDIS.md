Overview

This document explains how to enable Postgres full-text search indexes and Redis caching for the global search API.

Enable Postgres full-text search (recommended for production):

1. Ensure your database is Postgres and reachable with `DATABASE_URL`.
2. Run the migration SQL included in `prisma/migrations/20260530120000_add_fulltext_search/migration.sql`.

   Using Prisma Migrate (recommended):

   ```bash
   npx prisma migrate dev --name add_fulltext_search
   # or for production
   npx prisma migrate deploy
   ```

   If you prefer to run the SQL directly (be careful):

   ```bash
   psql "$DATABASE_URL" -f prisma/migrations/20260530120000_add_fulltext_search/migration.sql
   ```

3. After migration, enable full-text in the app by setting an environment variable:

   - `USE_PG_FULLTEXT=1`

   Add the flag to your local `.env` file so the API uses the indexed search path.

Redis caching (optional, recommended for multi-instance deployments):

1. Install Redis or use a hosted Redis provider and set `REDIS_URL` (e.g. `redis://:password@host:6379`).
2. Install dependencies (already added to `package.json`): `ioredis`.
3. The server will automatically use Redis if `REDIS_URL` is set. Cache TTLs:
   - Suggestions: ~5 seconds
   - Full searches: ~30 seconds

Fuzzy search (client-side):

- `fuse.js` is included for lightweight fuzzy ranking on suggestion responses.

Install new dependencies and run dev:

```bash
npm install
npm run dev
```

Notes

- The included migration adds `search_vector` tsvector columns and triggers on key models. If you already have a different full-text strategy, adapt or skip the migration.
- For production-scale search, consider a dedicated search engine (Elasticsearch/Meilisearch) or a managed provider.
