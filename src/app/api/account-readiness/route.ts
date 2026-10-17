export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getProviderForBank } from "@/lib/banking-providers";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();

    const {
      mode = "CUSTOMER_REPORTED", // "CUSTOMER_REPORTED" or "INTEGRATION_SANDBOX"
      bankCode = "SBI",
      accountNumber = "XXXX1234",
      requestedAmount = 50000,
      reportedKyc = "VERIFIED",
      reportedPanLinked = true,
      reportedHasRestriction = false,
      reportedRestrictionDetails = "",
    } = body;

    let evaluationResult: any = {};

    if (mode === "INTEGRATION_SANDBOX") {
      const provider = getProviderForBank(bankCode);

      if (!provider || !provider.isConfigured) {
        evaluationResult = {
          mode: "INTEGRATION_UNAVAILABLE",
          providerName: bankCode,
          isLiveAvailable: false,
          message: "Live account verification unavailable for this bank. Please rely on customer-reported checks.",
          checks: [],
        };
      } else {
        // Run provider methods
        const kyc = await provider.getKycStatus(accountNumber);
        const pan = await provider.getPanLinkageStatus(accountNumber);
        const limits = await provider.getApplicableTransactionLimits(accountNumber, "COUNTER");
        const restrictions = await provider.getServiceRestrictions(accountNumber);

        const canWithdraw =
          !restrictions.hasDebitFreeze &&
          !restrictions.dormantStatus &&
          requestedAmount <= limits.dailyLimit;

        evaluationResult = {
          mode: "INTEGRATION_SANDBOX",
          providerName: provider.bankName,
          isLiveAvailable: true,
          verificationSource: "Authorized Open Banking Sandbox Feed",
          timestamp: new Date().toISOString(),
          checks: [
            {
              title: "KYC Compliance Status",
              status: kyc.kycStatus === "VALID" ? "PASS" : "FAIL",
              value: `Status: ${kyc.kycStatus} (Re-KYC due: ${kyc.nextReKycDueDate || "N/A"})`,
              source: "Direct Core Banking KYC Master",
            },
            {
              title: "PAN Linkage & Verification",
              status: pan.isLinked ? "PASS" : "WARN",
              value: pan.isLinked ? `Linked (${pan.maskedPan})` : "PAN Not Linked - Form 60 Mandatory",
              source: "CBDT & Bank CIF Database",
            },
            {
              title: "Transaction Limits (Counter Cash)",
              status: requestedAmount <= limits.dailyLimit ? "PASS" : "WARN",
              value: `Daily Limit: ₹${limits.dailyLimit.toLocaleString("en-IN")}, Per-Txn: ₹${limits.perTransactionLimit.toLocaleString("en-IN")}`,
              source: "Branch Channel Rule Engine",
            },
            {
              title: "Account Freezes & Restrictions",
              status: !restrictions.hasDebitFreeze && !restrictions.dormantStatus ? "PASS" : "FAIL",
              value: restrictions.hasDebitFreeze
                ? "Debit Freeze Active"
                : restrictions.dormantStatus
                ? "Account Dormant (Reactivation Required)"
                : "Active & Unrestricted",
              source: "Branch CBS Ledger",
            },
          ],
          overallStatus: canWithdraw ? "READY_VERIFIED" : "ACTION_REQUIRED",
          canWithdraw,
          disclaimer:
            "Sandbox integration simulation for architecture demonstration. Live bank production interfaces require explicit customer OAuth consent and participating bank authorization.",
        };
      }
    } else {
      // Mode A: Customer-Reported Information
      const isReady =
        reportedKyc === "VERIFIED" &&
        reportedPanLinked &&
        !reportedHasRestriction;

      evaluationResult = {
        mode: "CUSTOMER_REPORTED",
        isLiveAvailable: false,
        timestamp: new Date().toISOString(),
        checks: [
          {
            title: "Self-Reported KYC Status",
            status: reportedKyc === "VERIFIED" ? "PASS" : reportedKyc === "PENDING" ? "WARN" : "FAIL",
            value: `Customer Reported: ${reportedKyc}`,
            source: "Customer Self-Assessment (Not Independently Verified)",
          },
          {
            title: "Self-Reported PAN Linkage",
            status: reportedPanLinked ? "PASS" : "WARN",
            value: reportedPanLinked ? "Customer Reported: PAN Linked" : "Customer Reported: Not Linked",
            source: "Customer Self-Assessment",
          },
          {
            title: "Known Account Restrictions / Hold Notices",
            status: reportedHasRestriction ? "FAIL" : "PASS",
            value: reportedHasRestriction ? `Restriction Reported: ${reportedRestrictionDetails || "Notice Received"}` : "None Reported",
            source: "Customer Self-Assessment",
          },
        ],
        overallStatus: isReady ? "READY_VERIFIED" : "ACTION_REQUIRED",
        disclaimer:
          "This evaluation is strictly based on facts reported by you. The bank branch may require additional document verification or identify account holds not known to you.",
      };
    }

    // If logged in, record verification log
    if (session) {
      await prisma.accountVerificationLog.create({
        data: {
          userId: session.id,
          serviceType: "ACCOUNT_READINESS_CHECK",
          mode,
          statusDetails: JSON.stringify(evaluationResult),
        },
      });
    }

    return NextResponse.json({ success: true, result: evaluationResult });
  } catch (err: any) {
    console.error("Account readiness check error:", err);
    return NextResponse.json({ error: "Failed to perform account readiness check." }, { status: 500 });
  }
}
