import { ReadinessEvaluation, ReadinessStatus, DocumentItem, FormItem, BranchTimingEvaluation } from "./types";

interface EvaluateInput {
  serviceSlug: string;
  serviceName: string;
  bankName: string;
  branchName?: string;
  branch?: {
    openingTime: string;
    closingTime: string;
    lunchStartTime?: string | null;
    lunchEndTime?: string | null;
    counterStatus: string;
    isClosedTemporarily: boolean;
    temporaryClosureReason?: string | null;
  } | null;
  answers: Record<string, any>;
  existingChecklist?: Array<{
    documentName: string;
    isChecked: boolean;
    isFlaggedMissing: boolean;
  }>;
}

export function evaluateServiceReadiness(input: EvaluateInput): ReadinessEvaluation {
  const { serviceSlug, serviceName, bankName, branchName = "Main Branch", branch, answers, existingChecklist = [] } = input;

  const documents: DocumentItem[] = [];
  const forms: FormItem[] = [];
  const remainingActions: string[] = [];
  const verificationCaveats: string[] = [
    "Readiness is computed from published banking rules, customer inputs, and branch reports.",
    "Final approval is subject to document verification and transaction authorization by branch officers.",
    "Carry all original identity and address documents for in-person verification.",
  ];

  // 1. Evaluate Branch Timings & Status
  const now = new Date();
  // Assume Indian Standard Time (UTC + 5:30)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);
  const currentHour = istDate.getHours();
  const currentMin = istDate.getMinutes();
  const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
  const dayOfWeek = istDate.getDay(); // 0 is Sunday, 6 is Saturday

  // Calculate if today is 2nd or 4th Saturday
  const dateOfMonth = istDate.getDate();
  const isSecondOrFourthSaturday =
    dayOfWeek === 6 &&
    ((dateOfMonth >= 8 && dateOfMonth <= 14) || (dateOfMonth >= 22 && dateOfMonth <= 28));
  const isSunday = dayOfWeek === 0;
  const isWeekendHoliday = isSunday || isSecondOrFourthSaturday;

  const openTime = branch?.openingTime || "10:00";
  const closeTime = branch?.closingTime || "16:00";
  const lunchStart = branch?.lunchStartTime || "14:00";
  const lunchEnd = branch?.lunchEndTime || "14:30";

  const isWithinHours = currentTimeStr >= openTime && currentTimeStr <= closeTime;
  const isDuringLunch = currentTimeStr >= lunchStart && currentTimeStr <= lunchEnd;
  const isTemporarilyClosed = branch?.isClosedTemporarily || false;

  const isOpen = !isWeekendHoliday && !isTemporarilyClosed && isWithinHours;

  const branchEvaluation: BranchTimingEvaluation = {
    isOpen,
    isLunchBreak: isDuringLunch,
    isHoliday: isWeekendHoliday,
    timingSummary: isWeekendHoliday
      ? `Closed today (${isSunday ? "Sunday" : "2nd/4th Saturday"} Bank Holiday)`
      : isTemporarilyClosed
      ? `Temporarily Closed: ${branch?.temporaryClosureReason || "Maintenance"}`
      : `${openTime} to ${closeTime} (Lunch: ${lunchStart} - ${lunchEnd})`,
    counterStatus: branch?.counterStatus || "Regular counters operational",
    warning: isTemporarilyClosed
      ? `Branch is temporarily non-operational: ${branch?.temporaryClosureReason}`
      : isDuringLunch
      ? "Currently lunch break. Some counters may have staggered availability."
      : isWeekendHoliday
      ? "Branch is closed due to mandatory bank holiday. Visit on the next working day."
      : undefined,
    nextOpenTime: isWeekendHoliday ? "Next working day at 10:00 AM" : isOpen ? undefined : "Next working day at 10:00 AM",
  };

  // 2. Service Specific Logic & Document Rules
  const checkedMap = new Map<string, boolean>();
  const missingMap = new Map<string, boolean>();
  existingChecklist.forEach((item) => {
    checkedMap.set(item.documentName, item.isChecked);
    missingMap.set(item.documentName, item.isFlaggedMissing);
  });

  if (serviceSlug === "cash-withdrawal" || serviceSlug.includes("withdrawal")) {
    const amount = Number(answers.amount || 0);
    const hasPan = answers.hasPan !== "no";
    const method = answers.method || "branch_counter";

    documents.push({
      documentName: "Original Bank Passbook / Cheque Book",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "None required (for verification)",
      attestationRequired: false,
      whyNeeded: "Required by branch teller to verify account ownership and signature.",
      officialSourceUrl: "https://rbi.org.in/Scripts/BS_ViewMasCirculardetails.aspx?id=9862",
      verificationStatus: "VERIFIED",
    });

    documents.push({
      documentName: "Government Photo Identity Proof (Aadhaar / Voter ID / Passport)",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "1",
      attestationRequired: true,
      whyNeeded: "Mandatory teller identification for over-the-counter cash disbursals.",
      officialSourceUrl: "https://rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=11566",
      verificationStatus: "VERIFIED",
    });

    if (amount >= 50000) {
      if (hasPan) {
        documents.push({
          documentName: "Original PAN Card",
          requirementCategory: "MANDATORY",
          originalRequired: "YES",
          photocopyCount: "1",
          attestationRequired: true,
          whyNeeded: "Mandatory under Income Tax Rule 114B for cash transactions of ₹50,000 and above.",
          officialSourceUrl: "https://incometaxindia.gov.in/Pages/rules/rule-114b.aspx",
          verificationStatus: "VERIFIED",
        });
      } else {
        forms.push({
          formName: "Form 60 (Declaration for Non-PAN Holders)",
          purpose: "Statutory declaration under Income Tax Rules for transactions exceeding ₹50,000 without PAN.",
          downloadUrl: "https://incometaxindia.gov.in/forms/income-tax%20rules/103120000000007849.pdf",
          canCompleteBeforeVisit: true,
          physicalSignatureRequired: true,
          instructions: "Fill two copies of Form 60 and attach address proof copy.",
          sourceUrl: "https://incometaxindia.gov.in",
        });
        remainingActions.push("Fill and sign Form 60 before visiting, or obtain PAN card.");
      }
    }

    if (amount >= 1000000) {
      remainingActions.push("For cash withdrawals >= ₹10 Lakhs, inform the branch manager 24 hours in advance to ensure vault liquidity.");
      verificationCaveats.push("Section 194N TDS may apply on aggregate cash withdrawals exceeding threshold limits if tax returns are unfiled.");
    }

    forms.push({
      formName: "Cash Withdrawal Slip / Cheque",
      purpose: "Authorization voucher presented to teller.",
      canCompleteBeforeVisit: false,
      physicalSignatureRequired: true,
      instructions: "Obtain withdrawal slip at counter or carry a signed self-cheque.",
    });

    remainingActions.push("Verify your signature matches bank records to avoid cheque/slip return.");
    if (amount >= 50000) {
      remainingActions.push("Carry original PAN Card and one self-attested photocopy.");
    }
  } else if (serviceSlug === "kyc-update" || serviceSlug.includes("kyc")) {
    const addressChanged = answers.addressChanged === "yes";
    const hasAadhaar = answers.hasAadhaar !== "no";

    documents.push({
      documentName: "Officially Valid Document (OVD) - Aadhaar / Passport / Voter ID",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "1",
      attestationRequired: true,
      whyNeeded: "Mandatory identity & address proof under RBI Master Directions on KYC (Section 16/28).",
      officialSourceUrl: "https://rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=11566",
      verificationStatus: "VERIFIED",
    });

    documents.push({
      documentName: "Recent Passport Size Photographs (2 copies)",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "2 original photos",
      attestationRequired: false,
      whyNeeded: "Affixed to customer profile re-KYC modification mandate.",
      officialSourceUrl: "https://rbi.org.in",
      verificationStatus: "VERIFIED",
    });

    documents.push({
      documentName: "PAN Card or Form 60",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "1",
      attestationRequired: true,
      whyNeeded: "Required for tax compliance and CDD records linkage.",
      officialSourceUrl: "https://rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=11566",
      verificationStatus: "VERIFIED",
    });

    if (addressChanged) {
      documents.push({
        documentName: "Proof of Current Address / Self-Declaration for Address Change",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "1",
        attestationRequired: true,
        whyNeeded: "RBI accepts self-declaration if current address differs from OVD address, or utility bill within 2 months.",
        officialSourceUrl: "https://rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=11566",
        verificationStatus: "VERIFIED",
      });
      remainingActions.push("Prepare self-declaration of new address or recent electricity/utility bill (under 2 months old).");
    }

    forms.push({
      formName: "Customer Re-KYC / Account Information Update Form",
      purpose: "Official revision of KYC records, risk classification, and biometric linkage.",
      downloadUrl: "https://bankready.test/forms/rekyc-standard.pdf",
      canCompleteBeforeVisit: true,
      physicalSignatureRequired: true,
      instructions: "Fill personal details, sign across the pasted photograph, and attach self-attested documents.",
    });

    remainingActions.push("Sign across all document photocopies with 'Self-Attested' and today's date.");
  } else if (serviceSlug === "pan-update" || serviceSlug.includes("pan")) {
    documents.push({
      documentName: "Original Permanent Account Number (PAN) Card",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "1",
      attestationRequired: true,
      whyNeeded: "Branch officer must verify physical PAN card against NSDL/UTIITSL database.",
      officialSourceUrl: "https://incometaxindia.gov.in/Pages/rules/rule-114b.aspx",
      verificationStatus: "VERIFIED",
    });

    documents.push({
      documentName: "Bank Passbook or Statement copy",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "1",
      attestationRequired: false,
      whyNeeded: "To establish matching account holder name and customer ID (CIF).",
      officialSourceUrl: "https://rbi.org.in",
      verificationStatus: "VERIFIED",
    });

    forms.push({
      formName: "PAN Linkage / Correction Requisition Form",
      purpose: "Requests linkage of PAN to Bank Account CIF and enables 15G/15H tax exemptions.",
      canCompleteBeforeVisit: true,
      physicalSignatureRequired: true,
      instructions: "Fill account number, PAN number, and sign matching your bank mandate.",
    });

    remainingActions.push("Ensure name on PAN card exactly matches your bank account records.");
  } else if (serviceSlug === "nominee-update" || serviceSlug.includes("nominee")) {
    documents.push({
      documentName: "Original Passbook or Fixed Deposit Receipt",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "None",
      attestationRequired: false,
      whyNeeded: "Required to endorse the official Nomination Registration Number.",
      officialSourceUrl: "https://rbi.org.in/scripts/BS_ViewMasCirculardetails.aspx?id=9862",
      verificationStatus: "VERIFIED",
    });

    documents.push({
      documentName: "Nominee Identity Proof Copy (Aadhaar / Birth Certificate if minor)",
      requirementCategory: "CONDITIONAL",
      originalRequired: "NO",
      photocopyCount: "1",
      attestationRequired: false,
      whyNeeded: "Required for exact spelling of nominee name and DOB verification.",
      officialSourceUrl: "https://rbi.org.in",
      verificationStatus: "VERIFIED",
    });

    forms.push({
      formName: "Form DA-1 (Nomination Application under Section 45ZA)",
      purpose: "Statutory nomination form under Banking Regulation Act, 1949.",
      downloadUrl: "https://bankready.test/forms/form-da1-nomination.pdf",
      canCompleteBeforeVisit: true,
      physicalSignatureRequired: true,
      instructions: "Complete nominee name, address, relationship, age, and appointee details if nominee is minor.",
    });

    remainingActions.push("Obtain exact date of birth and full legal name of nominee as per their Aadhaar/PAN.");
    remainingActions.push("If nominee is a minor (under 18), nominate a trusted adult guardian as Appointee.");
  } else {
    // Standard / Generic service fallback
    documents.push({
      documentName: "Original Passbook or Cheque Leaf",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "1",
      attestationRequired: false,
      whyNeeded: "Account identification and customer CIF verification.",
      officialSourceUrl: "https://rbi.org.in",
      verificationStatus: "VERIFIED",
    });

    documents.push({
      documentName: "Government Photo ID Proof (Aadhaar / PAN / Voter ID)",
      requirementCategory: "MANDATORY",
      originalRequired: "YES",
      photocopyCount: "1",
      attestationRequired: true,
      whyNeeded: "In-person customer identity verification.",
      officialSourceUrl: "https://rbi.org.in",
      verificationStatus: "VERIFIED",
    });

    forms.push({
      formName: "General Service Requisition Form",
      purpose: "Standard branch service application.",
      canCompleteBeforeVisit: true,
      physicalSignatureRequired: true,
      instructions: "Available at branch reception counter or online portal.",
    });

    remainingActions.push("Confirm required form at branch information counter upon arrival.");
  }

  // Populate checklist state from existing checklist if present
  documents.forEach((doc) => {
    doc.isChecked = checkedMap.get(doc.documentName) || false;
    doc.isFlaggedMissing = missingMap.get(doc.documentName) || false;
  });

  // Calculate Readiness Score & Status
  const mandatoryDocs = documents.filter((d) => d.requirementCategory === "MANDATORY");
  const checkedMandatory = mandatoryDocs.filter((d) => d.isChecked).length;
  const flaggedMissing = documents.some((d) => d.isFlaggedMissing);

  let readinessScore = 100;
  let overallStatus: ReadinessStatus = "READY_VERIFIED";
  let statusTitle = "Ready for Branch Visit";
  let statusDescription = "All essential requirements and verification items appear in order.";

  if (!branchEvaluation.isOpen) {
    overallStatus = "BRANCH_CLOSED";
    readinessScore = 20;
    statusTitle = "Branch Currently Closed";
    statusDescription = branchEvaluation.warning || "Branch is closed now. Please visit during published operating hours.";
  } else if (flaggedMissing) {
    overallStatus = "ACTION_REQUIRED";
    readinessScore = Math.max(25, Math.round((checkedMandatory / (mandatoryDocs.length || 1)) * 60));
    statusTitle = "Missing Critical Requirement";
    statusDescription = "You have flagged one or more required documents as missing. Arrange them before visiting.";
  } else if (checkedMandatory < mandatoryDocs.length) {
    overallStatus = "ACTION_REQUIRED";
    readinessScore = Math.round((checkedMandatory / (mandatoryDocs.length || 1)) * 80);
    statusTitle = "Action Required Before Leaving";
    statusDescription = `You have prepared ${checkedMandatory} of ${mandatoryDocs.length} mandatory documents. Review the checklist below.`;
  } else if (remainingActions.length > 2) {
    overallStatus = "POSSIBLE_ISSUE";
    readinessScore = 75;
    statusTitle = "Possible Issue — Review Actions";
    statusDescription = "Check remaining pre-visit actions before leaving home.";
  }

  return {
    overallStatus,
    readinessScore,
    statusTitle,
    statusDescription,
    branchEvaluation,
    documents,
    forms,
    remainingActions,
    visitSummary: {
      serviceName,
      bankName,
      branchName,
      estimatedTimeMinutes: serviceSlug.includes("kyc") ? 35 : serviceSlug.includes("withdrawal") ? 20 : 25,
      printableTimestamp: istDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      verificationCaveats,
    },
  };
}
