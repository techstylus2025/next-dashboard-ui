-- Delete grade level 6 (not part of the new system)
DELETE FROM "Grade" WHERE level = 6;

-- AlterTable Grade
ALTER TABLE "Grade" ADD COLUMN "level_new" "GradingLevel";

-- Migrate data from numeric level to GradingLevel enum
UPDATE "Grade" 
SET "level_new" = CASE 
  WHEN level = 1 THEN 'CRECHE'::"GradingLevel"
  WHEN level = 2 THEN 'NURSERY'::"GradingLevel"
  WHEN level = 3 THEN 'KINDERGARTEN'::"GradingLevel"
  WHEN level = 4 THEN 'PRIMARY'::"GradingLevel"
  WHEN level = 5 THEN 'JHS'::"GradingLevel"
  ELSE 'PRIMARY'::"GradingLevel"
END;

-- Drop the old level column and its unique constraint
ALTER TABLE "Grade" DROP COLUMN "level";

-- Rename the new column to level
ALTER TABLE "Grade" RENAME COLUMN "level_new" TO "level";

-- Add unique constraint back
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_level_key" UNIQUE ("level");

