# Lama Dev School Management Dashboard

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Production deployment

The Vercel build runs Prisma Client generation and `next build`; it does not connect to the production database to apply migrations.

Before deploying a release that includes new Prisma migrations, run the migration command once against the production `DATABASE_URL`:

```bash
npm run db:migrate:deploy
```

Run this as a serialized release step, not concurrently with another migration deployment. Configure `DATABASE_URL` in the deployment environment and use the appropriate production credentials when running the migration. This keeps database migration locking separate from Vercel's parallel or retried build jobs.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Lama Dev Youtube Channel](https://youtube.com/lamadev) 
- [Next.js](https://nextjs.org/learn)