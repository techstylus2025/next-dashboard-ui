CREATE TABLE "_TeacherAssignedClasses" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_TeacherAssignedClasses_AB_unique" ON "_TeacherAssignedClasses"("A", "B");
CREATE INDEX "_TeacherAssignedClasses_B_index" ON "_TeacherAssignedClasses"("B");

ALTER TABLE "_TeacherAssignedClasses"
ADD CONSTRAINT "_TeacherAssignedClasses_A_fkey"
FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_TeacherAssignedClasses"
ADD CONSTRAINT "_TeacherAssignedClasses_B_fkey"
FOREIGN KEY ("B") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
