require('dotenv').config();
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function testParentArchive() {
  console.log('--- Parent archive test ---');
  const parent = await db.parent.findFirst({
    where: {
      isArchived: false,
      students: { some: { isArchived: false } },
    },
    include: {
      students: { where: { isArchived: false }, select: { id: true } },
    },
  });
  if (!parent) {
    console.log('No unarchived parent with active students found.');
    return;
  }
  const studentIds = parent.students.map((s) => s.id);
  const before = {
    parent: await db.parent.findUnique({ where: { id: parent.id }, select: { isArchived: true, archivedAt: true } }),
    students: await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, isArchived: true, archivedAt: true } }),
    attendance: await db.attendance.count({ where: { studentId: { in: studentIds }, isArchived: false } }),
    results: await db.result.count({ where: { studentId: { in: studentIds }, isArchived: false } }),
  };
  console.log('Parent selected:', parent.id, 'studentIds:', studentIds.length, 'attendance:', before.attendance, 'results:', before.results);

  const result = await db.$transaction(async (tx) => {
    const attendanceUpdate = await tx.attendance.updateMany({
      where: { studentId: { in: studentIds }, isArchived: false },
      data: { isArchived: true },
    });
    const resultsUpdate = await tx.result.updateMany({
      where: { studentId: { in: studentIds }, isArchived: false },
      data: { isArchived: true },
    });
    await tx.student.updateMany({ where: { id: { in: studentIds } }, data: { isArchived: true, archivedAt: new Date() } });
    await tx.parent.update({ where: { id: parent.id }, data: { isArchived: true, archivedAt: new Date() } });
    return { attendance: attendanceUpdate.count, results: resultsUpdate.count };
  });

  const after = {
    parent: await db.parent.findUnique({ where: { id: parent.id }, select: { isArchived: true, archivedAt: true } }),
    students: await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, isArchived: true, archivedAt: true } }),
    attendance: await db.attendance.count({ where: { studentId: { in: studentIds }, isArchived: true } }),
    results: await db.result.count({ where: { studentId: { in: studentIds }, isArchived: true } }),
  };

  console.log('Archived counts:', result);
  console.log('After parent archived:', after.parent);
  console.log('After student archived count:', after.students.length, 'attendance archived:', after.attendance, 'results archived:', after.results);

  // revert
  await db.$transaction(async (tx) => {
    await tx.attendance.updateMany({ where: { studentId: { in: studentIds }, isArchived: true }, data: { isArchived: false } });
    await tx.result.updateMany({ where: { studentId: { in: studentIds }, isArchived: true }, data: { isArchived: false } });
    await tx.student.updateMany({ where: { id: { in: studentIds } }, data: { isArchived: false, archivedAt: null } });
    await tx.parent.update({ where: { id: parent.id }, data: { isArchived: false, archivedAt: null } });
  });

  console.log('Parent archive test reverted.');
}

async function testTeacherArchive() {
  console.log('--- Teacher archive test ---');
  const teacher = await db.teacher.findFirst({
    where: { isArchived: false },
    include: {
      lessons: { select: { id: true } },
    },
  });
  if (!teacher) {
    console.log('No unarchived teacher found.');
    return;
  }
  const lessonIds = teacher.lessons.map((l) => l.id);
  const before = {
    attendance: await db.attendance.count({ where: { teacherId: teacher.id, isArchived: false } }),
    exams: await db.exam.count({ where: { lessonId: { in: lessonIds }, isArchived: false } }),
    assignments: await db.assignment.count({ where: { lessonId: { in: lessonIds }, isArchived: false } }),
    results: await db.result.count({ where: { isArchived: false, OR: [{ exam: { lessonId: { in: lessonIds } } }, { assignment: { lessonId: { in: lessonIds } } }] } }),
  };

  console.log('Teacher selected:', teacher.id, 'lessons:', lessonIds.length, 'attendance:', before.attendance, 'exams:', before.exams, 'assignments:', before.assignments, 'results:', before.results);

  const result = await db.$transaction(async (tx) => {
    const attendanceUpdate = await tx.attendance.updateMany({ where: { teacherId: teacher.id, isArchived: false }, data: { isArchived: true } });
    const examsUpdate = await tx.exam.updateMany({ where: { lessonId: { in: lessonIds }, isArchived: false }, data: { isArchived: true } });
    const assignmentsUpdate = await tx.assignment.updateMany({ where: { lessonId: { in: lessonIds }, isArchived: false }, data: { isArchived: true } });
    const resultsUpdate = await tx.result.updateMany({
      where: { isArchived: false, OR: [{ exam: { lessonId: { in: lessonIds } } }, { assignment: { lessonId: { in: lessonIds } } }] },
      data: { isArchived: true },
    });
    await tx.teacher.update({ where: { id: teacher.id }, data: { isArchived: true, archivedAt: new Date() } });
    return {
      attendance: attendanceUpdate.count,
      exams: examsUpdate.count,
      assignments: assignmentsUpdate.count,
      results: resultsUpdate.count,
    };
  });

  const after = {
    attendance: await db.attendance.count({ where: { teacherId: teacher.id, isArchived: true } }),
    exams: await db.exam.count({ where: { lessonId: { in: lessonIds }, isArchived: true } }),
    assignments: await db.assignment.count({ where: { lessonId: { in: lessonIds }, isArchived: true } }),
    results: await db.result.count({ where: { isArchived: true, OR: [{ exam: { lessonId: { in: lessonIds } } }, { assignment: { lessonId: { in: lessonIds } } }] } }),
    teacher: await db.teacher.findUnique({ where: { id: teacher.id }, select: { id: true, isArchived: true, archivedAt: true } }),
  };

  console.log('Archived counts:', result);
  console.log('After teacher archived:', after.teacher, 'attendance archived:', after.attendance, 'exams archived:', after.exams, 'assignments archived:', after.assignments, 'results archived:', after.results);

  await db.$transaction(async (tx) => {
    await tx.attendance.updateMany({ where: { teacherId: teacher.id, isArchived: true }, data: { isArchived: false } });
    await tx.exam.updateMany({ where: { lessonId: { in: lessonIds }, isArchived: true }, data: { isArchived: false } });
    await tx.assignment.updateMany({ where: { lessonId: { in: lessonIds }, isArchived: true }, data: { isArchived: false } });
    await tx.result.updateMany({ where: { isArchived: true, OR: [{ exam: { lessonId: { in: lessonIds } } }, { assignment: { lessonId: { in: lessonIds } } }] }, data: { isArchived: false } });
    await tx.teacher.update({ where: { id: teacher.id }, data: { isArchived: false, archivedAt: null } });
  });

  console.log('Teacher archive test reverted.');
}

async function testStudentArchive() {
  console.log('--- Student archive test ---');
  const student = await db.student.findFirst({ where: { isArchived: false } });
  if (!student) {
    console.log('No unarchived student found.');
    return;
  }
  const before = {
    attendance: await db.attendance.count({ where: { studentId: student.id, isArchived: false } }),
    results: await db.result.count({ where: { studentId: student.id, isArchived: false } }),
  };

  console.log('Student selected:', student.id, 'attendance:', before.attendance, 'results:', before.results);

  const result = await db.$transaction(async (tx) => {
    const attendanceUpdate = await tx.attendance.updateMany({ where: { studentId: student.id, isArchived: false }, data: { isArchived: true } });
    const resultsUpdate = await tx.result.updateMany({ where: { studentId: student.id, isArchived: false }, data: { isArchived: true } });
    await tx.student.update({ where: { id: student.id }, data: { isArchived: true, archivedAt: new Date() } });
    return { attendance: attendanceUpdate.count, results: resultsUpdate.count };
  });

  const after = {
    attendance: await db.attendance.count({ where: { studentId: student.id, isArchived: true } }),
    results: await db.result.count({ where: { studentId: student.id, isArchived: true } }),
    student: await db.student.findUnique({ where: { id: student.id }, select: { id: true, isArchived: true, archivedAt: true } }),
  };

  console.log('Archived counts:', result);
  console.log('After student archived:', after.student, 'attendance archived:', after.attendance, 'results archived:', after.results);

  await db.$transaction(async (tx) => {
    await tx.attendance.updateMany({ where: { studentId: student.id, isArchived: true }, data: { isArchived: false } });
    await tx.result.updateMany({ where: { studentId: student.id, isArchived: true }, data: { isArchived: false } });
    await tx.student.update({ where: { id: student.id }, data: { isArchived: false, archivedAt: null } });
  });

  console.log('Student archive test reverted.');
}

(async () => {
  try {
    await testParentArchive();
    await testTeacherArchive();
    await testStudentArchive();
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
    await pool.end();
  }
})();
