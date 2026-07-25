import prisma from "@/lib/prisma";

const StudentAttendanceCard = async ({ id }: { id: string }) => {
  // Get the active academic year and current term
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: {
      terms: {
        orderBy: { termNumber: "desc" },
      },
    },
  });

  // Determine the current term date range (use latest term in active year)
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (activeYear && activeYear.terms.length > 0) {
    // Find the current or latest term
    const now = new Date();
    let currentTerm = activeYear.terms.find(
      (t) => t.startDate <= now && now <= t.endDate
    );
    
    // If no current term, use the latest one
    if (!currentTerm) {
      currentTerm = activeYear.terms[0];
    }

    if (currentTerm) {
      startDate = currentTerm.startDate;
      endDate = currentTerm.endDate;
    }
  }

  // If no active year or term found, fall back to calendar year
  if (!startDate || !endDate) {
    const now = new Date();
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  }

  // Get attendance for the term
  const attendance = await prisma.attendance.findMany({
    where: {
      studentId: id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const presentDays = attendance.filter((day) => day.present).length;
  const absentDays = attendance.filter((day) => !day.present).length;

  return (
    <>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-500 font-medium">Present</p>
          <p className="text-lg font-semibold text-emerald-600">{presentDays}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Absent</p>
          <p className="text-lg font-semibold text-rose-600">{absentDays}</p>
        </div>
      </div>
    </>
  );
};

export default StudentAttendanceCard;
