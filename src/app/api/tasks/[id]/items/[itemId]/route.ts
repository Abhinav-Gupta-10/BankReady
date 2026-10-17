export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: taskId, itemId } = await params;
    const body = await req.json();

    // Verify task belongs to user
    const task = await prisma.customerTask.findFirst({
      where: { id: taskId, userId: user.id },
      include: { checklistItems: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const { isChecked, isFlaggedMissing, notes } = body;

    const updatedItem = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        ...(isChecked !== undefined ? { isChecked: Boolean(isChecked) } : {}),
        ...(isFlaggedMissing !== undefined ? { isFlaggedMissing: Boolean(isFlaggedMissing) } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    // Recompute task readiness score
    const allItems = await prisma.taskChecklistItem.findMany({
      where: { taskId },
    });

    const mandatoryItems = allItems.filter((i) => i.requirementCategory === "MANDATORY");
    const checkedMandatory = mandatoryItems.filter((i) => i.isChecked).length;
    const hasMissing = allItems.some((i) => i.isFlaggedMissing);

    let newStatus = task.status;
    let newScore = Math.round((checkedMandatory / (mandatoryItems.length || 1)) * 100);

    if (hasMissing) {
      newStatus = "ACTION_REQUIRED";
      newScore = Math.min(newScore, 60);
    } else if (checkedMandatory === mandatoryItems.length && mandatoryItems.length > 0) {
      newStatus = "READY_FOR_VISIT";
      newScore = 100;
    } else {
      newStatus = "IN_PROGRESS";
    }

    await prisma.customerTask.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        readinessScore: newScore,
      },
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
      taskStatus: newStatus,
      readinessScore: newScore,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    console.error("Error updating checklist item:", err);
    return NextResponse.json({ error: "Failed to update item." }, { status: 500 });
  }
}
