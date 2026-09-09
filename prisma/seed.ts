import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Day, PrismaClient, UserSex } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ADMIN
  await prisma.admin.upsert({
    where: { id: "admin1" },
    update: {},
    create: { id: "admin1", username: "admin1" },
  });
  await prisma.admin.upsert({
    where: { id: "admin2" },
    update: {},
    create: { id: "admin2", username: "admin2" },
  });

  // GRADE
  const gradingLevels: Array<"CRECHE" | "NURSERY" | "KINDERGARTEN" | "PRIMARY" | "JHS"> = [
    "CRECHE",
    "NURSERY",
    "KINDERGARTEN",
    "PRIMARY",
    "JHS",
  ];
  const existingGrades = await prisma.grade.findMany({ select: { level: true } });
  const existingGradeLevels = new Set(existingGrades.map((grade) => grade.level));
  for (const level of gradingLevels) {
    if (!existingGradeLevels.has(level)) {
      await prisma.grade.create({ data: { level } });
    }
  }

  // CLASS
  const classGradeByLevel = Object.fromEntries(
    (await prisma.grade.findMany({ select: { id: true, level: true } })).map((grade) => [grade.level, grade.id])
  );
  const existingClassNames = new Set((await prisma.class.findMany({ select: { name: true } })).map((item) => item.name));
  const classSeeds = [
    { name: "Creche A", gradeLevel: "CRECHE", capacity: 20 },
    { name: "Nursery A", gradeLevel: "NURSERY", capacity: 22 },
    { name: "Primary A", gradeLevel: "PRIMARY", capacity: 25 },
  ];
  for (const classSeed of classSeeds) {
    if (!existingClassNames.has(classSeed.name)) {
      await prisma.class.create({
        data: {
          name: classSeed.name,
          gradeId: classGradeByLevel[classSeed.gradeLevel as keyof typeof classGradeByLevel],
          capacity: classSeed.capacity,
        },
      });
      existingClassNames.add(classSeed.name);
    }
  }

  // TEACHER
  const teacherCount = await prisma.teacher.count();
  if (teacherCount === 0) {
    const birthday = new Date();
    birthday.setFullYear(birthday.getFullYear() - 35);

    const classes = await prisma.class.findMany({ select: { id: true }, take: 3 });
    await prisma.teacher.create({
      data: {
        id: "teacher1",
        username: "teacher1",
        name: "Ada",
        surname: "Lovelace",
        email: "teacher1@example.com",
        phone: "123-456-7890",
        address: "Accra",
        bloodType: "A+",
        sex: UserSex.FEMALE,
        classes: { connect: classes.map((cls) => ({ id: cls.id })) },
        birthday,
      },
    });
  }

  // SUBJECT
  const subjectData = [
    { name: "Mathematics", gradeLevel: "PRIMARY" },
    { name: "Science", gradeLevel: "PRIMARY" },
    { name: "English", gradeLevel: "PRIMARY" },
    { name: "History", gradeLevel: "PRIMARY" },
    { name: "Geography", gradeLevel: "PRIMARY" },
    { name: "Physics", gradeLevel: "JHS" },
    { name: "Chemistry", gradeLevel: "JHS" },
    { name: "Biology", gradeLevel: "JHS" },
    { name: "Computer Science", gradeLevel: "JHS" },
    { name: "Art", gradeLevel: "NURSERY" },
  ];

  const existingSubjects = await prisma.subject.findMany({ select: { id: true, name: true, gradeId: true } });
  const existingSubjectKeys = new Set(existingSubjects.map((subject) => `${subject.gradeId}:${subject.name}`));
  const subjectGradeByLevel = Object.fromEntries(
    (await prisma.grade.findMany({ select: { id: true, level: true } })).map((grade) => [grade.level, grade.id])
  );
  for (const subject of subjectData) {
    const gradeId = subjectGradeByLevel[subject.gradeLevel as keyof typeof subjectGradeByLevel];
    const key = `${gradeId}:${subject.name}`;
    if (!existingSubjectKeys.has(key)) {
      await prisma.subject.create({
        data: {
          name: subject.name,
          gradeId,
        },
      });
      existingSubjectKeys.add(key);
    }
  }

  // TEACHER
  const classes = await prisma.class.findMany({ select: { id: true } });
  const subjects = await prisma.subject.findMany({ select: { id: true } });
  for (let i = 1; i <= 5; i++) {
    const birthday = new Date();
    birthday.setFullYear(birthday.getFullYear() - 30);

    await prisma.teacher.upsert({
      where: { id: `teacher${i}` },
      update: {},
      create: {
        id: `teacher${i}`,
        username: `teacher${i}`,
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: `teacher${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        subjects: { connect: subjects.slice(0, 3).map((subject) => ({ id: subject.id })) },
        classes: { connect: classes.slice(0, 2).map((cls) => ({ id: cls.id })) },
        birthday,
      },
    });
  }

  // LESSON
  const dayValues = Object.values(Day);
  const lessonCount = await prisma.lesson.count();
  if (lessonCount === 0) {
    const lessonSubjects = await prisma.subject.findMany({ select: { id: true }, take: 5 });
    const lessonTeachers = await prisma.teacher.findMany({ select: { id: true }, take: 5 });
    const lessonClasses = await prisma.class.findMany({ select: { id: true }, take: 5 });
    for (let i = 1; i <= 10; i++) {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 1);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);

      await prisma.lesson.create({
        data: {
          name: `Lesson${i}`,
          day: dayValues[Math.floor(Math.random() * dayValues.length)] as Day,
          startTime,
          endTime,
          subjectId: lessonSubjects[(i - 1) % lessonSubjects.length].id,
          classId: lessonClasses[(i - 1) % lessonClasses.length].id,
          teacherId: lessonTeachers[(i - 1) % lessonTeachers.length].id,
        },
      });
    }
  }

  // PARENT
  for (let i = 1; i <= 25; i++) {
    await prisma.parent.upsert({
      where: { id: `parentId${i}` },
      update: {},
      create: {
        id: `parentId${i}`,
        username: `parentId${i}`,
        name: `PName ${i}`,
        surname: `PSurname ${i}`,
        email: `parent${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
      },
    });
  }

  // STUDENT
  const classIds = (await prisma.class.findMany({ select: { id: true } })).map((cls) => cls.id);
  const gradeIds = (await prisma.grade.findMany({ select: { id: true } })).map((grade) => grade.id);
  for (let i = 1; i <= 50; i++) {
    const birthday = new Date();
    birthday.setFullYear(birthday.getFullYear() - 10);

    await prisma.student.upsert({
      where: { id: `student${i}` },
      update: {},
      create: {
        id: `student${i}`,
        username: `student${i}`,
        name: `SName${i}`,
        surname: `SSurname ${i}`,
        email: `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parentId${Math.ceil(i / 2) % 25 || 25}`,
        gradeId: gradeIds[(i - 1) % gradeIds.length],
        classId: classIds[(i - 1) % classIds.length] ?? 1,
        birthday,
      },
    });
  }

  // EXAM
  const lessonIds = (await prisma.lesson.findMany({ select: { id: true } })).map((lesson) => lesson.id);
  for (let i = 1; i <= 10; i++) {
    if (lessonIds.length === 0) break;

    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    await prisma.exam.create({
      data: {
        title: `Exam ${i}`,
        startTime,
        endTime,
        lessonId: lessonIds[(i - 1) % lessonIds.length],
      },
    });
  }

  // ASSIGNMENT
  for (let i = 1; i <= 10; i++) {
    if (lessonIds.length === 0) break;

    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1);
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 1);

    await prisma.assignment.create({
      data: {
        title: `Assignment ${i}`,
        startDate,
        dueDate,
        lessonId: lessonIds[(i - 1) % lessonIds.length],
      },
    });
  }

  // RESULT
  const examIds = (await prisma.exam.findMany({ select: { id: true } })).map((exam) => exam.id);
  const assignmentIds = (await prisma.assignment.findMany({ select: { id: true } })).map((assignment) => assignment.id);
  const studentIds = (await prisma.student.findMany({ select: { id: true } })).map((student) => student.id);
  for (let i = 1; i <= 10; i++) {
    if (studentIds.length === 0) break;

    const studentId = studentIds[(i - 1) % studentIds.length];
    const resultData: { score: number; studentId: string; examId?: number; assignmentId?: number } = {
      score: 90,
      studentId,
    };

    if (examIds.length > 0 && i <= examIds.length) {
      resultData.examId = examIds[(i - 1) % examIds.length];
    } else if (assignmentIds.length > 0) {
      resultData.assignmentId = assignmentIds[(i - 1) % assignmentIds.length];
    }

    await prisma.result.create({ data: resultData });
  }

  // ATTENDANCE
  for (let i = 1; i <= 10; i++) {
    await prisma.attendance.create({
      data: {
        date: new Date(),
        present: true,
        studentId: `student${i}`,
      },
    });
  }

  // EVENT
  const existingClassIds = (await prisma.class.findMany({ select: { id: true } })).map((cls) => cls.id);
  for (let i = 1; i <= 5; i++) {
    if (existingClassIds.length === 0) break;

    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    await prisma.event.create({
      data: {
        title: `Event ${i}`,
        description: `Description for Event ${i}`,
        startTime,
        endTime,
        classId: existingClassIds[(i - 1) % existingClassIds.length],
      },
    });
  }

  // ANNOUNCEMENT
  for (let i = 1; i <= 5; i++) {
    if (existingClassIds.length === 0) break;

    await prisma.announcement.create({
      data: {
        title: `Announcement ${i}`,
        description: `Description for Announcement ${i}`,
        date: new Date(),
        classId: existingClassIds[(i - 1) % existingClassIds.length],
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
