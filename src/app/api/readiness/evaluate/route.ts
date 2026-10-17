export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateServiceReadiness } from "@/lib/readiness-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serviceSlug, bankId, branchId, answers = {}, existingChecklist = [] } = body;

    if (!serviceSlug) {
      return NextResponse.json({ error: "serviceSlug is required." }, { status: 400 });
    }

    const service = await prisma.bankingService.findUnique({
      where: { slug: serviceSlug },
    });

    if (!service) {
      return NextResponse.json({ error: "Banking service not found." }, { status: 404 });
    }

    let bankName = "State Bank of India";
    let branchName = "Main Branch";
    let branchData = null;

    if (bankId) {
      const bank = await prisma.bank.findUnique({ where: { id: bankId } });
      if (bank) bankName = bank.name;
    }

    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: { bank: true },
      });
      if (branch) {
        branchName = branch.name;
        bankName = branch.bank.name;
        branchData = {
          openingTime: branch.openingTime,
          closingTime: branch.closingTime,
          lunchStartTime: branch.lunchStartTime,
          lunchEndTime: branch.lunchEndTime,
          counterStatus: branch.counterStatus,
          isClosedTemporarily: branch.isClosedTemporarily,
          temporaryClosureReason: branch.temporaryClosureReason,
        };
      }
    }

    const evaluation = evaluateServiceReadiness({
      serviceSlug,
      serviceName: service.name,
      bankName,
      branchName,
      branch: branchData,
      answers,
      existingChecklist,
    });

    return NextResponse.json({
      success: true,
      serviceId: service.id,
      evaluation,
    });
  } catch (err: any) {
    console.error("Evaluation error:", err);
    return NextResponse.json({ error: "Failed to evaluate readiness." }, { status: 500 });
  }
}
