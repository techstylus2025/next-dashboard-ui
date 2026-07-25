"use client";

import React, { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useActionState } from "react";
import FormContainer from "@/components/FormContainer";
import { promoteStudents } from "@/lib/actions";

type ParentInfo = {
  name: string;
  surname: string;
};

type Student = {
  id: string;
  name: string;
  surname?: string;
  username?: string;
  img?: string | null;
  parent: ParentInfo;
  birthday: string;
  createdAt: string;
};

type PromotionHistory = {
  id: string;
  label: string;
  fromClassId: number;
  toClassId: number;
  studentIds: string[];
  timestamp: string;
};

type ClassGroup = {
  id: number;
  name: string;
  students: Student[];
};

const StudentsByClass = ({ groups, allClasses }: { groups: ClassGroup[]; allClasses: { id: number; name: string }[] }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [targetByClass, setTargetByClass] = useState<Record<number, number | "">>({});
  const [promotionHistory, setPromotionHistory] = useState<PromotionHistory[]>([]);
  const [state, promoteAction] = useActionState(promoteStudents, { success: false, error: false });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      setErrorMessage(null);
      router.refresh();
    }
    if (state.error) {
      setErrorMessage("Unable to promote student(s). Please check the selected class and try again.");
    }
  }, [state, router]);

  const toggle = (id: number) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const pushPromotionHistory = (entry: Omit<PromotionHistory, "id" | "timestamp">) => {
    setPromotionHistory((current) => [
      { ...entry, id: `${Date.now()}-${entry.fromClassId}-${entry.toClassId}`, timestamp: new Date().toISOString() },
      ...current,
    ]);
  };

  const handlePromoteSingle = async (student: Student, fromClassId: number, toClassId: number) => {
    if (fromClassId === toClassId) {
      setErrorMessage("Student is already in the selected class.");
      return;
    }

    if (!window.confirm(`Move ${student.name} ${student.surname ?? ""} to the selected class?`)) {
      return;
    }

    const result = (await promoteAction({ studentIds: [student.id], toClassId })) as any;
    if (!result?.success) return;

    pushPromotionHistory({
      label: `Moved ${student.name} ${student.surname ?? ""}`,
      fromClassId,
      toClassId,
      studentIds: [student.id],
    });
    toast.success("Student moved successfully. Undo available below.");
  };

  const handlePromoteAll = async (group: ClassGroup, toClassId: number) => {
    if (group.id === toClassId) {
      setErrorMessage("Please choose a different class to promote this group.");
      return;
    }

    if (!window.confirm(`Promote all ${group.students.length} students from ${group.name} to the selected class?`)) {
      return;
    }

    const result = (await promoteAction({ promoteAll: true, fromClassId: group.id, toClassId })) as any;
    if (!result?.success) return;

    pushPromotionHistory({
      label: `Moved ${group.students.length} students from ${group.name}`,
      fromClassId: group.id,
      toClassId,
      studentIds: group.students.map((student) => student.id),
    });
    toast.success("Class promotion successful. Undo available below.");
  };

  const undoLastPromotion = async () => {
    const last = promotionHistory[0];
    if (!last) return;

    if (!window.confirm("Undo the last promotion action? This will move students back to their previous class.")) {
      return;
    }

    const result = (await promoteAction({ studentIds: last.studentIds, toClassId: last.fromClassId })) as any;
    if (!result?.success) return;

    setPromotionHistory((current) => current.slice(1));
    toast.success("Last promotion undone.");
  };

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {promotionHistory.length > 0 ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Promotion history</h3>
              <p className="text-sm text-slate-500">Last action is undoable.</p>
            </div>
            <button onClick={undoLastPromotion} className="px-3 py-1 rounded-md bg-slate-900 text-white text-sm">
              Undo last
            </button>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {promotionHistory.slice(0, 3).map((entry) => (
              <div key={entry.id} className="rounded-md bg-white p-3 border border-slate-200">
                <div className="font-medium">{entry.label}</div>
                <div className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {groups.map((group) => (
        <div key={group.id} className="rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggle(group.id)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
                {group.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold">{group.name}</div>
                <div className="text-xs text-slate-500">{group.students.length} students</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={targetByClass[group.id] ?? ""}
                onChange={(e) => setTargetByClass((s) => ({ ...s, [group.id]: e.target.value ? Number(e.target.value) : "" }))}
                className="ring-1 ring-slate-200 rounded-md p-1 text-sm"
              >
                <option value="">Select target class</option>
                {allClasses
                  .filter((c) => c.id !== group.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const to = targetByClass[group.id];
                  if (to && typeof to === "number") handlePromoteAll(group, to);
                }}
                className="px-3 py-1 rounded-md bg-lamaYellow text-sm"
              >
                Promote all
              </button>
              <button className="px-3 py-1 rounded-md bg-slate-100 text-sm" onClick={(e) => { e.stopPropagation(); toggle(group.id); }}>
                {expanded[group.id] ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-max-h duration-300 ease-in-out ${expanded[group.id] ? "max-h-[1200px]" : "max-h-0"}`}
          >
            <div className="p-3 border-t border-slate-100 overflow-x-auto">
              <table className="min-w-full text-left text-sm divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-3 font-semibold text-slate-700">Student name</th>
                    <th className="px-3 py-3 font-semibold text-slate-700">Username</th>
                    <th className="px-3 py-3 font-semibold text-slate-700">Parent</th>
                    <th className="px-3 py-3 font-semibold text-slate-700">Admission date</th>
                    <th className="px-3 py-3 font-semibold text-slate-700">DOB</th>
                    <th className="px-3 py-3 font-semibold text-slate-700">Age</th>
                    <th className="px-3 py-3 font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {group.students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={s.img ?? undefined}
                            name={`${s.name} ${s.surname ?? ""}`}
                            alt={`${s.name} ${s.surname ?? ""}`}
                            size={36}
                            className="rounded-full"
                          />
                          <div>
                            <div className="font-medium">{s.name} {s.surname ?? ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{s.username ?? "-"}</td>
                      <td className="px-3 py-3 text-slate-600">{s.parent?.name ? `${s.parent.name} ${s.parent.surname ?? ""}` : "-"}</td>
                      <td className="px-3 py-3 text-slate-600">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-3 text-slate-600">{new Date(s.birthday).toLocaleDateString()}</td>
                      <td className="px-3 py-3 text-slate-600">{Math.floor((Date.now() - new Date(s.birthday).getTime()) / 31557600000)} yrs</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/list/students/${s.id}`} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
                            <Image src="/view.svg" alt="View" width={16} height={16} />
                          </Link>
                          <FormContainer table="student" type="update" data={s} />
                          <FormContainer table="student" type="delete" id={s.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentsByClass;
