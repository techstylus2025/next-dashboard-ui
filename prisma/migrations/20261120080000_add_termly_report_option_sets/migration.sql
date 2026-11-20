CREATE TABLE "TermlyReportOptionSet" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "interestOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "conductOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "supervisorRemarkOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "headteacherRemarkOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermlyReportOptionSet_pkey" PRIMARY KEY ("id")
);
