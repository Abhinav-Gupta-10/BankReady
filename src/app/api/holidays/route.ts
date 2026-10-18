export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

import { STATIC_HOLIDAYS } from "@/lib/static-data";

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

    if (holidays.length > 0) {
      return NextResponse.json({ holidays });
    }
    return NextResponse.json({ holidays: STATIC_HOLIDAYS });
  } catch (err: any) {
    console.error("Error fetching holidays, using fallback:", err);
    return NextResponse.json({ holidays: STATIC_HOLIDAYS });
  }
}
