export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get("bankId");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const pinCode = searchParams.get("pinCode");
    const q = searchParams.get("q");

    const where: any = {};
    if (bankId) where.bankId = bankId;
    if (city) where.city = { contains: city };
    if (state) where.state = { contains: state };
    if (pinCode) where.pinCode = { contains: pinCode };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { ifscCode: { contains: q } },
        { city: { contains: q } },
        { address: { contains: q } },
        { pinCode: { contains: q } },
      ];
    }

    const branches = await prisma.branch.findMany({
      where,
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            code: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Compute live status
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utc + 3600000 * 5.5);
    const currentHour = istDate.getHours();
    const currentMin = istDate.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
    const dayOfWeek = istDate.getDay();
    const dateOfMonth = istDate.getDate();
    const isSecondOrFourthSaturday =
      dayOfWeek === 6 &&
      ((dateOfMonth >= 8 && dateOfMonth <= 14) || (dateOfMonth >= 22 && dateOfMonth <= 28));
    const isSunday = dayOfWeek === 0;
    const isHoliday = isSunday || isSecondOrFourthSaturday;

    const branchesWithStatus = branches.map((b) => {
      const openTime = b.openingTime || "10:00";
      const closeTime = b.closingTime || "16:00";
      const lunchStart = b.lunchStartTime || "14:00";
      const lunchEnd = b.lunchEndTime || "14:30";

      const isWithinHours = currentTimeStr >= openTime && currentTimeStr <= closeTime;
      const isDuringLunch = currentTimeStr >= lunchStart && currentTimeStr <= lunchEnd;
      const isOpen = !isHoliday && !b.isClosedTemporarily && isWithinHours;

      return {
        ...b,
        liveStatus: {
          isOpen,
          isDuringLunch,
          isHoliday,
          statusLabel: isHoliday
            ? `Closed (${isSunday ? "Sunday" : "2nd/4th Saturday"})`
            : b.isClosedTemporarily
            ? "Temporarily Closed"
            : isOpen
            ? isDuringLunch
              ? "Open (Lunch Staggered)"
              : "Open Now"
            : "Closed Now",
        },
      };
    });

    return NextResponse.json({ branches: branchesWithStatus });
  } catch (err: any) {
    console.error("Error fetching branches:", err);
    return NextResponse.json({ error: "Failed to fetch branches." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(["ADMIN", "EMPLOYEE"]);
    const body = await req.json();

    const {
      bankId,
      name,
      code,
      ifscCode,
      address,
      city,
      state,
      pinCode,
      contactPhone,
      email,
      openingTime,
      closingTime,
      lunchStartTime,
      lunchEndTime,
      counterStatus,
      isClosedTemporarily,
      temporaryClosureReason,
    } = body;

    // If Employee, restrict modification to their assigned branch/bank if assigned
    if (user.role === "EMPLOYEE" && user.preferredBankId && user.preferredBankId !== bankId) {
      return NextResponse.json(
        { error: "Employees are only permitted to manage branches within their assigned bank." },
        { status: 403 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        bankId,
        name,
        code: code || `BR-${Math.floor(1000 + Math.random() * 9000)}`,
        ifscCode: ifscCode?.toUpperCase().trim() || "SBIN0000000",
        address,
        city,
        state,
        pinCode,
        contactPhone: contactPhone || "011-20000000",
        email: email || null,
        openingTime: openingTime || "10:00",
        closingTime: closingTime || "16:00",
        lunchStartTime: lunchStartTime || "14:00",
        lunchEndTime: lunchEndTime || "14:30",
        counterStatus: counterStatus || "Counters operational",
        isClosedTemporarily: isClosedTemporarily || false,
        temporaryClosureReason: temporaryClosureReason || null,
        verifiedSource: `${user.role} Update: ${user.name}`,
        lastVerifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_BRANCH",
        resourceType: "BRANCH",
        resourceId: branch.id,
        details: `Created/updated branch ${name} (${ifscCode})`,
      },
    });

    return NextResponse.json({ branch });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create branch." }, { status: 500 });
  }
}
