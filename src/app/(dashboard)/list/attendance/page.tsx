import AttendanceManager, {
  type AttendancePerson,
  type AttendanceRecord,
} from "@/components/AttendanceManager";
import ClassAttendanceBoard from "@/components/attendance/ClassAttendanceBoard";
import ParentAttendanceRecords from "@/components/attendance/ParentAttendanceRecords";
import { getCurrentAuthContext } from "@/lib/auth";
import prisma from "@/lib/prisma";

const AttendancePage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string | string[] }> | { date?: string | string[] };
}) => {
  const params = searchParams ? await searchParams : {};
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const selectedDate = rawDate ? new Date(rawDate) : new Date();
  const safeDate = Number.isNaN(selectedDate.getTime())
    ? new Date()
    : selectedDate;
  const selectedDateString = safeDate.toISOString().slice(0, 10);
  const dateStart = new Date(selectedDateString);
  const dateEnd = new Date(dateStart);
  dateEnd.setDate(dateEnd.getDate() + 1);

  const authContext = await getCurrentAuthContext();
  const role = authContext.role ?? "guest";
  const currentUserId = authContext.userId;

  if ((role === "admin" || role === "teacher") && currentUserId) {
    const classes = await prisma.class.findMany({
      where: role === "admin" ? {} : { supervisorId: currentUserId },
      select: {
        id: true,
        name: true,
        students: {
          where: { isArchived: false },
          select: {
            id: true,
            name: true,
            surname: true,
            attendances: {
              where: {
                isArchived: false,
                teacherId: null,
                date: { gte: dateStart, lt: dateEnd },
              },
              select: { id: true, present: true },
              orderBy: { date: "desc" },
              take: 1,
            },
          },
          orderBy: [{ surname: "asc" }, { name: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });
    const teachers = role === "admin"
      ? await prisma.teacher.findMany({
          where: { isArchived: false },
          select: {
            id: true,
            name: true,
            surname: true,
            attendances: {
              where: {
                isArchived: false,
                studentId: null,
                date: { gte: dateStart, lt: dateEnd },
              },
              select: { id: true, present: true },
              orderBy: { date: "desc" },
              take: 1,
            },
          },
          orderBy: [{ surname: "asc" }, { name: "asc" }],
        })
      : [];

    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6">
        <ClassAttendanceBoard
          role={role}
          selectedDate={selectedDateString}
          classes={classes}
          teachers={teachers}
        />
      </div>
    );
  }

  const attendanceData = {
    records: [] as AttendanceRecord[],
    students: [] as AttendancePerson[],
    teachers: [] as AttendancePerson[],
  };

  if (role === "admin") {
    const [students, teachers, records] = await Promise.all([
      prisma.student.findMany({
        where: { isArchived: false },
        include: { class: true },
        orderBy: { name: "asc" },
      }),
      prisma.teacher.findMany({
        where: { isArchived: false },
        orderBy: { name: "asc" },
      }),
      prisma.attendance.findMany({
        where: {
          date: {
            gte: dateStart,
            lt: dateEnd,
          },
        },
        orderBy: { date: "desc" },
        include: {
          student: {
            select: { name: true, surname: true, class: { select: { name: true } } },
          },
          teacher: { select: { name: true, surname: true } },
        },
      }),
    ]);

    attendanceData.students = students.map((student) => ({
      id: student.id,
      name: student.name,
      surname: student.surname,
      classId: student.classId,
      className: student.class.name,
    }));
    attendanceData.teachers = teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      surname: teacher.surname,
    }));
    attendanceData.records = records.map((item) => ({
      id: item.id,
      date: item.date.toISOString().slice(0, 10),
      present: item.present,
      recordType: item.teacherId ? "teacher" : "student",
      personName: item.teacherId
        ? `${item.teacher?.name} ${item.teacher?.surname}`
        : `${item.student?.name} ${item.student?.surname}`,
      className: item.student?.class?.name ?? (item.teacher ? "Staff" : ""),
    }));
  } else if (role === "teacher") {
    const supervisorClasses = await prisma.class.findMany({
      where: { supervisorId: currentUserId },
      include: { students: true },
    });

    const studentOptions = supervisorClasses.flatMap((klass) =>
      klass.students.map((student) => ({
        id: student.id,
        name: student.name,
        surname: student.surname,
        classId: student.classId,
        className: klass.name,
      }))
    );

    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: dateStart,
          lt: dateEnd,
        },
        OR: [
          { teacherId: currentUserId },
          { student: { class: { supervisorId: currentUserId } } },
        ],
      },
      orderBy: { date: "desc" },
      include: {
        student: {
          select: { name: true, surname: true, class: { select: { name: true } } },
        },
        teacher: { select: { name: true, surname: true } },
      },
    });

    attendanceData.students = studentOptions;
    attendanceData.records = records.map((item) => ({
      id: item.id,
      date: item.date.toISOString().slice(0, 10),
      present: item.present,
      recordType: item.teacherId ? "teacher" : "student",
      personName: item.teacherId
        ? `${item.teacher?.name} ${item.teacher?.surname}`
        : `${item.student?.name} ${item.student?.surname}`,
      className: item.student?.class?.name ?? (item.teacher ? "Staff" : ""),
    }));
  } else if (role === "student") {
    const records = await prisma.attendance.findMany({
      where: {
        studentId: currentUserId,
        teacherId: null,
        date: {
          gte: dateStart,
          lt: dateEnd,
        },
      },
      orderBy: { date: "desc" },
      include: {
        student: {
          select: { name: true, surname: true, class: { select: { name: true } } },
        },
      },
    });

    attendanceData.records = records.map((item) => ({
      id: item.id,
      date: item.date.toISOString().slice(0, 10),
      present: item.present,
      recordType: "student",
      personName: `${item.student?.name} ${item.student?.surname}`,
      className: item.student?.class?.name ?? "",
    }));
  } else if (role === "parent") {
    const students = await prisma.student.findMany({
      where: { parentId: currentUserId ?? "", isArchived: false },
      include: { class: true },
      orderBy: { name: "asc" },
    });
    const studentIds = students.map((student) => student.id);
    const records = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        teacherId: null,
        isArchived: false,
        student: {
          parentId: currentUserId ?? "",
          isArchived: false,
        },
      },
      orderBy: { date: "desc" },
      include: {
        student: {
          select: { id: true, name: true, surname: true, class: { select: { name: true } } },
        },
      },
    });

    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6">
        <ParentAttendanceRecords
          students={students.map((student) => ({
            id: student.id,
            name: `${student.name} ${student.surname}`,
            className: student.class.name,
          }))}
          records={records.flatMap((item) => item.student ? [{
            id: item.id,
            studentId: item.student.id,
            studentName: `${item.student.name} ${item.student.surname}`,
            className: item.student.class.name,
            date: item.date.toISOString().slice(0, 10),
            present: item.present,
          }] : [])}
        />
      </div>
    );
  } else {
    // Fallback: no data for other roles
  }

  return (
    <div className="p-4 space-y-6">
      <AttendanceManager
        role={role}
        selectedDate={selectedDateString}
        records={attendanceData.records}
        students={attendanceData.students}
        teachers={attendanceData.teachers}
      />
    </div>
  );
};

export default AttendancePage;
