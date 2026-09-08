import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { computeSubjectPercentage } from "@/lib/gradingUtils";

export async function GET() {
  const db = prisma;

  const reports = await db.termlyReport.findMany({
    where: {},
    select: {
      academicYearId: true,
      termNumber: true,
      classId: true,
      academicYear: { select: { label: true } },
      class: { select: { id: true, name: true } },
      subjectLines: { select: { subjectId: true, subject: { select: { id: true, name: true } }, classScore: true, examScore: true } },
    },
  });

  // collect classes and term map
  const classMap = new Map<number, string>();
  const termMap = new Map<string, { label: string; termNumber: number; academicYearLabel: string; classMap: Map<number, { subjectMap: Map<number, { total: number; sum: number }> }> }>();

  for (const r of reports) {
    if (r.class) classMap.set(r.class.id, r.class.name);
    const key = `${r.academicYearId}-${r.termNumber}`;
    const label = `${r.academicYear?.label ?? "Year"} · Term ${r.termNumber}`;
    const termEntry = termMap.get(key) ?? { label, termNumber: r.termNumber, academicYearLabel: r.academicYear?.label ?? "", classMap: new Map() };
    const classEntry = termEntry.classMap.get(r.classId) ?? { subjectMap: new Map() };

    for (const sl of r.subjectLines ?? []) {
      const sub = sl.subject;
      if (!sub) continue;
      const pct = computeSubjectPercentage(sl.classScore ?? 0, sl.examScore ?? 0);
      const existing = classEntry.subjectMap.get(sub.id) ?? { total: 0, sum: 0 };
      existing.total += 1;
      existing.sum += pct;
      classEntry.subjectMap.set(sub.id, existing);
    }

    termEntry.classMap.set(r.classId, classEntry);
    termMap.set(key, termEntry);
  }

  const terms = Array.from(termMap.entries()).map(([key, entry]) => {
    const classes = Array.from(classMap.entries()).map(([cid, cname]) => {
      const subjMap = entry.classMap.get(cid)?.subjectMap ?? new Map();
      const subjects = Array.from(subjMap.entries()).map(([sid, vals]) => ({ subjectId: sid, subjectName: "", average: Math.round(vals.sum / vals.total) }));
      return { classId: cid, className: cname, subjects };
    });

    return { termKey: key, label: entry.label, classes };
  });

  // enrich subject names by scanning subject table (collect unique subject ids)
  const subjectIds = new Set<number>();
  for (const t of terms) for (const c of t.classes) for (const s of c.subjects) subjectIds.add(s.subjectId);

  const subjectList = subjectIds.size > 0 ? await db.subject.findMany({ where: { id: { in: Array.from(subjectIds) } }, select: { id: true, name: true } }) : [];
  const subjectNameMap = new Map<number, string>(subjectList.map((s) => [s.id, s.name]));

  // attach names
  for (const t of terms) for (const c of t.classes) for (const s of c.subjects) s.subjectName = subjectNameMap.get(s.subjectId) ?? "Unknown";

  return NextResponse.json({ terms });
}
