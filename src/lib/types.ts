export type UserRole = "CUSTOMER" | "ADMIN" | "EMPLOYEE";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  preferredBankId?: string | null;
  preferredBranchId?: string | null;
  kycSelfReported?: string;
  panSelfReported?: boolean;
}

export type ReadinessStatus =
  | "READY_VERIFIED"
  | "ACTION_REQUIRED"
  | "POSSIBLE_ISSUE"
  | "UNABLE_TO_VERIFY"
  | "SERVICE_UNAVAILABLE"
  | "BRANCH_CLOSED";

export interface DocumentItem {
  id?: string;
  documentName: string;
  requirementCategory: "MANDATORY" | "CONDITIONAL" | "OPTIONAL";
  originalRequired: "YES" | "NO" | "UNVERIFIED";
  photocopyCount: string;
  attestationRequired: boolean;
  whyNeeded: string;
  officialSourceUrl: string;
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "PENDING_REVIEW";
  isChecked?: boolean;
  isFlaggedMissing?: boolean;
  notes?: string;
}

export interface FormItem {
  formName: string;
  purpose: string;
  downloadUrl?: string;
  onlineUrl?: string;
  canCompleteBeforeVisit: boolean;
  physicalSignatureRequired: boolean;
  instructions: string;
  sourceUrl?: string;
}

export interface BranchTimingEvaluation {
  isOpen: boolean;
  isLunchBreak: boolean;
  isHoliday: boolean;
  timingSummary: string;
  counterStatus: string;
  warning?: string;
  nextOpenTime?: string;
}

export interface ReadinessEvaluation {
  overallStatus: ReadinessStatus;
  readinessScore: number; // 0 - 100
  statusTitle: string;
  statusDescription: string;
  branchEvaluation: BranchTimingEvaluation;
  documents: DocumentItem[];
  forms: FormItem[];
  remainingActions: string[];
  visitSummary: {
    serviceName: string;
    bankName: string;
    branchName: string;
    estimatedTimeMinutes: number;
    printableTimestamp: string;
    verificationCaveats: string[];
  };
}
