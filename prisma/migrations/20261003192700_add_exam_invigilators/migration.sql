CREATE TABLE "_ExamInvigilators" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_ExamInvigilators_AB_unique" ON "_ExamInvigilators"("A", "B");
CREATE INDEX "_ExamInvigilators_B_index" ON "_ExamInvigilators"("B");

ALTER TABLE "_ExamInvigilators"
ADD CONSTRAINT "_ExamInvigilators_A_fkey"
FOREIGN KEY ("A") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ExamInvigilators"
ADD CONSTRAINT "_ExamInvigilators_B_fkey"
FOREIGN KEY ("B") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
