-- Fee management (apply with: npx prisma migrate dev)

CREATE TYPE "FeeTerm" AS ENUM ('TERM_1', 'TERM_2', 'TERM_3');

CREATE TABLE "FeeSchedule" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "term" "FeeTerm" NOT NULL,
    "totalBillCedis" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeeSchedule_classId_academicYear_term_key" ON "FeeSchedule"("classId", "academicYear", "term");

ALTER TABLE "FeeSchedule" ADD CONSTRAINT "FeeSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StudentFeeAssignment" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeScheduleId" INTEGER NOT NULL,
    "totalBillCedis" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "StudentFeeAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentFeeAssignment_studentId_feeScheduleId_key" ON "StudentFeeAssignment"("studentId", "feeScheduleId");

ALTER TABLE "StudentFeeAssignment" ADD CONSTRAINT "StudentFeeAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentFeeAssignment" ADD CONSTRAINT "StudentFeeAssignment_feeScheduleId_fkey" FOREIGN KEY ("feeScheduleId") REFERENCES "FeeSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FeePayment" (
    "id" SERIAL NOT NULL,
    "studentFeeAssignmentId" INTEGER NOT NULL,
    "amountCedis" DECIMAL(12,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_studentFeeAssignmentId_fkey" FOREIGN KEY ("studentFeeAssignmentId") REFERENCES "StudentFeeAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
