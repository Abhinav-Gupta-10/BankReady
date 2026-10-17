export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    const tasks = await prisma.customerTask.findMany({
      where: { userId: user.id },
      include: {
        service: true,
        branch: {
          include: {
            bank: true,
          },
        },
        checklistItems: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Please log in to view saved tasks." }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const {
      serviceId,
      branchId,
      status = "IN_PROGRESS",
      readinessScore = 0,
      userNotes = "",
      customerAnswers = {},
      checklistItems = [],
    } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId is required." }, { status: 400 });
    }

    const task = await prisma.customerTask.create({
      data: {
        userId: user.id,
        serviceId,
        branchId: branchId || null,
        status,
        readinessScore: Number(readinessScore) || 0,
        userNotes: userNotes || null,
        customerAnswers: JSON.stringify(customerAnswers),
        checklistItems: {
          create: checklistItems.map((item: any) => ({
            documentName: item.documentName,
            requirementCategory: item.requirementCategory || "MANDATORY",
            originalRequired: item.originalRequired || "YES",
            photocopyCount: String(item.photocopyCount || "1"),
            isChecked: Boolean(item.isChecked),
            isFlaggedMissing: Boolean(item.isFlaggedMissing),
            notes: item.notes || null,
            officialSourceUrl: item.officialSourceUrl || null,
          })),
        },
      },
      include: {
        service: true,
        branch: { include: { bank: true } },
        checklistItems: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_TASK",
        resourceType: "TASK",
        resourceId: task.id,
        details: `Saved preparation checklist for ${task.service.name}`,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Please log in to save your task." }, { status: 401 });
    }
    console.error("Create task error:", err);
    return NextResponse.json({ error: "Failed to save task." }, { status: 500 });
  }
}
