-- Manual creation of User and Session tables if missing
CREATE TABLE IF NOT EXISTS "public"."User" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT UNIQUE,
  "email" TEXT UNIQUE,
  "password" TEXT,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "public"."Session" (
  "id" TEXT PRIMARY KEY,
  "token" TEXT UNIQUE,
  "userId" TEXT REFERENCES "public"."User"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "ip" TEXT,
  "userAgent" TEXT
);
