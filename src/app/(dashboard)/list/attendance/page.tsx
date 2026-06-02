import AttendanceManager, {
  type AttendancePerson,
  type AttendanceRecord,
} from "@/components/AttendanceManager";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

const AttendancePage = async ({
  searchParams,
}: {
  searchParams?: { date?: string | string[] };
}) => {
  const rawDate = typeof searchParams?.date === "string" ? searchParams.date : undefined;
  const selectedDate = rawDate ? new Date(rawDate) : new Date();
  const safeDate = Number.isNaN(selectedDate.getTime())
    ? new Date()
    : selectedDate;
  const selectedDateString = safeDate.toISOString().slice(0, 10);
  const dateStart = new Date(selectedDateString);
  const dateEnd = new Date(dateStart);
  dateEnd.setDate(dateEnd.getDate() + 1);

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string) ?? "parent";
  const currentUserId = user?.id ?? "";

  const attendanceData = {
    records: [] as AttendanceRecord[],
    students: [] as AttendancePerson[],
    teachers: [] as AttendancePerson[],
  };

  if (role === "admin") {
    const [students, teachers, records] = await prisma.$transaction([
      prisma.student.findMany({
        include: { class: true },
        orderBy: { name: "asc" },
      }),
      prisma.teacher.findMany({
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
  } else {
    const students = await prisma.student.findMany({
      where: { parentId: currentUserId },
      include: { class: true },
      orderBy: { name: "asc" },
    });
    const studentIds = students.map((student) => student.id);
    const records = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
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
