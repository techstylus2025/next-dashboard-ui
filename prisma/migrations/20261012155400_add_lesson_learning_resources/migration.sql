CREATE TYPE "LearningResourceType" AS ENUM ('DOCUMENT', 'IMAGE', 'YOUTUBE');

CREATE TABLE "LessonLearningResource" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LearningResourceType" NOT NULL,
    "fileName" TEXT,
    "assetUrl" TEXT NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonLearningResource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LessonLearningResource_lessonId_idx"
ON "LessonLearningResource"("lessonId");

ALTER TABLE "LessonLearningResource"
ADD CONSTRAINT "LessonLearningResource_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
