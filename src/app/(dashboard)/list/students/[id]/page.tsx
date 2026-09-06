import Announcements from "@/components/Announcements";
import Avatar from "@/components/Avatar";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Class, Student } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const SingleStudentPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const student:
    | (Student & {
        class: Class & { _count: { lessons: number } };
        parent: {
          name: string;
          surname: string;
          email: string | null;
          phone: string;
          occupation: string | null;
        };
      })
    | null = await prisma.student.findUnique({
    where: { id },
    include: {
      class: { include: { _count: { select: { lessons: true } } } },
      parent: {
        select: {
          name: true,
          surname: true,
          email: true,
          phone: true,
          occupation: true,
        },
      },
    },
  });

  if (!student) {
    return notFound();
  }

  const feeAssignments = await prisma.studentFeeAssignment.findMany({
    where: { studentId: id },
    include: {
      payments: true,
      feeSchedule: true,
    },
  });

  const feeSummary = feeAssignments.reduce(
    (summary, assignment) => {
      const paid = assignment.payments.reduce(
        (sum, payment) => sum + Number(payment.amountCedis),
        0
      );
      const total = Number(assignment.totalBillCedis);
      return {
        totalBill: summary.totalBill + total,
        totalPaid: summary.totalPaid + paid,
        totalOutstanding: summary.totalOutstanding + Math.max(0, total - paid),
        assignments: summary.assignments + 1,
        fullyPaidAssignments:
          summary.fullyPaidAssignments + (paid >= total ? 1 : 0),
      };
    },
    {
      totalBill: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      assignments: 0,
      fullyPaidAssignments: 0,
    }
  );

  const reports = await prisma.termlyReport.findMany({
    where: { studentId: id },
    include: {
      class: { select: { name: true } },
      academicYear: { select: { label: true, createdAt: true } },
      subjectLines: {
        include: { subject: { select: { name: true } } },
        orderBy: { subject: { name: "asc" } },
      },
    },
    orderBy: [
      { academicYear: { createdAt: "desc" } },
      { termNumber: "desc" },
    ],
  });

  const latestReport = reports[0] ?? null;

  function formatMoney(value: number) {
    return `₵${value.toFixed(2)}`;
  }

  function formatTerm(termNumber: number) {
    return `Term ${termNumber}`;
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-4 px-4 rounded-md flex-1 lg:flex-[1.45] xl:min-w-[440px]">
            <div className="flex items-start gap-3 sm:gap-4 lg:flex-row">
              <div className="relative shrink-0">
                <Avatar
                  src={student.img ?? undefined}
                  name={`${student.name} ${student.surname}`}
                  alt={`${student.name} ${student.surname}`}
                  size={144}
                  className="h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36"
                />
                {role === "admin" && (
                  <div className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2">
                    <FormContainer table="student" type="update" data={student} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2">
                  <h1 className="text-base font-semibold text-slate-900 sm:text-lg lg:text-xl">
                    {student.name + " " + student.surname}
                  </h1>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 sm:text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-white/20 px-2 py-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21.8C7.69.295 8 0 8 0q.164.544.371 1.038c.812 1.946 2.073 3.35 3.197 4.6C12.878 7.096 14 8.345 14 10a6 6 0 0 1-12 0C2 6.668 5.58 2.517 7.21.8m.413 1.021A31 31 0 0 0 5.794 3.99c-.726.95-1.436 2.008-1.96 3.07C3.304 8.133 3 9.138 3 10a5 5 0 0 0 10 0c0-1.201-.796-2.157-2.181-3.7l-.03-.032C9.75 5.11 8.5 3.72 7.623 1.82z"/>
                        <path fillRule="evenodd" d="M4.553 7.776c.82-1.641 1.717-2.753 2.093-3.13l.708.708c-.29.29-1.128 1.311-1.907 2.87z"/>
                      </svg>
                    </div>
                    <span className="min-w-0 break-words">{student.bloodType}</span>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-white/20 px-2 py-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                        <path d="M11 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                        <path d="M2.5 4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5z"/>
                      </svg>
                    </div>
                    <span className="min-w-0 break-words">
                      {new Intl.DateTimeFormat("en-GB").format(student.birthday)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-white/20 px-2 py-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/>
                      </svg>
                    </div>
                    <span className="min-w-0 break-words">{student.class.name}</span>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-white/20 px-2 py-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                        <path d="M1 2.75A1.75 1.75 0 0 1 2.75 1h10.5A1.75 1.75 0 0 1 15 2.75v8.5A1.75 1.75 0 0 1 13.25 13H8.5l-2.4 2.4A.5.5 0 0 1 5.5 15v-2H2.75A1.75 1.75 0 0 1 1 11.25v-8.5Zm2.25-.25a.75.75 0 0 0-.75.75v7.5c0 .414.336.75.75.75h2.5v1.5l1.74-1.74a.5.5 0 0 1 .354-.146H13.25a.75.75 0 0 0 .75-.75v-7.5a.75.75 0 0 0-.75-.75H3.25Z"/>
                      </svg>
                    </div>
                    <span className="min-w-0 break-words">
                      {new Intl.DateTimeFormat("en-GB").format(student.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 border-t border-white/60 pt-3 text-[11px] text-slate-700 sm:text-xs">
                  <p className="font-semibold text-slate-900">Parent</p>
                  <p>{student.parent.name} {student.parent.surname}</p>
                  <p>{student.parent.occupation ?? "No occupation set"}</p>
                  <p className="mt-1">{student.parent.phone}</p>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 space-y-2 lg:max-w-[420px] lg:ml-auto xl:max-w-[480px]">
            <div className="bg-white p-3 rounded-md shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Account & emergency</h3>
              <div className="mt-3 space-y-2 text-[10px] text-slate-600 sm:text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-500">Username</span>
                  <span className="truncate text-right font-semibold text-slate-700">{student.username || "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-500">Emergency contact</span>
                  <span className="truncate text-right font-semibold text-slate-700">{student.emergencyContactPerson || "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-500">Emergency number</span>
                  <span className="truncate text-right font-semibold text-slate-700">{student.emergencyContactNumber || "-"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 md:gap-2 lg:gap-2">
              <div className="bg-white p-1.5 rounded-md flex items-center gap-1.5 md:gap-2 w-full shadow-sm border border-slate-200 min-w-0">
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 text-white shadow-lg flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true">
                      <path d="M8.5 10c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1"/>
                      <path d="M10.828.122A.5.5 0 0 1 11 .5V1h.5A1.5 1.5 0 0 1 13 2.5V15h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V1.5a.5.5 0 0 1 .43-.495l7-1a.5.5 0 0 1 .398.117M11.5 2H11v13h1V2.5a.5.5 0 0 0-.5-.5M4 1.934V15h6V1.077z"/>
                    </svg>
                  </div>
                <div className="min-w-0 overflow-hidden">
                  <h1 className="text-[10px] sm:text-[10px] md:text-xs font-semibold truncate leading-tight">
                    {student.department ? `${student.department.charAt(0)}${student.department.slice(1).toLowerCase()}` : "-"}
                  </h1>
                  <span className="block text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 leading-tight">Department</span>
                </div>
              </div>
              <div className="bg-white p-1.5 rounded-md flex items-center gap-1.5 md:gap-2 w-full shadow-sm border border-slate-200 min-w-0">
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true">
                      <path d="M5 0h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2 2 2 0 0 1-2 2H3a2 2 0 0 1-2-2h1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1H1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1H3a2 2 0 0 1 2-2"/>
                      <path d="M1 6v-.5a.5.5 0 0 1 1 0V6h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V9h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 2.5v.5H.5a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1H2v-.5a.5.5 0 0 0-1 0"/>
                    </svg>
                  </div>
                <div className="min-w-0 overflow-hidden">
                  <h1 className="text-[10px] sm:text-[10px] md:text-xs font-semibold leading-tight">
                    {student.class._count.lessons}
                  </h1>
                  <span className="block text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 leading-tight">Lessons</span>
                </div>
              </div>
              <div className="bg-white p-1.5 rounded-md flex items-center gap-1.5 md:gap-2 w-full shadow-sm border border-slate-200 min-w-0">
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 text-white shadow-lg flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true">
                      <path d="M8.5 10c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1"/>
                      <path d="M10.828.122A.5.5 0 0 1 11 .5V1h.5A1.5 1.5 0 0 1 13 2.5V15h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V1.5a.5.5 0 0 1 .43-.495l7-1a.5.5 0 0 1 .398.117M11.5 2H11v13h1V2.5a.5.5 0 0 0-.5-.5M4 1.934V15h6V1.077z"/>
                    </svg>
                  </div>
                <div className="min-w-0 overflow-hidden">
                  <h1 className="text-[10px] sm:text-[10px] md:text-xs font-semibold truncate leading-tight">{student.class.name}</h1>
                  <span className="block text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 leading-tight">Class</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-md shadow-sm border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                    <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514"/>
                    <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                    <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Attendance</p>
                  <Suspense fallback={<p className="text-xs text-gray-500">loading...</p>}>
                    <StudentAttendanceCard id={student.id} />
                  </Suspense>
                </div>
              </div>
            </div>

            
          </div>
        </div>
        {/* BOTTOM */}
        <div className="mt-4 w-full max-w-[860px] xl:max-w-[980px]">
          <div className="mb-3 flex items-center justify-between gap-3">
            {/* <div>
              <h1 className="text-xl font-semibold">Student&apos;s Schedule</h1>
              <p className="text-sm text-slate-500">This student&apos;s class timetable and latest attendance snapshot.</p>
            </div> */}
            {latestReport ? (
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                Latest report: {latestReport.academicYear.label} • {formatTerm(latestReport.termNumber)}
              </div>
            ) : null}
          </div>
          <div className="w-full">
            <BigCalendarContainer type="classId" id={student.class.id} />
          </div>
        </div>

        <div className="mt-4 w-full max-w-[860px] xl:max-w-[980px] bg-white rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Subject performance</h2>
              <p className="text-sm text-slate-500">Latest term grades and subject totals for this student.</p>
            </div>
            {latestReport ? (
              <span className="text-sm text-slate-500">{latestReport.class.name}</span>
            ) : null}
          </div>
          {latestReport ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Overall percentage</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {latestReport.overallPercentage?.toFixed(1) ?? "-"}%
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Overall grade</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {latestReport.overallGrade ?? "-"}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Subject</th>
                      <th className="px-3 py-2 text-right font-semibold">Class score</th>
                      <th className="px-3 py-2 text-right font-semibold">Exam score</th>
                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                      <th className="px-3 py-2 text-right font-semibold">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {latestReport.subjectLines.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-3 text-slate-700">{line.subject.name}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{line.classScore}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{line.examScore}</td>
                        <td className="px-3 py-3 text-right text-slate-600">{line.totalMarks}</td>
                        <td className="px-3 py-3 text-right text-slate-700">{line.grade ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">No termly report available for this student yet.</p>
          )}
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/lessons?classId=${student.class.id}`}
            >
              Student&apos;s Lessons
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/list/teachers?classId=${student.class.id}`}
            >
              Student&apos;s Teachers
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50"
              href={`/list/exams?classId=${student.class.id}`}
            >
              Student&apos;s Exams
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/list/assignments?classId=${student.class.id}`}
            >
              Student&apos;s Assignments
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/list/results?studentId=${student.id}`}
            >
              Student&apos;s Results
            </Link>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Fee summary</h2>
              <p className="text-sm text-slate-500">Current billing status for the student.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-500">
              {feeSummary.assignments} bills
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Total bill</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(feeSummary.totalBill)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">Paid</p>
                <p className="mt-2 text-xl font-semibold text-emerald-800">{formatMoney(feeSummary.totalPaid)}</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose-600">Outstanding</p>
                <p className="mt-2 text-xl font-semibold text-rose-800">{formatMoney(feeSummary.totalOutstanding)}</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            {feeSummary.fullyPaidAssignments} of {feeSummary.assignments} assignments fully paid.
          </p>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Academic reports</h2>
              <p className="text-sm text-slate-500">Recent termly reports filed for this student.</p>
            </div>
            <Link
              className="text-sm text-slate-600 hover:text-slate-900"
              href={`/list/results?studentId=${student.id}`}
            >
              View all
            </Link>
          </div>
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.slice(0, 3).map((report) => (
                <div key={report.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{report.academicYear.label} • {formatTerm(report.termNumber)}</p>
                  <p className="text-sm text-slate-500">{report.class.name} — {report.overallGrade ?? "-"} / {report.overallPercentage?.toFixed(1) ?? "-"}%</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No reports generated for this student.</p>
          )}
        </div>
        <Performance
          report={
            latestReport
              ? {
                  overallPercentage: latestReport.overallPercentage,
                  overallGrade: latestReport.overallGrade,
                  resultStatus: latestReport.resultStatus,
                  academicYearLabel: latestReport.academicYear.label,
                  termNumber: latestReport.termNumber,
                  className: latestReport.class.name,
                }
              : null
          }
        />
        {/* <Announcements /> */}
      </div>
    </div>
  );
};

export default SingleStudentPage;
