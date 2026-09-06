-- Add missing holidays column for academic terms

ALTER TABLE "AcademicTerm"
ADD COLUMN IF NOT EXISTS "holidays" INTEGER NOT NULL DEFAULT 0;
