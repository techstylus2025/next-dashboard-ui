ALTER TABLE "LessonLearningResource"
ALTER COLUMN "lessonId" DROP NOT NULL;

ALTER TABLE "LessonLearningResource"
ADD COLUMN "classId" INTEGER;

CREATE INDEX "LessonLearningResource_classId_idx"
ON "LessonLearningResource"("classId");

ALTER TABLE "LessonLearningResource"
ADD CONSTRAINT "LessonLearningResource_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
