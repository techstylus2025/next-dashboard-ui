ALTER TABLE "Class"
ADD COLUMN IF NOT EXISTS "supervisorSignature" TEXT;

ALTER TABLE "SchoolSetting"
ADD COLUMN IF NOT EXISTS "headteacherSignature" TEXT;
