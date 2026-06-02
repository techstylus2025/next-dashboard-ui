-- CreateEnum
CREATE TYPE "GradingLevel" AS ENUM ('CRECHE', 'KINDERGARTEN', 'PRIMARY', 'JHS');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN "gradingLevel" "GradingLevel" NOT NULL DEFAULT 'PRIMARY';

-- CreateTable
CREATE TABLE "GradingScaleEntry" (
    "id" SERIAL NOT NULL,
    "level" "GradingLevel" NOT NULL,
    "minScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingScaleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermlyReport" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "termNumber" INTEGER NOT NULL,
    "positionOnRoll" INTEGER,
    "totalOnRoll" INTEGER NOT NULL,
    "totalAttendance" INTEGER NOT NULL DEFAULT 0,
    "vacationDate" TIMESTAMP(3),
    "reopeningDate" TIMESTAMP(3),
    "overallPercentage" DOUBLE PRECISION,
    "overallGrade" TEXT,
    "overallRemark" TEXT,
    "interest" TEXT,
    "conduct" TEXT,
    "resultStatus" TEXT,
    "supervisorRemarks" TEXT,
    "supervisorSignature" TEXT,
    "headteacherRemarks" TEXT,
    "headteacherSignature" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermlyReportSubjectLine" (
    "id" SERIAL NOT NULL,
    "termlyReportId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "classScore" INTEGER NOT NULL DEFAULT 0,
    "examScore" INTEGER NOT NULL DEFAULT 0,
    "totalMarks" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT,
    "remark" TEXT,
    "lastEditedById" TEXT,

    CONSTRAINT "TermlyReportSubjectLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TermlyReport_studentId_academicYearId_termNumber_key" ON "TermlyReport"("studentId", "academicYearId", "termNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TermlyReportSubjectLine_termlyReportId_subjectId_key" ON "TermlyReportSubjectLine"("termlyReportId", "subjectId");

-- AddForeignKey
ALTER TABLE "TermlyReport" ADD CONSTRAINT "TermlyReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermlyReport" ADD CONSTRAINT "TermlyReport_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermlyReport" ADD CONSTRAINT "TermlyReport_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermlyReportSubjectLine" ADD CONSTRAINT "TermlyReportSubjectLine_termlyReportId_fkey" FOREIGN KEY ("termlyReportId") REFERENCES "TermlyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermlyReportSubjectLine" ADD CONSTRAINT "TermlyReportSubjectLine_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
