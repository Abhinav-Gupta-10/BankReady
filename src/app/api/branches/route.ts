export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

import { STATIC_BRANCHES } from "@/lib/static-data";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const bankId = searchParams.get("bankId");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const pinCode = searchParams.get("pinCode");
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const isAll = searchParams.get("all") === "true";
    const requestedLimit = parseInt(searchParams.get("limit") || "60", 10);
    const limit = isAll ? 1000 : Math.min(Math.max(requestedLimit, 1), 200);
    const skip = isAll ? 0 : (Math.max(page, 1) - 1) * limit;

    const conditions: any[] = [];

    if (id) {
      conditions.push({ id });
    }

    if (bankId) {
      const bank = await prisma.bank.findFirst({
        where: {
          OR: [
            { id: bankId },
            { code: bankId.toUpperCase() },
            { slug: bankId.toLowerCase() },
          ],
        },
        select: { id: true },
      });
      conditions.push({ bankId: bank ? bank.id : bankId });
    }

    if (city) {
      const cTrim = city.trim();
      conditions.push({
        OR: [
          { city: { contains: cTrim } },
          { address: { contains: cTrim } },
        ],
      });
    }

    if (state) {
      conditions.push({ state: { contains: state.trim() } });
    }

    if (pinCode) {
      conditions.push({ pinCode: { contains: pinCode.trim() } });
    }

    if (q) {
      const qTrim = q.trim();
      conditions.push({
        OR: [
          { name: { contains: qTrim } },
          { ifscCode: { contains: qTrim.toUpperCase() } },
          { city: { contains: qTrim } },
          { state: { contains: qTrim } },
          { address: { contains: qTrim } },
          { pinCode: { contains: qTrim } },
        ],
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [totalCount, fetchedBranches] = await Promise.all([
      prisma.branch.count({ where }),
      prisma.branch.findMany({
        where,
        take: limit,
        skip,
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
        orderBy: [{ bank: { name: "asc" } }, { name: "asc" }],
      }),
    ]);

    let branches = fetchedBranches;
    let effectiveTotal = totalCount;

    if (branches.length === 0) {
      let filtered = [...STATIC_BRANCHES];
      if (bankId) {
        filtered = filtered.filter(b => b.bankId === bankId || b.bank.id === bankId || b.bank.code.toLowerCase() === bankId.toLowerCase());
      }
      if (city) {
        filtered = filtered.filter(b => b.city.toLowerCase().includes(city.toLowerCase()));
      }
      if (q) {
        filtered = filtered.filter(b => b.name.toLowerCase().includes(q.toLowerCase()) || b.city.toLowerCase().includes(q.toLowerCase()));
      }
      branches = filtered as any;
      effectiveTotal = branches.length;
    }

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

    return NextResponse.json({
      branches: branchesWithStatus,
      pagination: {
        total: effectiveTotal,
        page,
        limit,
        totalPages: Math.ceil(effectiveTotal / limit),
      },
    });
  } catch (err: any) {
    console.error("Error fetching branches, using fallback:", err);
    return NextResponse.json({
      branches: STATIC_BRANCHES.map(b => ({
        ...b,
        liveStatus: {
          isOpen: true,
          isDuringLunch: false,
          isHoliday: false,
          statusLabel: "Open Now",
        },
      }))
    });
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
