export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateServiceReadiness } from "@/lib/readiness-engine";

import { STATIC_BANKS, STATIC_BRANCHES } from "@/lib/static-data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serviceSlug, bankId, branchId, answers = {}, existingChecklist = [] } = body;

    if (!serviceSlug) {
      return NextResponse.json({ error: "serviceSlug is required." }, { status: 400 });
    }

    let service = null;
    try {
      service = await prisma.bankingService.findUnique({
        where: { slug: serviceSlug },
      });
    } catch (e) {}

    const serviceName = service?.name || serviceSlug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
    const serviceId = service?.id || `srv-${serviceSlug}`;

    let bankName = "State Bank of India";
    let branchName = "Connaught Place Main Branch";
    let branchData: any = null;

    if (bankId) {
      try {
        const bank = await prisma.bank.findUnique({ where: { id: bankId } });
        if (bank) bankName = bank.name;
        else {
          const sBank = STATIC_BANKS.find(b => b.id === bankId || b.code === bankId);
          if (sBank) bankName = sBank.name;
        }
      } catch (e) {
        const sBank = STATIC_BANKS.find(b => b.id === bankId || b.code === bankId);
        if (sBank) bankName = sBank.name;
      }
    }

    if (branchId) {
      try {
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
      } catch (e) {}
    }

    if (!branchData) {
      const sBranch = STATIC_BRANCHES.find(b => b.id === branchId) || STATIC_BRANCHES[0];
      if (sBranch) {
        branchName = sBranch.name;
        bankName = sBranch.bank.name;
        branchData = {
          openingTime: sBranch.openingTime,
          closingTime: sBranch.closingTime,
          lunchStartTime: sBranch.lunchStartTime,
          lunchEndTime: sBranch.lunchEndTime,
          counterStatus: sBranch.counterStatus,
          isClosedTemporarily: sBranch.isClosedTemporarily,
          temporaryClosureReason: null,
        };
      }
    }

    const evaluation = evaluateServiceReadiness({
      serviceSlug,
      serviceName,
      bankName,
      branchName,
      branch: branchData,
      answers,
      existingChecklist,
    });

    return NextResponse.json({
      success: true,
      serviceId,
      evaluation,
    });
  } catch (err: any) {
    console.error("Evaluation error:", err);
    return NextResponse.json({ error: "Failed to evaluate readiness." }, { status: 500 });
  }
}
