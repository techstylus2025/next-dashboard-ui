import { NextResponse } from "next/server";
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

export async function GET() {
  const buses = await prisma.bus.findMany({
    orderBy: { id: "asc" },
    include: { locations: { orderBy: { reportedAt: "desc" }, take: 1 } },
  });

  return NextResponse.json({
    buses: buses.map((bus) => ({
      id: bus.id,
      name: bus.name,
      plateNumber: bus.plateNumber,
      driverName: bus.driverName,
      route: bus.route,
      latestLocation: bus.locations[0]
        ? {
            latitude: Number(bus.locations[0].latitude),
            longitude: Number(bus.locations[0].longitude),
            reportedAt: bus.locations[0].reportedAt.toISOString(),
          }
        : null,
    })),
  });
}

export async function POST(request: Request) {
  const role = await getRoleFromSession();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: admin access required." }, { status: 403 });
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
    const bus = await prisma.bus.create({
      data: {
        name,
        plateNumber: plateNumber ?? "",
        driverName: driverName ?? "",
        route,
      },
    });

    return NextResponse.json({ bus });
  } catch (error) {
    console.error("Bus create failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: `Unable to create bus. ${message}` }, { status: 500 });
    }
    return NextResponse.json({ error: "Unable to create bus. Please check server logs for details." }, { status: 500 });
  }
}
