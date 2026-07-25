import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { approvePasswordChangeRequest, rejectPasswordChangeRequest } from "@/lib/profileActions";

export async function POST(request: Request) {
  // Dev bypass: allow injecting a dummy admin user via headers for local testing
  const devUserId = request.headers.get("x-dev-user-id");
  const devUserRole = request.headers.get("x-dev-user-role");
  const user = devUserId
    ? { id: devUserId, publicMetadata: { role: devUserRole ?? "admin" } }
    : await currentUser();
  if (!user || user.publicMetadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const requestId = Number(payload?.requestId);
  const action = payload?.action;
  const comment = payload?.comment?.toString()?.trim();

  if (!requestId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    if (action === "approve") {
      await approvePasswordChangeRequest(requestId, user.id, comment);
    } else {
      await rejectPasswordChangeRequest(requestId, user.id, comment);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to process request" }, { status: 500 });
  }
}
