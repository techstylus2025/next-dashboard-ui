-- DropForeignKey
ALTER TABLE "public"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."Session";

-- CreateTable
CREATE TABLE "public"."role_migration_backups" (
    "backup_id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_role" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_migration_backups_pkey" PRIMARY KEY ("backup_id")
);
