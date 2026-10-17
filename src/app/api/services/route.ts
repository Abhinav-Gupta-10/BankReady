export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const q = searchParams.get("q");

    const categories = await prisma.serviceCategory.findMany({
      include: {
        services: {
          where: {
            isEnabled: true,
            ...(q ? { name: { contains: q } } : {}),
          },
          include: {
            requirementRules: {
              where: { verificationStatus: "VERIFIED" },
            },
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error("Error fetching services:", err);
    return NextResponse.json({ error: "Failed to fetch services." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(["ADMIN"]);
    const body = await req.json();

    const {
      categoryId,
      name,
      description,
      isAvailableOnline,
      onlinePortalUrl,
      officialFormName,
      officialFormUrl,
      branchVisitRequired,
      minAmount,
      maxAmount,
    } = body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const service = await prisma.bankingService.create({
      data: {
        categoryId,
        name,
        slug,
        description: description || "",
        isAvailableOnline: Boolean(isAvailableOnline),
        onlinePortalUrl: onlinePortalUrl || null,
        officialFormName: officialFormName || null,
        officialFormUrl: officialFormUrl || null,
        branchVisitRequired: branchVisitRequired !== undefined ? Boolean(branchVisitRequired) : true,
        minAmount: minAmount ? Number(minAmount) : null,
        maxAmount: maxAmount ? Number(maxAmount) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_SERVICE",
        resourceType: "SERVICE",
        resourceId: service.id,
        details: `Created banking service: ${name}`,
      },
    });

    return NextResponse.json({ service });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Administrator privileges required." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create service." }, { status: 500 });
  }
}
