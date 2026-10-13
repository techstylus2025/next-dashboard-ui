-- AlterTable
ALTER TABLE "_ExamInvigilators" ADD CONSTRAINT "_ExamInvigilators_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ExamInvigilators_AB_unique";

-- AlterTable
ALTER TABLE "_TeacherAssignedClasses" ADD CONSTRAINT "_TeacherAssignedClasses_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_TeacherAssignedClasses_AB_unique";
