import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Assignment, Class, Prisma, Subject, Teacher } from "@prisma/client";
import Image from "next/image";
import AssignmentVisibilityToggle from "@/components/AssignmentVisibilityToggle";
import AssignmentViewModal from "@/components/assignments/AssignmentViewModal";
import { auth } from "@clerk/nextjs/server";

type AssignmentList = Assignment & {
  lesson: {
    subject: Subject;
    class: Class;
    teacher: Teacher;
  };
};

const AssignmentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;
  
  
  const columns = [
    {
      header: "Subject Name",
      accessor: "name",
    },
    {
      header: "Class",
      accessor: "class",
      className: "hidden md:table-cell",
    },
    {
      header: "Teacher",
      accessor: "teacher",
      className: "hidden md:table-cell",
    },
    {
      header: "Due Date",
      accessor: "dueDate",
      className: "hidden md:table-cell",
    },
    ...(role === "admin" || role === "teacher"
      ? [
          {
            header: "Visible",
            accessor: "visible",
            className: "hidden md:table-cell",
          },
          {
            header: "Actions",
            accessor: "action",
          },
        ]
      : []),
  ];
  
  const renderRow = (item: AssignmentList) => {
    const subjectName = item.lesson?.subject?.name ?? "Unknown subject";
    const className = item.lesson?.class?.name ?? "Unknown class";
    const teacherName = item.lesson?.teacher
      ? `${item.lesson.teacher.name ?? ""} ${item.lesson.teacher.surname ?? ""}`.trim() || "Unknown teacher"
      : "Unknown teacher";

    return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex flex-col gap-2 p-4">
        <div className="font-medium">{subjectName}</div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 md:hidden">
          <span>{className}</span>
          <span>•</span>
          <span>{new Intl.DateTimeFormat("en-US").format(item.dueDate)}</span>
          <span>•</span>
          <span>{teacherName}</span>
        </div>
        {item.questions && (
          <div className="text-xs text-slate-500 truncate max-w-full">{item.questions.slice(0, 120)}</div>
        )}
        {(role === "admin" || role === "teacher") && (
          <div className="flex flex-wrap gap-2 mt-2 md:hidden">
            <AssignmentVisibilityToggle id={item.id} isArchived={item.isArchived} />
          </div>
        )}
      </td>
      <td className="hidden md:table-cell">{className}</td>
      <td className="hidden md:table-cell">{teacherName}</td>
      <td className="hidden md:table-cell">
        {new Intl.DateTimeFormat("en-US").format(item.dueDate)}
      </td>
      <td className="hidden md:table-cell">
        {(role === "admin" || role === "teacher") && (
          <div className="flex items-center gap-2">
            <AssignmentVisibilityToggle id={item.id} isArchived={item.isArchived} />
          </div>
        )}
      </td>
      <td>
        <div className="flex items-center gap-1 whitespace-nowrap">
          <AssignmentViewModal assignment={item} />
          {(role === "admin" || role === "teacher") && (
            <>
              <FormModal table="assignment" type="update" data={item} />
              <FormModal table="assignment" type="delete" id={item.id} />
            </>
          )}
        </div>
      </td>
    </tr>
    );
  };

  const { page, ...queryParams } = await searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.AssignmentWhereInput = {};

  query.lesson = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lesson.classId = parseInt(value);
            break;
          case "teacherId":
            query.lesson.teacherId = value;
            break;
          case "search":
            query.lesson.subject = {
              name: { contains: value, mode: "insensitive" },
            };
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS

  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.lesson.teacherId = currentUserId!;
      break;
    case "student":
      query.lesson.class = {
        students: {
          some: {
            id: currentUserId!,
          },
        },
      };
      break;
    case "parent":
      query.lesson.class = {
        students: {
          some: {
            parentId: currentUserId!,
          },
        },
      };
      break;
    default:
      break;
  }

  // allow grouping via ?groupBy=class|subject|teacher|term|year
  const groupBy = (queryParams.groupBy as string) || "class";

  let data: AssignmentList[] = [];
  let totalCount = 0;

  if (groupBy) {
    // fetch all matching assignments to compute groupings and counts
    const assignments = await prisma.assignment.findMany({
      where: query,
      include: {
        lesson: {
          select: {
            subject: { select: { id: true, name: true } },
            teacher: { select: { id: true, name: true, surname: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dueDate: "desc" },
    });
    // cast to AssignmentList for rendering convenience
    data = assignments as AssignmentList[];
    totalCount = data.length;
  } else {
    const [pagedData, cnt] = await Promise.all([
      prisma.assignment.findMany({
        where: query,
        include: {
          lesson: {
            select: {
              subject: { select: { name: true } },
              teacher: { select: { name: true, surname: true } },
              class: { select: { name: true } },
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.assignment.count({ where: query }),
    ]);
    data = pagedData as AssignmentList[];
    totalCount = cnt;
  }

  // load academic years when grouping by term/year
  let academicYears: (any)[] = [];
  if (groupBy === "term" || groupBy === "year") {
    academicYears = await prisma.academicYear.findMany({
      include: { terms: { orderBy: { termNumber: "asc" } } },
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
    });
  }

  const getTermForDate = (date: Date, year: any) => {
    const term = year.terms.find((t: any) => date >= t.startDate && date <= t.endDate);
    return term?.termNumber ?? null;
  };
  // helper to render subject counts as badges
  const renderSubjectCounts = (assigns: AssignmentList[]) => {
    const map = new Map<string, number>();
    assigns.forEach((a) => {
      const name = a.lesson?.subject?.name ?? "Unknown subject";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return (
      <div className="flex gap-2 flex-wrap">
        {Array.from(map.entries()).map(([name, cnt]) => (
          <div key={name} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            {name}: {cnt}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          All Assignments
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <form method="get" className="flex items-center gap-2">
            <label className="text-sm">Group by</label>
            <select name="groupBy" defaultValue={groupBy} className="p-2 rounded-md ring-1 ring-slate-200">
              <option value="class">Class</option>
              <option value="subject">Subject</option>
              <option value="teacher">Teacher</option>
              <option value="term">Term</option>
              <option value="year">Academic Year</option>
            </select>
            <button type="submit" className="btn-primary">Apply</button>
          </form>
          <div className="flex items-center gap-4 self-end">
            {(role === "admin" || role === "teacher") && (
              <FormModal table="assignment" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      {groupBy === "class" && (
        <div className="space-y-6">
          {Array.from(
            data.reduce((m, a) => {
              const key = a.lesson?.class?.name ?? "Unknown class";
              if (!m.has(key)) m.set(key, [] as AssignmentList[]);
              m.get(key)!.push(a);
              return m;
            }, new Map<string, AssignmentList[]>()).entries()
          ).map(([className, assigns]) => (
            <details key={className} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 hover:bg-slate-50">
                <div>
                  <h2 className="text-lg font-semibold">Class: {className}</h2>
                  <div className="text-sm text-slate-600">Total: {assigns.length}</div>
                </div>
                <div className="text-sm text-slate-500">Click to toggle</div>
              </summary>
              <div className="border-t border-slate-200 p-4 pt-3">
                {renderSubjectCounts(assigns)}
                <div className="mt-3">
                  <Table columns={columns} renderRow={renderRow} data={assigns} />
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      {groupBy === "subject" && (
        <div className="space-y-6">
          {Array.from(
            data.reduce((m, a) => {
              const key = a.lesson?.subject?.name ?? "Unknown subject";
              if (!m.has(key)) m.set(key, [] as AssignmentList[]);
              m.get(key)!.push(a);
              return m;
            }, new Map<string, AssignmentList[]>()).entries()
          ).map(([subjectName, assigns]) => (
            <div key={subjectName} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Subject: {subjectName}</h2>
                <div className="text-sm text-slate-600">Total: {assigns.length}</div>
              </div>
              <div className="text-sm text-slate-600">Classes included: {Array.from(new Set(assigns.map((a) => a.lesson?.class?.name ?? "Unknown class"))).join(", ")}</div>
              <Table columns={columns} renderRow={renderRow} data={assigns} />
            </div>
          ))}
        </div>
      )}

      {groupBy === "teacher" && (
        <div className="space-y-6">
          {Array.from(
            data.reduce((m, a) => {
              const teacher = a.lesson?.teacher;
              const key = `${teacher?.id ?? "unknown"}::${teacher ? `${teacher.name ?? ""} ${teacher.surname ?? ""}`.trim() || "Unknown teacher" : "Unknown teacher"}`;
              if (!m.has(key)) m.set(key, [] as AssignmentList[]);
              m.get(key)!.push(a);
              return m;
            }, new Map<string, AssignmentList[]>()).entries()
          ).map(([teacherKey, assigns]) => (
            <div key={teacherKey} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Teacher: {teacherKey.split('::')[1]}</h2>
                <div className="text-sm text-slate-600">Total: {assigns.length}</div>
              </div>
              <Table columns={columns} renderRow={renderRow} data={assigns} />
            </div>
          ))}
        </div>
      )}

      {groupBy === "term" && (
        <div className="space-y-6">
          {academicYears.map((year) => {
            const terms = Array.from({ length: year.numberOfTerms }, (_, i) => ({
              termNumber: i + 1,
              assignments: data.filter((a) => getTermForDate(a.dueDate, year) === i + 1),
            })).filter((t) => t.assignments.length > 0);

            if (terms.length === 0) return null;

            return (
              <div key={year.label} className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h2 className="text-lg font-semibold text-slate-900">{year.label}</h2>
                </div>
                {terms.map((termGroup: any) => (
                  <div key={termGroup.termNumber} className="space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <h3 className="font-semibold text-slate-800">Term {termGroup.termNumber} ({termGroup.assignments.length} assignments)</h3>
                    </div>
                    <Table columns={columns} renderRow={renderRow} data={termGroup.assignments} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {groupBy === "year" && (
        <div className="space-y-6">
          {academicYears.map((year) => {
            const assignmentsForYear = data.filter((a) => getTermForDate(a.dueDate, year) !== null);
            if (assignmentsForYear.length === 0) return null;
            return (
              <div key={year.label} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{year.label}</h2>
                  <div className="text-sm text-slate-600">Total: {assignmentsForYear.length}</div>
                </div>
                <Table columns={columns} renderRow={renderRow} data={assignmentsForYear} />
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback flat table when no grouping selected */}
      {!groupBy && (
        <>
          <Table columns={columns} renderRow={renderRow} data={data} />
          {/* PAGINATION */}
          <Pagination page={p} count={totalCount} />
        </>
      )}
    </div>
  );
};

export default AssignmentListPage;
