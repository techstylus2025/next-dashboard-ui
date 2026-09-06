import prisma from "@/lib/prisma";

const StudentAttendanceCard = async ({ id }: { id: string }) => {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: { terms: { orderBy: { termNumber: "desc" } } },
  });

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (activeYear && activeYear.terms.length > 0) {
    const now = new Date();
    const currentTerm =
      activeYear.terms.find((term) => term.startDate <= now && now <= term.endDate) ??
      activeYear.terms[0];

    if (currentTerm) {
      startDate = currentTerm.startDate;
      endDate = currentTerm.endDate;
    }
  }

  const fallbackStartDate = startDate ?? new Date(new Date().getFullYear(), 0, 1);
  const fallbackEndDate = endDate ?? new Date(new Date().getFullYear(), 11, 31);

  const attendance = await prisma.attendance.findMany({
    where: {
      studentId: id,
      date: {
        gte: fallbackStartDate,
        lte: fallbackEndDate,
      },
    },
    orderBy: { date: "desc" },
  });

  const presentDays = attendance.filter((day) => day.present).length;
  const absentDays = attendance.filter((day) => !day.present).length;

  const totalRecords = attendance.length;

  const fallbackAttendance =
    totalRecords === 0
      ? await prisma.attendance.findMany({
          where: { studentId: id },
          orderBy: { date: "desc" },
        })
      : [];

  const finalPresentDays = totalRecords > 0 ? presentDays : fallbackAttendance.filter((day) => day.present).length;
  const finalAbsentDays = totalRecords > 0 ? absentDays : fallbackAttendance.filter((day) => !day.present).length;

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-center">
        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700">Present</p>
        <p className="text-sm font-semibold text-emerald-600">{finalPresentDays}</p>
      </div>
      <div className="rounded-md bg-rose-50 px-2 py-1.5 text-center border-l border-rose-100">
        <p className="text-[10px] font-medium uppercase tracking-wide text-rose-700">Absent</p>
        <p className="text-sm font-semibold text-rose-600">{finalAbsentDays}</p>
      </div>
    </div>
  );
};

export default StudentAttendanceCard;
