import prisma from "@/lib/prisma";

export async function loadAnalyticsData() {
  const db = prisma;

  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });

  const activeYear = await db.academicYear.findFirst({ where: { isActive: true } });
  const activeYearId = activeYear?.id ?? null;

  // Top students per class for the active year and latest term
  let topStudentsByClass: { classId: number; className: string; topStudents: { studentName: string; overallPercentage: number | null }[] }[] = [];
  let subjectPerformanceSummary: { subjectName: string; averageMarks: number; lowPerformanceCount: number; studentCount: number }[] = [];

  if (activeYearId) {
    const latestTerm = await db.academicTerm.findFirst({ where: { academicYearId: activeYearId }, orderBy: { termNumber: "desc" } });
    if (latestTerm) {
      const reports = await db.termlyReport.findMany({
        where: { academicYearId: activeYearId, termNumber: latestTerm.termNumber },
        include: { student: { select: { name: true, surname: true } }, class: { select: { id: true, name: true } } },
        orderBy: [{ classId: "asc" }, { overallPercentage: "desc" }],
      });

      const classMap = new Map<number, { classId: number; className: string; topStudents: { studentName: string; overallPercentage: number | null }[] }>();
      for (const r of reports) {
        const cls = r.classId;
        const entry = classMap.get(cls) ?? { classId: cls, className: r.class.name, topStudents: [] };
        if (entry.topStudents.length < 5) {
          entry.topStudents.push({ studentName: `${r.student.name} ${r.student.surname}`, overallPercentage: r.overallPercentage });
        }
        classMap.set(cls, entry);
      }
      topStudentsByClass = Array.from(classMap.values());

      const subjectLines = await db.termlyReportSubjectLine.findMany({
        where: {
          termlyReport: { academicYearId: activeYearId, termNumber: latestTerm.termNumber },
        },
        include: { subject: true },
      });

      const subjectStats = new Map<string, { totalMarks: number; count: number; lowPerformanceCount: number }>();
      for (const line of subjectLines) {
        const name = line.subject.name;
        const stats = subjectStats.get(name) ?? { totalMarks: 0, count: 0, lowPerformanceCount: 0 };
        stats.totalMarks += line.totalMarks;
        stats.count += 1;
        if (line.totalMarks < 40) {
          stats.lowPerformanceCount += 1;
        }
        subjectStats.set(name, stats);
      }

      subjectPerformanceSummary = Array.from(subjectStats.entries()).map(([subjectName, stats]) => ({
        subjectName,
        averageMarks: stats.count > 0 ? stats.totalMarks / stats.count : 0,
        lowPerformanceCount: stats.lowPerformanceCount,
        studentCount: stats.count,
      })).sort((a, b) => b.averageMarks - a.averageMarks);
    }
  }

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

  const teachers = await db.teacher.findMany({ include: { lessons: { include: { subject: true } }, classes: true } });

  const teachersAttendanceSummary = teachers.map((t) => ({
    teacherId: t.id,
    name: `${t.name} ${t.surname}`,
    supervisorClass: t.classes?.[0]?.name ?? null,
    subjects: Array.from(new Set(t.lessons.map((l) => l.subject.name))),
    presentToday: presentTeachers.has(t.id),
  }));

  return {
    studentsByClass,
    topStudentsByClass,
    subjectPerformanceSummary,
    topAttendants,
    studentsAttendanceSummary,
    teachersAttendanceSummary,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof loadAnalyticsData>>;


export type AnalyticsData = Awaited<ReturnType<typeof loadAnalyticsData>>;
