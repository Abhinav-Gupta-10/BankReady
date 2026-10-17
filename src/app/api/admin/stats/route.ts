export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);

    const [
      customersCount,
      banksCount,
      branchesCount,
      servicesCount,
      rulesCount,
      announcementsCount,
      activeTasksCount,
      recentLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.bank.count({ where: { isEnabled: true } }),
      prisma.branch.count(),
      prisma.bankingService.count({ where: { isEnabled: true } }),
      prisma.serviceRequirementRule.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.announcement.count({ where: { status: "PUBLISHED" } }),
      prisma.customerTask.count(),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        customersCount,
        banksCount,
        branchesCount,
        servicesCount,
        rulesCount,
        announcementsCount,
        activeTasksCount,
      },
      recentLogs,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Administrator authorization required." }, { status: 403 });
    }
    console.error("Error fetching admin stats:", err);
    return NextResponse.json({ error: "Failed to fetch stats." }, { status: 500 });
  }
}
