import { getSchoolBranding } from "@/lib/schoolBranding";
import { NextResponse } from "next/server";

export async function GET() {
  const branding = await getSchoolBranding();
  return NextResponse.json(branding, {
    headers: { "Cache-Control": "no-store" },
  });
}
