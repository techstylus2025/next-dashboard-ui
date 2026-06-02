-- CreateEnum
CREATE TYPE "PasswordChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PasswordChangeRequest" (
    "id" SERIAL NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedByRole" "UserRole" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newPassword" TEXT NOT NULL,
    "status" "PasswordChangeStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewComment" TEXT,

    CONSTRAINT "PasswordChangeRequest_pkey" PRIMARY KEY ("id")
);
