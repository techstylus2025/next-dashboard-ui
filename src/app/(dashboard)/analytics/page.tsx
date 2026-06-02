import { loadAnalyticsData } from '@/lib/analytics';
import ChartsSummary from '@/components/analytics/ChartsSummary';
import AnalyticsTabs from '@/components/analytics/AnalyticsTabs';

export default async function AnalyticsPage() {
  const data = await loadAnalyticsData();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of academic performance and attendance.</p>
      </div>

      <div className="mb-6">
        <ChartsSummary
          studentsByClass={data.studentsByClass.map((c) => ({ className: c.className, studentCount: c.studentCount }))}
          topAttendants={data.topAttendants.map((t) => ({ name: t.name, count: t.count }))}
          topStudentsByClass={data.topStudentsByClass}
          subjectPerformanceSummary={data.subjectPerformanceSummary}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Attendance</h2>
        <AnalyticsTabs
          studentsRows={data.studentsAttendanceSummary.map((r) => ({ className: r.className, totalStudents: r.totalStudents, presentToday: r.presentToday, absentToday: r.absentToday }))}
          teachersRows={data.teachersAttendanceSummary.map((t) => ({ name: t.name, supervisorClass: t.supervisorClass, subjects: t.subjects, presentToday: t.presentToday }))}
        />
      </div>
    </div>
  );
}
