export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get("bankId");
    const branchId = searchParams.get("branchId");

    const where: any = {
      status: "PUBLISHED",
    };

    if (bankId) where.bankId = bankId;
    if (branchId) where.branchId = branchId;

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        bank: true,
        branch: true,
        service: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ announcements });
  } catch (err: any) {
    console.error("Error fetching announcements:", err);
    return NextResponse.json({ error: "Failed to fetch announcements." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(["ADMIN", "EMPLOYEE"]);
    const body = await req.json();

    const {
      bankId,
      branchId,
      serviceId,
      title,
      message,
      sourceUrl,
      priority = "NORMAL",
      status = "PUBLISHED",
    } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
    }

    // Branch Employee permission restriction
    if (user.role === "EMPLOYEE" && user.preferredBankId && bankId && user.preferredBankId !== bankId) {
      return NextResponse.json({ error: "Cannot publish notices for other banks." }, { status: 403 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        bankId: bankId || null,
        branchId: branchId || null,
        serviceId: serviceId || null,
        authorId: user.id,
        title,
        message,
        sourceUrl: sourceUrl || null,
        priority,
        status,
        verificationStatus: "VERIFIED",
      },
    });

    // Notify customers who have this bank or branch preferred
    const targetUsers = await prisma.user.findMany({
      where: {
        OR: [
          ...(branchId ? [{ preferredBranchId: branchId }] : []),
          ...(bankId ? [{ preferredBankId: bankId }] : []),
        ],
      },
    });

    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          announcementId: announcement.id,
          title: `Update: ${title}`,
          message: message.substring(0, 160) + (message.length > 160 ? "..." : ""),
          linkUrl: "/notifications",
          isRead: false,
        })),
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PUBLISH_ANNOUNCEMENT",
        resourceType: "ANNOUNCEMENT",
        resourceId: announcement.id,
        details: `Published notice: ${title}`,
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Publish announcement error:", err);
    return NextResponse.json({ error: "Failed to publish announcement." }, { status: 500 });
  }
}
