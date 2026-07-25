/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `Message` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_announcement_search_vector";

-- DropIndex
DROP INDEX "idx_book_search_vector";

-- DropIndex
DROP INDEX "idx_class_search_vector";

-- DropIndex
DROP INDEX "idx_event_search_vector";

-- DropIndex
DROP INDEX "idx_message_search_vector";

-- DropIndex
DROP INDEX "Parent_isArchived_idx";

-- DropIndex
DROP INDEX "idx_parent_search_vector";

-- DropIndex
DROP INDEX "Student_isArchived_idx";

-- DropIndex
DROP INDEX "idx_student_search_vector";

-- DropIndex
DROP INDEX "Teacher_isArchived_idx";

-- DropIndex
DROP INDEX "idx_teacher_search_vector";

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "search_vector",
ADD COLUMN     "publication" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "search_vector";
