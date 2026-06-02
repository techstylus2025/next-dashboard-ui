-- AlterTable
ALTER TABLE "FeePayment" ADD COLUMN     "methodDetails" TEXT,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'cash';
