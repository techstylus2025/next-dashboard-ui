import Announcements from "@/components/Announcements";
import ParentChildSelector from "@/components/ParentChildSelector";
import EventCalendar from "@/components/EventCalendar";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

const ParentPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="p-4">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Your session is still loading. Please refresh if this continues.</p>
        </div>
      </div>
    );
  }

  let parent;
  try {
    parent = await prisma.parent.findUnique({
      where: { id: userId },
      include: {
        students: {
          include: { class: true },
          orderBy: { name: "asc" },
        },
      },
    });
  } catch (error) {
    console.warn("Failed to load parent dashboard data:", error);
    parent = null;
  }

  if (!parent) {
    return notFound();
  }

  const students = parent.students ?? [];

  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/70">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Parent profile
              </p>
              <h1 className="text-2xl font-semibold text-slate-950">
                {parent.name} {parent.surname}
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {parent.email || "-"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Phone</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {parent.phone}
                </p>
              </div>
              <div className="sm:col-span-2 rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Address</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {parent.address}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/70">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Assigned students
              </p>
              <h2 className="text-xl font-semibold text-slate-950">
                {students.length} student{students.length === 1 ? "" : "s"}
              </h2>
            </div>
          </div>

          {students.length > 0 ? (
            <div className="grid gap-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {student.name} {student.surname}
                      </p>
                      <p className="text-sm text-slate-600">
                        {student.class?.name ?? "No class assigned"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {student.class?.name ?? "Unassigned"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Birthday
                      </p>
                      <p className="mt-1">
                        {new Intl.DateTimeFormat("en-GB").format(student.birthday)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Contact
                      </p>
                      <p className="mt-1">{student.phone || "-"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No students are currently assigned to your profile.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/70">
          <ParentChildSelector students={students} />
        </div>
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;