import FormModal from "@/components/FormModal";
import AssignmentVisibilityToggle from "@/components/AssignmentVisibilityToggle";
import AssignmentViewModal from "@/components/assignments/AssignmentViewModal";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getTeacherAssignmentWhere } from "@/lib/assignmentAccess";
import { getCurrentAuthContext } from "@/lib/auth";

type AssignmentListItem = Prisma.AssignmentGetPayload<{
  include: {
    lesson: {
      include: {
        subject: true;
        class: true;
        teacher: true;
      };
    };
  };
}>;

type SearchParams = Promise<{ search?: string; status?: string }>;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const dueState = (assignment: AssignmentListItem, today: Date) => {
  if (assignment.dueDate < today) return "overdue";
  if (assignment.startDate > today) return "upcoming";
  const daysRemaining = Math.ceil(
    (assignment.dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );
  return daysRemaining <= 3 ? "due-soon" : "active";
};

const dueStateLabel: Record<string, string> = {
  overdue: "Past due",
  upcoming: "Opens soon",
  "due-soon": "Due soon",
  active: "In progress",
};

const dueStateClass: Record<string, string> = {
  overdue: "bg-rose-50 text-rose-700 ring-rose-200",
  upcoming: "bg-violet-50 text-violet-700 ring-violet-200",
  "due-soon": "bg-amber-50 text-amber-800 ring-amber-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const AssignmentListPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { userId, role } = await getCurrentAuthContext();
  const params = await searchParams;
  const search = params.search?.trim();
  const statusFilter = params.status ?? "all";
  const today = startOfToday();

  const filters: Prisma.AssignmentWhereInput[] = [];
  if (role === "teacher" && userId) {
    filters.push(getTeacherAssignmentWhere(userId));
  } else if (role === "student" && userId) {
    filters.push({
      lesson: { class: { students: { some: { id: userId } } } },
      isArchived: false,
    });
  } else if (role === "parent" && userId) {
    filters.push({
      lesson: { class: { students: { some: { parentId: userId } } } },
      isArchived: false,
    });
  } else if (role !== "admin") {
    filters.push({ id: -1 });
  }

  if (search) {
    filters.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { questions: { contains: search, mode: "insensitive" } },
        { lesson: { subject: { name: { contains: search, mode: "insensitive" } } } },
        { lesson: { class: { name: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }

  const where: Prisma.AssignmentWhereInput = filters.length ? { AND: filters } : {};
  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      lesson: {
        include: {
          subject: true,
          class: true,
          teacher: true,
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { startDate: "asc" }],
  });

  const stats = {
    total: assignments.length,
    active: assignments.filter((assignment) => dueState(assignment, today) === "active").length,
    dueSoon: assignments.filter((assignment) => dueState(assignment, today) === "due-soon").length,
    overdue: assignments.filter((assignment) => dueState(assignment, today) === "overdue").length,
  };
  const visibleAssignments =
    statusFilter === "all"
      ? assignments
      : assignments.filter((assignment) => dueState(assignment, today) === statusFilter);
  const assignmentsByClass = visibleAssignments.reduce((groups, assignment) => {
    const className = assignment.lesson.class.name;
    const classAssignments = groups.get(className) ?? [];
    classAssignments.push(assignment);
    groups.set(className, classAssignments);
    return groups;
  }, new Map<string, AssignmentListItem[]>());
  const canManage = role === "teacher" || role === "admin";
  const pageTitle = role === "teacher" ? "My assignments" : "Assignments";

  return (
    <main className="m-3 flex-1 space-y-5 sm:m-5">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
              Learning & assessment
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{pageTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-indigo-100">
              {role === "teacher"
                ? "Create and manage work for your assigned subjects and classes. Class supervisors can also access every assignment in their supervised classes."
                : "Keep coursework, instructions, and deadlines organized in one place."}
            </p>
          </div>
          {canManage && (
            <FormModal table="assignment" type="create" triggerLabel="Create assignment" />
          )}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "All assignments", value: stats.total, tone: "text-white" },
            { label: "In progress", value: stats.active, tone: "text-emerald-200" },
            { label: "Due within 3 days", value: stats.dueSoon, tone: "text-amber-200" },
            { label: "Past due", value: stats.overdue, tone: "text-rose-200" },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <p className="text-xs text-indigo-100">{metric.label}</p>
              <p className={`mt-1 text-2xl font-bold ${metric.tone}`}>{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <form method="get" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
          <label className="sr-only" htmlFor="assignment-search">Search assignments</label>
          <input
            id="assignment-search"
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search title, instructions, subject, or class"
            className="min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <label className="sr-only" htmlFor="assignment-status">Filter assignments</label>
          <select
            id="assignment-status"
            name="status"
            defaultValue={statusFilter}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">All statuses</option>
            <option value="active">In progress</option>
            <option value="due-soon">Due within 3 days</option>
            <option value="upcoming">Opens soon</option>
            <option value="overdue">Past due</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Apply filters
          </button>
        </form>
      </section>

      {visibleAssignments.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-700">
            0
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No assignments found</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {search || statusFilter !== "all"
              ? "Try changing your search or status filter."
              : canManage
                ? "Create your first assignment to share work and deadlines with students."
                : "There are no assignments available for you right now."}
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {Array.from(assignmentsByClass.entries()).map(([className, classAssignments]) => (
            <details
              key={className}
              className="group rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                    {className.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-slate-900">{className}</h2>
                    <p className="text-xs text-slate-500">
                      {classAssignments.length} {classAssignments.length === 1 ? "assignment" : "assignments"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-indigo-700 group-open:hidden">
                  Show assignments
                </span>
                <span className="hidden shrink-0 text-xs font-medium text-slate-500 group-open:inline">
                  Hide assignments
                </span>
              </summary>

              <div className="space-y-2 border-t border-slate-100 p-3">
                {classAssignments.map((assignment) => {
                  const state = dueState(assignment, today);
                  const teacherName = `${assignment.lesson.teacher.name} ${assignment.lesson.teacher.surname}`.trim();
                  return (
                    <article
                      key={assignment.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-3 transition hover:border-indigo-200 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {assignment.title}
                          </span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-slate-200">
                            {assignment.lesson.subject.name}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${dueStateClass[state]}`}>
                            {dueStateLabel[state]}
                          </span>
                          {assignment.isArchived && canManage && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              Hidden
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {canManage && (
                            <>
                              <AssignmentVisibilityToggle id={assignment.id} isArchived={assignment.isArchived} />
                              <FormModal table="assignment" type="update" data={assignment} />
                              <FormModal table="assignment" type="delete" id={assignment.id} />
                            </>
                          )}
                          <AssignmentViewModal assignment={assignment} />
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{teacherName || "Teacher"}</span>
                        <span>
                          Opens {assignment.startDate.toLocaleDateString("en", { month: "short", day: "numeric" })}
                          <span className="mx-1.5 text-slate-300">·</span>
                          Due {assignment.dueDate.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {assignment.questions && (
                        <p className="mt-2 line-clamp-1 text-xs text-slate-500">
                          {assignment.questions}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </details>
          ))}
        </section>
      )}
    </main>
  );
};

export default AssignmentListPage;
