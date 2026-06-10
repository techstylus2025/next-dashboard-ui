DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Department') THEN
    CREATE TYPE "Department" AS ENUM ('PRESCHOOL', 'PRIMARY', 'JHS');
  END IF;
END$$;

ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "allergyDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "alternativeEmergencyContactNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "alternativeEmergencyContactPerson" TEXT,
  ADD COLUMN IF NOT EXISTS "correctiveGlassesDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "declarationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "declarationName" TEXT,
  ADD COLUMN IF NOT EXISTS "department" "Department",
  ADD COLUMN IF NOT EXISTS "emergencyContactNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "emergencyContactPerson" TEXT,
  ADD COLUMN IF NOT EXISTS "fitnessDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "gpsAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "hasAllergies" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasHearingDifficulties" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hearingDetails" TEXT,
  ADD COLUMN IF NOT EXISTS "knownMedicalConditions" TEXT,
  ADD COLUMN IF NOT EXISTS "languagesSpoken" TEXT,
  ADD COLUMN IF NOT EXISTS "nationality" TEXT,
  ADD COLUMN IF NOT EXISTS "otherIssues" TEXT,
  ADD COLUMN IF NOT EXISTS "otherNames" TEXT,
  ADD COLUMN IF NOT EXISTS "physicallyFitForSports" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "previousClass" TEXT,
  ADD COLUMN IF NOT EXISTS "previousSchoolName" TEXT,
  ADD COLUMN IF NOT EXISTS "reasonForTransfer" TEXT,
  ADD COLUMN IF NOT EXISTS "religion" TEXT,
  ADD COLUMN IF NOT EXISTS "wearsCorrectiveGlasses" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "yearsAttended" INTEGER;
