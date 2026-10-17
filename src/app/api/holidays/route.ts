export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");

    const where: any = {};
    if (state) {
      where.OR = [
        { isNational: true },
        { state: null },
        { state: { contains: state } },
      ];
    }

    const holidays = await prisma.branchHoliday.findMany({
      where,
      orderBy: { holidayDate: "asc" },
    });

    return NextResponse.json({ holidays });
  } catch (err: any) {
    console.error("Error fetching holidays:", err);
    return NextResponse.json({ error: "Failed to fetch holidays." }, { status: 500 });
  }
}
