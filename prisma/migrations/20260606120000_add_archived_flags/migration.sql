-- Add archived flags to Student model
ALTER TABLE "Student" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Student" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Add archived flags to Teacher model
ALTER TABLE "Teacher" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Teacher" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Add archived flags to Parent model
ALTER TABLE "Parent" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Parent" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Create indexes for archived queries
CREATE INDEX "Student_isArchived_idx" ON "Student"("isArchived");
CREATE INDEX "Teacher_isArchived_idx" ON "Teacher"("isArchived");
CREATE INDEX "Parent_isArchived_idx" ON "Parent"("isArchived");
