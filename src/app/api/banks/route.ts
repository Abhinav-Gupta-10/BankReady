export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

import { STATIC_BANKS } from "@/lib/static-data";

export async function GET() {
  try {
    const banks = await prisma.bank.findMany({
      where: { isEnabled: true },
      include: {
        _count: {
          select: {
            branches: true,
            serviceRules: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (banks.length > 0) {
      return NextResponse.json({ banks });
    }
    return NextResponse.json({ banks: STATIC_BANKS });
  } catch (err: any) {
    console.error("Error fetching banks, using fallback:", err);
    return NextResponse.json({ banks: STATIC_BANKS });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(["ADMIN"]);
    const body = await req.json();

    const { name, code, websiteUrl, helplineNumber } = body;
    if (!name || !code) {
      return NextResponse.json({ error: "Name and code are required." }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const bank = await prisma.bank.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        slug,
        websiteUrl: websiteUrl || "https://rbi.org.in",
        helplineNumber: helplineNumber || "1800 11 2211",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_BANK",
        resourceType: "BANK",
        resourceId: bank.id,
        details: `Created bank ${name} (${code})`,
      },
    });

    return NextResponse.json({ bank });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied. Administrator privileges required." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create bank." }, { status: 500 });
  }
}
