import prisma from "@/lib/prisma";
import { computeSubjectPercentage } from "@/lib/gradingUtils";

export async function loadAnalyticsData() {
  const db = prisma;

  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });

  const academicYears = await db.academicYear.findMany({
    where: { isArchived: false },
    include: {
      terms: {
        select: { termNumber: true },
        orderBy: { termNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const performanceTerms = academicYears.flatMap((year) =>
    year.terms.map((term) => ({
      key: `${year.id}:${term.termNumber}`,
      academicYearId: year.id,
      academicYearLabel: year.label,
      termNumber: term.termNumber,
      label: `${year.label} · Term ${term.termNumber}`,
      isActive: year.isActive,
    }))
  );
  const activeYear = academicYears.find((year) => year.isActive);
  const activePerformanceTermKey = activeYear?.terms.length
    ? `${activeYear.id}:${Math.max(...activeYear.terms.map((term) => term.termNumber))}`
    : performanceTerms[0]?.key ?? "";

  const subjects = await db.subject.findMany({
    select: {
      id: true,
      name: true,
      grade: { select: { level: true } },
    },
  });
  const subjectLevelsByName = new Map<string, Set<string>>();
  for (const subject of subjects) {
    const key = subject.name.trim().toLocaleLowerCase();
    const levels = subjectLevelsByName.get(key) ?? new Set<string>();
    levels.add(subject.grade.level);
    subjectLevelsByName.set(key, levels);
  }
  const levelInitials: Record<string, string> = {
    CRECHE: "C",
    NURSERY: "N",
    KINDERGARTEN: "K",
    PRIMARY: "P",
    JHS: "JHS",
  };
  const subjectLabel = (name: string, level: string) =>
    (subjectLevelsByName.get(name.trim().toLocaleLowerCase())?.size ?? 0) > 1
      ? `${name} (${levelInitials[level] ?? level})`
      : name;

  const performanceReports = await db.termlyReport.findMany({
    where: {
      academicYearId: { in: academicYears.map((year) => year.id) },
    },
    include: {
      student: { select: { id: true, name: true, surname: true } },
      class: { select: { id: true, name: true } },
      subjectLines: {
        include: {
          subject: { select: { id: true, name: true, grade: { select: { level: true } } } },
        },
      },
    },
    orderBy: [{ classId: "asc" }, { student: { surname: "asc" } }],
  });

  type SubjectPerformance = {
    termKey: string;
    classId: number;
    className: string;
    subjectId: number;
    subjectName: string;
    gradingLevel: string;
    averageMarks: number;
    lowPerformanceCount: number;
    studentCount: number;
  };
  type TopStudent = {
    studentId: string;
    studentName: string;
    overallPercentage: number;
  };
  const subjectStats = new Map<string, {
    termKey: string;
    classId: number;
    className: string;
    subjectId: number;
    subjectName: string;
    gradingLevel: string;
    totalMarks: number;
    count: number;
    lowPerformanceCount: number;
  }>();
  const rankingsByTermClass = new Map<string, {
    termKey: string;
    classId: number;
    className: string;
    topStudents: TopStudent[];
  }>();

  for (const report of performanceReports) {
    const termKey = `${report.academicYearId}:${report.termNumber}`;
    const enteredLines = report.subjectLines.filter(
      (line) =>
        line.lastEditedById !== null ||
        line.classScore > 0 ||
        line.examScore > 0
    );
    const percentages: number[] = [];

    for (const line of enteredLines) {
      const percentage = computeSubjectPercentage(line.classScore, line.examScore);
      percentages.push(percentage);
      const key = `${termKey}:${report.classId}:${line.subjectId}`;
      const stats = subjectStats.get(key) ?? {
        termKey,
        classId: report.classId,
        className: report.class.name,
        subjectId: line.subjectId,
        subjectName: subjectLabel(line.subject.name, line.subject.grade.level),
        gradingLevel: line.subject.grade.level,
        totalMarks: 0,
        count: 0,
        lowPerformanceCount: 0,
      };
      stats.totalMarks += percentage;
      stats.count += 1;
      if (percentage < 40) stats.lowPerformanceCount += 1;
      subjectStats.set(key, stats);
    }

    if (percentages.length > 0) {
      const key = `${termKey}:${report.classId}`;
      const entry = rankingsByTermClass.get(key) ?? {
        termKey,
        classId: report.classId,
        className: report.class.name,
        topStudents: [],
      };
      entry.topStudents.push({
        studentId: report.student.id,
        studentName: `${report.student.name} ${report.student.surname}`,
        overallPercentage:
          Math.round(
            (percentages.reduce((sum, value) => sum + value, 0) /
              percentages.length) *
              100
          ) / 100,
      });
      rankingsByTermClass.set(key, entry);
    }
  }

  const subjectPerformanceSummary: SubjectPerformance[] = Array.from(
    subjectStats.values(),
    (stats) => ({
      termKey: stats.termKey,
      classId: stats.classId,
      className: stats.className,
      subjectId: stats.subjectId,
      subjectName: stats.subjectName,
      gradingLevel: stats.gradingLevel,
      averageMarks: stats.totalMarks / stats.count,
      lowPerformanceCount: stats.lowPerformanceCount,
      studentCount: stats.count,
    })
  ).sort((a, b) => b.averageMarks - a.averageMarks);
  const topStudentsByClass = Array.from(rankingsByTermClass.values())
    .map((entry) => ({
      ...entry,
      topStudents: entry.topStudents
        .sort((a, b) => b.overallPercentage - a.overallPercentage)
        .slice(0, 5),
    }))
    .sort((a, b) => a.className.localeCompare(b.className));

  // Students by class (counts)
  const studentsByClass = classes.map((c) => ({ classId: c.id, className: c.name, studentCount: c._count.students }));

  // Attendance: counts for today and recent attendants
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const todaysStudentAttendances = await db.attendance.findMany({
    where: { date: { gte: startOfToday, lt: endOfToday }, present: true, studentId: { not: null } },
    include: { student: { select: { classId: true } } },
  });

  const presentByClass: Record<number, number> = {};
  for (const a of todaysStudentAttendances) {
    const cls = a.student?.classId ?? -1;
    if (cls === -1) continue;
    presentByClass[cls] = (presentByClass[cls] ?? 0) + 1;
  }

  const studentsAttendanceSummary = classes.map((c) => ({
    classId: c.id,
    className: c.name,
    totalStudents: c._count.students,
    presentToday: presentByClass[c.id] ?? 0,
    absentToday: Math.max(0, c._count.students - (presentByClass[c.id] ?? 0)),
  }));

  // Top attendants (last 30 days)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const recentAttendances = await db.attendance.findMany({
    where: { date: { gte: since }, present: true, studentId: { not: null } },
    include: { student: { select: { id: true, name: true, surname: true } } },
  });

  const attendCount: Record<string, { name: string; count: number }> = {};
  for (const a of recentAttendances) {
    const sid = a.studentId!;
    attendCount[sid] = attendCount[sid] ?? { name: `${a.student?.name ?? ""} ${a.student?.surname ?? ""}`, count: 0 };
    attendCount[sid].count += 1;
  }
  const topAttendants = Object.entries(attendCount)
    .map(([id, v]) => ({ studentId: id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Teachers attendance summary for today
  const todaysTeacherAttendances = await db.attendance.findMany({
    where: { date: { gte: startOfToday, lt: endOfToday }, teacherId: { not: null } },
    include: { teacher: { select: { id: true, name: true, surname: true } } },
  });
  const presentTeachers = new Set(todaysTeacherAttendances.filter((t) => t.present).map((t) => t.teacherId));

  const teachers = await db.teacher.findMany({ where: { isArchived: false }, include: { lessons: { include: { subject: true } }, classes: true } });

  const teachersAttendanceSummary = teachers.map((t) => ({
    teacherId: t.id,
    name: `${t.name} ${t.surname}`,
    supervisorClass: t.classes?.[0]?.name ?? null,
    subjects: Array.from(new Set(t.lessons.map((l) => l.subject.name))),
    presentToday: presentTeachers.has(t.id),
  }));

  return {
    studentsByClass,
    performanceTerms,
    activePerformanceTermKey,
    topStudentsByClass,
    subjectPerformanceSummary,
    topAttendants,
    studentsAttendanceSummary,
    teachersAttendanceSummary,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof loadAnalyticsData>>;
