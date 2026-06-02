-- Move days/weeks from academic year to each term

ALTER TABLE "AcademicTerm" ADD COLUMN "days" INTEGER;
ALTER TABLE "AcademicTerm" ADD COLUMN "weeks" INTEGER;

UPDATE "AcademicTerm" t
SET
  "days" = y."daysPerTerm",
  "weeks" = y."weeksPerTerm"
FROM "AcademicYear" y
WHERE t."academicYearId" = y.id;

ALTER TABLE "AcademicTerm" ALTER COLUMN "days" SET NOT NULL;
ALTER TABLE "AcademicTerm" ALTER COLUMN "weeks" SET NOT NULL;

ALTER TABLE "AcademicYear" DROP COLUMN "daysPerTerm";
ALTER TABLE "AcademicYear" DROP COLUMN "weeksPerTerm";
