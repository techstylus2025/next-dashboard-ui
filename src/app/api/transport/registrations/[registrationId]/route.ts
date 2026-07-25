import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const getRoleFromSession = async () => {
  const { sessionClaims, userId } = await auth();
  let role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!role && userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    role = (user?.publicMetadata as { role?: string })?.role;
  }

  return role;
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  const role = await getRoleFromSession();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: admin access required." }, { status: 403 });
  }

  const resolvedParams = await params;
  const registrationId = Number(resolvedParams.registrationId);
  if (Number.isNaN(registrationId)) {
    return NextResponse.json({ error: "Invalid registration id." }, { status: 400 });
  }

  try {
    await prisma.busRegistration.delete({ where: { id: registrationId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bus registration delete failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: `Unable to remove registration. ${message}` }, { status: 500 });
    }
    return NextResponse.json({ error: "Unable to remove registration. Please check server logs for details." }, { status: 500 });
  }
}
