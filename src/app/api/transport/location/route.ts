import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const busId = Number(payload?.busId);
  const latitude = Number(payload?.latitude);
  const longitude = Number(payload?.longitude);

  if (!busId || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: "Invalid location data." }, { status: 400 });
  }

  const bus = await prisma.bus.findUnique({ where: { id: busId } });
  if (!bus) {
    return NextResponse.json({ error: "Bus not found." }, { status: 404 });
  }

  try {
    await prisma.busLocation.create({
      data: {
        busId,
        latitude: new Prisma.Decimal(latitude.toString()),
        longitude: new Prisma.Decimal(longitude.toString()),
        driverId: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update bus location." }, { status: 500 });
  }
}
