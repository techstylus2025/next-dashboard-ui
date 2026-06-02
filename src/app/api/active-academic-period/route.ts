import { NextResponse } from "next/server";
import { getActiveAcademicPeriod } from "@/lib/academicContext";

export async function GET() {
  const period = await getActiveAcademicPeriod();
  return NextResponse.json({
    badge: period.badge,
    yearLabel: period.yearLabel,
    termNumber: period.termNumber,
  });
}
