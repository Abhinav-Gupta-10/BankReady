export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    const where: any = {};
    if (serviceId) where.serviceId = serviceId;

    const rules = await prisma.serviceRequirementRule.findMany({
      where,
      include: {
        service: true,
        bank: true,
      },
      orderBy: { documentName: "asc" },
    });

    return NextResponse.json({ rules });
  } catch (err: any) {
    console.error("Error fetching rules:", err);
    return NextResponse.json({ error: "Failed to fetch rules." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(["ADMIN", "EMPLOYEE"]);
    const body = await req.json();

    const {
      serviceId,
      bankId,
      documentName,
      requirementCategory = "MANDATORY",
      originalRequired = "YES",
      photocopyCount = "1",
      attestationRequired = true,
      conditionRule,
      officialSourceUrl,
      verificationStatus = "VERIFIED",
    } = body;

    if (!serviceId || !documentName) {
      return NextResponse.json({ error: "serviceId and documentName are required." }, { status: 400 });
    }

    const rule = await prisma.serviceRequirementRule.create({
      data: {
        serviceId,
        bankId: bankId || null,
        documentName,
        requirementCategory,
        originalRequired,
        photocopyCount: String(photocopyCount),
        attestationRequired: Boolean(attestationRequired),
        conditionRule: conditionRule || null,
        officialSourceUrl: officialSourceUrl || "https://rbi.org.in",
        verificationStatus: user.role === "ADMIN" ? verificationStatus : "PENDING_REVIEW", // Employees submit for review
        version: 1,
        lastVerifiedAt: new Date(),
      },
      include: { service: true, bank: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_DOCUMENT_RULE",
        resourceType: "DOCUMENT_RULE",
        resourceId: rule.id,
        details: `Created rule: ${documentName} for ${rule.service.name} (${rule.verificationStatus})`,
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Create rule error:", err);
    return NextResponse.json({ error: "Failed to create rule." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth(["ADMIN"]);
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required." }, { status: 400 });
    }

    const updated = await prisma.serviceRequirementRule.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
        lastVerifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_DOCUMENT_RULE",
        resourceType: "DOCUMENT_RULE",
        resourceId: id,
        details: `Updated rule: ${updated.documentName} to version ${updated.version}`,
      },
    });

    return NextResponse.json({ success: true, rule: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update rule." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Rule ID required." }, { status: 400 });
    }

    await prisma.serviceRequirementRule.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE_DOCUMENT_RULE",
        resourceType: "DOCUMENT_RULE",
        resourceId: id,
        details: `Deleted document rule ID: ${id}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete rule." }, { status: 500 });
  }
}
