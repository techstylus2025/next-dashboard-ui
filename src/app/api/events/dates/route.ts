import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const events = await prisma.event.findMany({ select: { startTime: true } });
    const dates = Array.from(
      new Set(
        events.map((e) => new Date(e.startTime).toISOString().slice(0, 10))
      )
    );
    return NextResponse.json({ dates });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ dates: [] }, { status: 500 });
  }
}
