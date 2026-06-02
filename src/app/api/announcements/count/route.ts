import { getAnnouncementCount } from "@/lib/announcementActions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const count = await getAnnouncementCount();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
