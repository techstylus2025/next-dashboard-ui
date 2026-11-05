CREATE TYPE "AssessmentType" AS ENUM ('MID_TERM', 'MOCK');

ALTER TABLE "Class"
ADD COLUMN "classScoreMaximum" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "examScoreMaximum" INTEGER NOT NULL DEFAULT 50;

CREATE TABLE "AssessmentReport" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "termNumber" INTEGER NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "assessmentNumber" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "overallPercentage" DOUBLE PRECISION,
    "overallGrade" TEXT,
    "overallRemark" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isWithheld" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentReportSubjectLine" (
    "id" SERIAL NOT NULL,
    "assessmentReportId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT,
    "remark" TEXT,
    "lastEditedById" TEXT,

    CONSTRAINT "AssessmentReportSubjectLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentReport_studentId_academicYearId_termNumber_type_assessmentNumber_key"
ON "AssessmentReport"("studentId", "academicYearId", "termNumber", "type", "assessmentNumber");

CREATE INDEX "AssessmentReport_classId_academicYearId_termNumber_type_assessmentNumber_idx"
ON "AssessmentReport"("classId", "academicYearId", "termNumber", "type", "assessmentNumber");

CREATE UNIQUE INDEX "AssessmentReportSubjectLine_assessmentReportId_subjectId_key"
ON "AssessmentReportSubjectLine"("assessmentReportId", "subjectId");

ALTER TABLE "AssessmentReport"
ADD CONSTRAINT "AssessmentReport_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentReport"
ADD CONSTRAINT "AssessmentReport_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentReport"
ADD CONSTRAINT "AssessmentReport_academicYearId_fkey"
FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentReportSubjectLine"
ADD CONSTRAINT "AssessmentReportSubjectLine_assessmentReportId_fkey"
FOREIGN KEY ("assessmentReportId") REFERENCES "AssessmentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentReportSubjectLine"
ADD CONSTRAINT "AssessmentReportSubjectLine_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
