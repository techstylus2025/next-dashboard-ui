import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const getRoleFromSession = async () => {
  const { sessionClaims, userId } = await auth();
  let role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!role && userId) {
    const user = await clerkClient.users.getUser(userId);
    role = (user?.publicMetadata as { role?: string })?.role;
  }

  return role;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ busId: string }> }
) {
  const role = await getRoleFromSession();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: admin access required." }, { status: 403 });
  }

  const resolvedParams = await params;
  const busId = Number(resolvedParams.busId);
  if (Number.isNaN(busId)) {
    return NextResponse.json({ error: "Invalid bus id." }, { status: 400 });
  }

  const payload = await request.json();
  const name = payload?.name?.toString()?.trim();
  const plateNumber = payload?.plateNumber?.toString()?.trim();
  const driverName = payload?.driverName?.toString()?.trim();
  const route = payload?.route?.toString()?.trim();

  if (!name || !route) {
    return NextResponse.json({ error: "Bus name and route are required." }, { status: 400 });
  }

  try {
    const bus = await prisma.bus.update({
      where: { id: busId },
      data: {
        name,
        plateNumber: plateNumber ?? "",
        driverName: driverName ?? "",
        route,
      },
    });

    return NextResponse.json({ bus });
  } catch (error) {
    console.error("Bus update failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: `Unable to update bus. ${message}` }, { status: 500 });
    }
    return NextResponse.json({ error: "Unable to update bus. Please check server logs for details." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ busId: string }> }
) {
  const role = await getRoleFromSession();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: admin access required." }, { status: 403 });
  }

  const resolvedParams = await params;
  const busId = Number(resolvedParams.busId);
  if (Number.isNaN(busId)) {
    return NextResponse.json({ error: "Invalid bus id." }, { status: 400 });
  }

  try {
    await prisma.bus.delete({ where: { id: busId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bus delete failed:", error);
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ error: `Unable to delete bus. ${message}` }, { status: 500 });
    }
    return NextResponse.json({ error: "Unable to delete bus. Please check server logs for details." }, { status: 500 });
  }
}
