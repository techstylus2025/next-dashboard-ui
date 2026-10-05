import { loadAnalyticsData } from '@/lib/analytics';
import ChartsSummary from '@/components/analytics/ChartsSummary';
import AnalyticsTabs from '@/components/analytics/AnalyticsTabs';
import { ChartColumn, BookOpen, School, Users } from 'lucide-react';

export default async function AnalyticsPage() {
  const data = await loadAnalyticsData();
  const totalStudents = data.studentsAttendanceSummary.reduce(
    (total, row) => total + row.totalStudents,
    0
  );
  const presentStudents = data.studentsAttendanceSummary.reduce(
    (total, row) => total + row.presentToday,
    0
  );
  const studentAttendanceRate = totalStudents
    ? Math.round((presentStudents / totalStudents) * 100)
    : 0;
  const activeTermSubjectStats = data.subjectPerformanceSummary.filter(
    (subject) => subject.termKey === data.activePerformanceTermKey
  );
  const subjectScoreCount = activeTermSubjectStats.reduce(
    (total, subject) => total + subject.studentCount,
    0
  );
  const averageSubjectScore = subjectScoreCount
    ? activeTermSubjectStats.reduce(
        (total, subject) => total + subject.averageMarks * subject.studentCount,
        0
      ) / subjectScoreCount
    : null;
  const presentTeachers = data.teachersAttendanceSummary.filter(
    (teacher) => teacher.presentToday
  ).length;
  const teacherAttendanceRate = data.teachersAttendanceSummary.length
    ? Math.round((presentTeachers / data.teachersAttendanceSummary.length) * 100)
    : 0;
  const metrics = [
    {
      label: 'Enrolled students',
      value: totalStudents.toLocaleString(),
      detail: 'Across all classes',
      icon: Users,
      color: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Classes',
      value: data.studentsByClass.length.toLocaleString(),
      detail: 'Currently reporting',
      icon: School,
      color: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Student attendance',
      value: `${studentAttendanceRate}%`,
      detail: `${presentStudents.toLocaleString()} present today`,
      icon: ChartColumn,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Average subject score',
      value: averageSubjectScore === null ? '—' : `${averageSubjectScore.toFixed(1)}%`,
      detail: 'Latest available term',
      icon: BookOpen,
      color: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <main className="min-h-full space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
              School overview
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Analytics dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              A clear view of enrolment, attendance, and academic performance across your school.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Today&apos;s school snapshot
          </div>
        </div>
      </header>

      <section aria-label="School metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon, color }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                  {value}
                </p>
              </div>
              <span className={`rounded-xl p-3 ${color}`}>
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Teacher attendance</h2>
              <p className="mt-1 text-sm text-slate-500">Staff attendance recorded today</p>
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {teacherAttendanceRate}<span className="text-base text-slate-400">%</span>
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-all"
              style={{ width: `${teacherAttendanceRate}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {presentTeachers} of {data.teachersAttendanceSummary.length} active teachers marked present
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Student attendance</h2>
              <p className="mt-1 text-sm text-slate-500">Attendance recorded across all classes today</p>
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {studentAttendanceRate}<span className="text-base text-slate-400">%</span>
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
              style={{ width: `${studentAttendanceRate}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {presentStudents.toLocaleString()} present out of {totalStudents.toLocaleString()} students
          </p>
        </article>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Performance insights
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Academic overview</h2>
        </div>
        <ChartsSummary
          studentsByClass={data.studentsByClass.map((c) => ({ className: c.className, studentCount: c.studentCount }))}
          topAttendants={data.topAttendants.map((t) => ({ name: t.name, count: t.count }))}
          topStudentsByClass={data.topStudentsByClass}
          subjectPerformanceSummary={data.subjectPerformanceSummary}
          performanceTerms={data.performanceTerms}
          activePerformanceTermKey={data.activePerformanceTermKey}
          classes={data.studentsByClass.map((c) => ({ id: c.classId, name: c.className }))}
        />
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Daily operations
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Attendance detail</h2>
        </div>
        <AnalyticsTabs
          studentsRows={data.studentsAttendanceSummary.map((r) => ({ className: r.className, totalStudents: r.totalStudents, presentToday: r.presentToday, absentToday: r.absentToday }))}
          teachersRows={data.teachersAttendanceSummary.map((t) => ({ name: t.name, supervisorClass: t.supervisorClass, subjects: t.subjects, presentToday: t.presentToday }))}
        />
      </section>
    </main>
  );
}
