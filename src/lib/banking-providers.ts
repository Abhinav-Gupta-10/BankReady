export interface BankAccountProvider {
  bankCode: string;
  bankName: string;
  isConfigured: boolean;
  supportedFields: string[];
  consentRequired: boolean;

  getCustomerServiceStatus(accountIdentifier: string, serviceCode: string): Promise<{
    isEligible: boolean;
    restrictionNotice?: string;
    pendingRequestsCount: number;
    providerTimestamp: string;
  }>;

  getApplicableTransactionLimits(accountIdentifier: string, channel: string): Promise<{
    dailyLimit: number;
    perTransactionLimit: number;
    currency: string;
    requiresElevationAbove: number;
    elevationMethod: string;
  }>;

  getKycStatus(accountIdentifier: string): Promise<{
    kycStatus: "VALID" | "REKYC_DUE" | "SUSPENDED" | "UNKNOWN";
    lastVerifiedDate?: string;
    nextReKycDueDate?: string;
    riskCategory: "LOW" | "MEDIUM" | "HIGH";
  }>;

  getPanLinkageStatus(accountIdentifier: string): Promise<{
    isLinked: boolean;
    maskedPan?: string;
    linkageStatus: "VERIFIED" | "PENDING_ITD_MATCH" | "NOT_LINKED";
  }>;

  getServiceRestrictions(accountIdentifier: string): Promise<{
    hasDebitFreeze: boolean;
    hasCreditFreeze: boolean;
    dormantStatus: boolean;
    holdAmount: number;
    freezeReason?: string;
  }>;
}

// Sandbox demo provider for testing authorized bank integrations
export class MockBankReadySandboxProvider implements BankAccountProvider {
  bankCode = "SBI";
  bankName = "State Bank of India (Integration Sandbox)";
  isConfigured = true;
  supportedFields = [
    "kyc_status",
    "pan_linkage",
    "transaction_limits",
    "account_freezes",
    "pending_requests",
  ];
  consentRequired = true;

  async getCustomerServiceStatus(accountIdentifier: string, serviceCode: string) {
    return {
      isEligible: true,
      pendingRequestsCount: 0,
      providerTimestamp: new Date().toISOString(),
    };
  }

  async getApplicableTransactionLimits(accountIdentifier: string, channel: string) {
    return {
      dailyLimit: 200000,
      perTransactionLimit: 50000,
      currency: "INR",
      requiresElevationAbove: 50000,
      elevationMethod: "Branch Counter Cheque / INB Profile Password",
    };
  }

  async getKycStatus(accountIdentifier: string) {
    return {
      kycStatus: "VALID" as const,
      lastVerifiedDate: "2024-03-15",
      nextReKycDueDate: "2027-03-15",
      riskCategory: "LOW" as const,
    };
  }

  async getPanLinkageStatus(accountIdentifier: string) {
    return {
      isLinked: true,
      maskedPan: "ABCDE****F",
      linkageStatus: "VERIFIED" as const,
    };
  }

  async getServiceRestrictions(accountIdentifier: string) {
    return {
      hasDebitFreeze: false,
      hasCreditFreeze: false,
      dormantStatus: false,
      holdAmount: 0,
    };
  }
}

// Registry of configured bank providers
export const bankProviders: Record<string, BankAccountProvider> = {
  SBI_SANDBOX: new MockBankReadySandboxProvider(),
};

export function getProviderForBank(bankCode: string): BankAccountProvider | null {
  // If no live provider is configured for a bank, return null so UI displays "Live account verification unavailable"
  return bankProviders[`${bankCode}_SANDBOX`] || null;
}
