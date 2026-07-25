/*
  Warnings:

  - A unique constraint covering the columns `[pickupCode]` on the table `BookOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BookOrder" ADD COLUMN     "pickupCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BookOrder_pickupCode_key" ON "BookOrder"("pickupCode");
