export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const task = await prisma.customerTask.findFirst({
      where: { id, userId: user.id },
      include: {
        service: true,
        branch: {
          include: { bank: true },
        },
        checklistItems: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch task." }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const existingTask = await prisma.customerTask.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const { status, userNotes, readinessScore } = body;

    const updatedTask = await prisma.customerTask.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(userNotes !== undefined ? { userNotes } : {}),
        ...(readinessScore !== undefined ? { readinessScore: Number(readinessScore) } : {}),
      },
      include: {
        service: true,
        branch: { include: { bank: true } },
        checklistItems: true,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existingTask = await prisma.customerTask.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    await prisma.customerTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully." });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });
  }
}
