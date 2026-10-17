const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("Starting BankReady database seeding...");

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.taskChecklistItem.deleteMany();
  await prisma.customerTask.deleteMany();
  await prisma.serviceRequirementRule.deleteMany();
  await prisma.branchHoliday.deleteMany();
  await prisma.bankingService.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleaned existing records.");

  // 2. Seed Banks
  const sbi = await prisma.bank.create({
    data: {
      name: "State Bank of India",
      code: "SBI",
      slug: "state-bank-of-india",
      websiteUrl: "https://sbi.co.in",
      helplineNumber: "1800 1234 / 1800 2100",
      isEnabled: true,
    },
  });

  const hdfc = await prisma.bank.create({
    data: {
      name: "HDFC Bank",
      code: "HDFC",
      slug: "hdfc-bank",
      websiteUrl: "https://www.hdfcbank.com",
      helplineNumber: "1800 202 6161",
      isEnabled: true,
    },
  });

  const icici = await prisma.bank.create({
    data: {
      name: "ICICI Bank",
      code: "ICICI",
      slug: "icici-bank",
      websiteUrl: "https://www.icicibank.com",
      helplineNumber: "1800 1080",
      isEnabled: true,
    },
  });

  const pnb = await prisma.bank.create({
    data: {
      name: "Punjab National Bank",
      code: "PNB",
      slug: "punjab-national-bank",
      websiteUrl: "https://pnbindia.in",
      helplineNumber: "1800 180 2222",
      isEnabled: true,
    },
  });

  const bob = await prisma.bank.create({
    data: {
      name: "Bank of Baroda",
      code: "BOB",
      slug: "bank-of-baroda",
      websiteUrl: "https://www.bankofbaroda.in",
      helplineNumber: "1800 5700",
      isEnabled: true,
    },
  });

  console.log("Seeded 5 major Indian banks.");

  // 3. Seed Branches
  const sbiCpBranch = await prisma.branch.create({
    data: {
      bankId: sbi.id,
      name: "Connaught Place Main Branch",
      code: "000691",
      ifscCode: "SBIN0000691",
      address: "11, Parliament Street, Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      pinCode: "110001",
      contactPhone: "011-23374100",
      email: "cp.branch@sbi.co.in",
      openingTime: "10:00",
      closingTime: "16:00",
      lunchStartTime: "14:00",
      lunchEndTime: "14:30",
      counterStatus: "All 6 counters active. Express passbook kiosk functional.",
      isClosedTemporarily: false,
      verifiedSource: "SBI Official Branch Locator",
      lastVerifiedAt: new Date(),
    },
  });

  const hdfcBandraBranch = await prisma.branch.create({
    data: {
      bankId: hdfc.id,
      name: "Bandra West Hill Road Branch",
      code: "000014",
      ifscCode: "HDFC0000014",
      address: "Shop 1-4, Ground Floor, Hill Road, Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400050",
      contactPhone: "022-61606161",
      email: "bandrawest@hdfcbank.com",
      openingTime: "09:30",
      closingTime: "15:30",
      lunchStartTime: "13:30",
      lunchEndTime: "14:00",
      counterStatus: "Staggered counter operations during lunch hours.",
      isClosedTemporarily: false,
      verifiedSource: "HDFC Branch Network Portal",
      lastVerifiedAt: new Date(),
    },
  });

  const iciciIndiranagarBranch = await prisma.branch.create({
    data: {
      bankId: icici.id,
      name: "Indiranagar 100 Feet Road Branch",
      code: "000047",
      ifscCode: "ICIC0000047",
      address: "No. 542, 100 Feet Road, HAL 2nd Stage, Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pinCode: "560038",
      contactPhone: "080-41261100",
      email: "indiranagar@icicibank.com",
      openingTime: "09:30",
      closingTime: "16:00",
      lunchStartTime: "13:30",
      lunchEndTime: "14:00",
      counterStatus: "Senior citizen priority desk active.",
      isClosedTemporarily: false,
      verifiedSource: "ICICI Branch Directory",
      lastVerifiedAt: new Date(),
    },
  });

  const pnbSaltLakeBranch = await prisma.branch.create({
    data: {
      bankId: pnb.id,
      name: "Salt Lake Sector 1 Branch",
      code: "014800",
      ifscCode: "PUNB0014800",
      address: "BF Block, Sector 1, Bidhannagar, Salt Lake City",
      city: "Kolkata",
      state: "West Bengal",
      pinCode: "700064",
      contactPhone: "033-23371900",
      email: "bo1480@pnb.co.in",
      openingTime: "10:00",
      closingTime: "16:00",
      lunchStartTime: "14:00",
      lunchEndTime: "14:30",
      counterStatus: "Cash deposit counter has temporary queue notice.",
      isClosedTemporarily: false,
      verifiedSource: "PNB Official Network",
      lastVerifiedAt: new Date(),
    },
  });

  console.log("Seeded verified branch network.");

  // 4. Seed Service Categories
  const catCash = await prisma.serviceCategory.create({
    data: {
      name: "Cash & Transactions",
      slug: "cash-transactions",
      description: "Cash withdrawal, counter deposits, large transactions, and limits.",
      iconName: "Banknote",
      displayOrder: 1,
    },
  });

  const catKyc = await prisma.serviceCategory.create({
    data: {
      name: "Account Maintenance & KYC",
      slug: "account-maintenance",
      description: "Periodic KYC, PAN linkage, phone/address update, and nominations.",
      iconName: "UserCheck",
      displayOrder: 2,
    },
  });

  const catCheque = await prisma.serviceCategory.create({
    data: {
      name: "Cheques & Banking Instruments",
      slug: "cheques-instruments",
      description: "Cheque books, stop payment, and Positive Pay System registrations.",
      iconName: "FileText",
      displayOrder: 3,
    },
  });

  const catCards = await prisma.serviceCategory.create({
    data: {
      name: "Cards & Online Banking",
      slug: "cards-digital",
      description: "Debit card issuance, PIN generation, and net banking activations.",
      iconName: "CreditCard",
      displayOrder: 4,
    },
  });

  // 5. Seed Banking Services
  const srvWithdrawal = await prisma.bankingService.create({
    data: {
      categoryId: catCash.id,
      name: "Cash Withdrawal (Up to ₹50,000)",
      slug: "cash-withdrawal",
      description: "Regular counter cash withdrawal with passbook or self-cheque.",
      isAvailableOnline: false,
      branchVisitRequired: true,
      physicalOriginalsRequired: true,
      minAmount: 100,
      maxAmount: 50000,
      officialFormName: "Cash Withdrawal Slip",
    },
  });

  const srvLargeWithdrawal = await prisma.bankingService.create({
    data: {
      categoryId: catCash.id,
      name: "Large Cash Withdrawal (₹50,000 and Above)",
      slug: "large-cash-withdrawal",
      description: "High-value cash disbursals subject to Income Tax Rule 114B (PAN or Form 60 statutory requirement).",
      isAvailableOnline: false,
      branchVisitRequired: true,
      physicalOriginalsRequired: true,
      minAmount: 50000,
      maxAmount: 10000000,
      officialFormName: "Cheque Leaf / Form 60",
      officialFormUrl: "https://incometaxindia.gov.in/forms/income-tax%20rules/103120000000007849.pdf",
    },
  });

  const srvKycUpdate = await prisma.bankingService.create({
    data: {
      categoryId: catKyc.id,
      name: "Periodic KYC Update / Re-Verification",
      slug: "kyc-update",
      description: "Customer Due Diligence (CDD) update complying with RBI Master Directions on KYC.",
      isAvailableOnline: true,
      onlinePortalUrl: "https://onlinesbi.sbi/sbijava/rekyc.html",
      officialFormName: "Customer Re-KYC Application Form",
      branchVisitRequired: true,
      physicalOriginalsRequired: true,
    },
  });

  const srvPanUpdate = await prisma.bankingService.create({
    data: {
      categoryId: catKyc.id,
      name: "PAN Card Linkage & Verification",
      slug: "pan-update",
      description: "Linking Permanent Account Number to account profile to prevent TDS deduction and account restrictions.",
      isAvailableOnline: true,
      onlinePortalUrl: "https://www.incometax.gov.in/iec/foportal/",
      officialFormName: "PAN Registration Form",
      branchVisitRequired: true,
      physicalOriginalsRequired: true,
    },
  });

  const srvNominee = await prisma.bankingService.create({
    data: {
      categoryId: catKyc.id,
      name: "Nominee Addition / Modification (Form DA-1)",
      slug: "nominee-update",
      description: "Statutory nomination for bank accounts and deposits under Section 45ZA of Banking Regulation Act.",
      isAvailableOnline: true,
      onlinePortalUrl: "https://onlinesbi.sbi",
      officialFormName: "Form DA-1 (Nomination Form)",
      branchVisitRequired: true,
      physicalOriginalsRequired: true,
    },
  });

  const srvChequeBook = await prisma.bankingService.create({
    data: {
      categoryId: catCheque.id,
      name: "Cheque Book Request & Positive Pay Setup",
      slug: "cheque-book-request",
      description: "Issuance of personalized cheque book and registration for fraud-prevention Positive Pay System.",
      isAvailableOnline: true,
      onlinePortalUrl: "https://www.npci.org.in/what-we-do/cts/positive-pay-system",
      officialFormName: "Cheque Requisition Slip",
      branchVisitRequired: false,
      physicalOriginalsRequired: false,
    },
  });

  console.log("Seeded essential banking services.");

  // 6. Seed Service Requirement Rules
  await prisma.serviceRequirementRule.createMany({
    data: [
      {
        serviceId: srvWithdrawal.id,
        documentName: "Original Bank Passbook / Cheque Leaf",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "None (for inspection)",
        attestationRequired: false,
        conditionRule: "Mandatory for withdrawal slip verification by teller.",
        officialSourceUrl: "https://rbi.org.in/Scripts/BS_ViewMasCirculardetails.aspx?id=9862",
        verificationStatus: "VERIFIED",
      },
      {
        serviceId: srvWithdrawal.id,
        documentName: "Government Photo ID (Aadhaar / Voter ID / Passport)",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "1",
        attestationRequired: true,
        conditionRule: "Required if transaction amount exceeds teller self-authorization limit.",
        officialSourceUrl: "https://rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=11566",
        verificationStatus: "VERIFIED",
      },
      {
        serviceId: srvLargeWithdrawal.id,
        documentName: "Original Permanent Account Number (PAN) Card",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "1",
        attestationRequired: true,
        conditionRule: "Mandatory under Income Tax Rule 114B for cash transactions >= ₹50,000.",
        officialSourceUrl: "https://incometaxindia.gov.in/Pages/rules/rule-114b.aspx",
        verificationStatus: "VERIFIED",
      },
      {
        serviceId: srvLargeWithdrawal.id,
        documentName: "Form 60 (If PAN not allotted)",
        requirementCategory: "CONDITIONAL",
        originalRequired: "YES",
        photocopyCount: "2 signed physical copies",
        attestationRequired: true,
        conditionRule: "Only applicable if customer does not possess PAN card.",
        officialSourceUrl: "https://incometaxindia.gov.in",
        verificationStatus: "VERIFIED",
      },
      {
        serviceId: srvKycUpdate.id,
        documentName: "Officially Valid Document (OVD) - Aadhaar / Passport / Voter ID",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "1",
        attestationRequired: true,
        conditionRule: "Section 16 of RBI Master Directions on KYC.",
        officialSourceUrl: "https://rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=11566",
        verificationStatus: "VERIFIED",
      },
      {
        serviceId: srvKycUpdate.id,
        documentName: "Recent Passport Size Photographs (2 copies)",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "2 original prints",
        attestationRequired: false,
        conditionRule: "Required to be affixed on physical Re-KYC mandate.",
        officialSourceUrl: "https://rbi.org.in",
        verificationStatus: "VERIFIED",
      },
      {
        serviceId: srvNominee.id,
        documentName: "Original Passbook or Term Deposit Receipt",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "None",
        attestationRequired: false,
        conditionRule: "Required for endorsement of official nomination registration number.",
        officialSourceUrl: "https://rbi.org.in/scripts/BS_ViewMasCirculardetails.aspx?id=9862",
        verificationStatus: "VERIFIED",
      },
      {
        serviceId: srvNominee.id,
        documentName: "Nominee Government ID Proof Copy",
        requirementCategory: "OPTIONAL",
        originalRequired: "NO",
        photocopyCount: "1",
        attestationRequired: false,
        conditionRule: "Recommended to avoid spelling discrepancies in legal heirship claim.",
        officialSourceUrl: "https://rbi.org.in",
        verificationStatus: "VERIFIED",
      },
    ],
  });

  // 7. Seed Branch Holidays
  await prisma.branchHoliday.createMany({
    data: [
      {
        holidayDate: "2026-01-26",
        name: "Republic Day",
        description: "National Gazetted Holiday (All banks closed).",
        isNational: true,
        isBankHoliday: true,
      },
      {
        holidayDate: "2026-04-01",
        name: "Annual Bank Account Closing",
        description: "Statutory annual account closing under Negotiable Instruments Act.",
        isNational: false,
        isBankHoliday: true,
      },
      {
        holidayDate: "2026-08-15",
        name: "Independence Day",
        description: "National Holiday.",
        isNational: true,
        isBankHoliday: true,
      },
      {
        holidayDate: "2026-10-02",
        name: "Mahatma Gandhi Jayanti",
        description: "National Holiday.",
        isNational: true,
        isBankHoliday: true,
      },
      {
        holidayDate: "2026-11-08",
        name: "Diwali (Deepavali)",
        description: "Gazetted Festival Holiday.",
        isNational: false,
        isBankHoliday: true,
      },
    ],
  });

  // 8. Seed Demo Users
  const customerPassword = hashPassword("Demo1234!");
  const adminPassword = hashPassword("DemoAdmin1234!");
  const employeePassword = hashPassword("DemoEmp1234!");

  const demoCustomer = await prisma.user.create({
    data: {
      email: "demo.customer@bankready.test",
      passwordHash: customerPassword,
      name: "Ramesh Sharma",
      role: "CUSTOMER",
      phone: "+91 98765 43210",
      preferredBankId: sbi.id,
      preferredBranchId: sbiCpBranch.id,
      kycSelfReported: "VERIFIED",
      panSelfReported: true,
      isVerified: true,
    },
  });

  const demoAdmin = await prisma.user.create({
    data: {
      email: "demo.admin@bankready.test",
      passwordHash: adminPassword,
      name: "Platform Administrator",
      role: "ADMIN",
      phone: "+91 98000 00001",
      isVerified: true,
    },
  });

  const demoEmployee = await prisma.user.create({
    data: {
      email: "demo.employee@bankready.test",
      passwordHash: employeePassword,
      name: "Ananya Iyer (SBI Officer)",
      role: "EMPLOYEE",
      phone: "+91 98000 00002",
      preferredBankId: sbi.id,
      preferredBranchId: sbiCpBranch.id,
      isVerified: true,
    },
  });

  console.log("Seeded demo accounts for Customer, Admin, and Employee.");

  // 9. Seed Announcements
  const announcement1 = await prisma.announcement.create({
    data: {
      bankId: sbi.id,
      branchId: sbiCpBranch.id,
      authorId: demoEmployee.id,
      title: "Senior Citizen Special KYC Assistance Counter",
      message: "Dedicated counter #4 is earmarked for senior citizen re-KYC and doorstep collection request scheduling this week.",
      sourceUrl: "https://sbi.co.in",
      verificationStatus: "VERIFIED",
      status: "PUBLISHED",
      priority: "NORMAL",
      effectiveFrom: new Date(),
    },
  });

  const announcement2 = await prisma.announcement.create({
    data: {
      bankId: sbi.id,
      authorId: demoAdmin.id,
      title: "RBI Positive Pay System Mandatory for High Value Cheques",
      message: "In accordance with RBI circulars, cheques above ₹50,000 should be registered under the Positive Pay System to prevent transit fraud.",
      sourceUrl: "https://npci.org.in",
      verificationStatus: "VERIFIED",
      status: "PUBLISHED",
      priority: "URGENT",
      effectiveFrom: new Date(),
    },
  });

  // 10. Seed Notifications for Demo Customer
  await prisma.notification.create({
    data: {
      userId: demoCustomer.id,
      announcementId: announcement1.id,
      title: "New Branch Notice: Senior Citizen KYC Desk",
      message: "SBI Connaught Place branch has opened a special assistance counter.",
      linkUrl: "/notifications",
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: demoCustomer.id,
      announcementId: announcement2.id,
      title: "Regulatory Notice: Positive Pay Cheque Verification",
      message: "Mandatory guidance for issuing high-value cheque payments.",
      linkUrl: "/notifications",
      isRead: true,
    },
  });

  // 11. Seed Pre-existing Customer Tasks for Ramesh Sharma
  const task1 = await prisma.customerTask.create({
    data: {
      userId: demoCustomer.id,
      serviceId: srvLargeWithdrawal.id,
      branchId: sbiCpBranch.id,
      status: "READY_FOR_VISIT",
      readinessScore: 100,
      userNotes: "Withdrawing cash for festival expenses. PAN card and passbook arranged.",
      customerAnswers: JSON.stringify({ amount: 65000, hasPan: "yes", method: "branch_counter" }),
    },
  });

  await prisma.taskChecklistItem.createMany({
    data: [
      {
        taskId: task1.id,
        documentName: "Original Bank Passbook / Cheque Leaf",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "None",
        isChecked: true,
        isFlaggedMissing: false,
        notes: "Located in study desk drawer.",
      },
      {
        taskId: task1.id,
        documentName: "Original Permanent Account Number (PAN) Card",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "1",
        isChecked: true,
        isFlaggedMissing: false,
        notes: "Original in wallet, photocopy self-attested.",
      },
      {
        taskId: task1.id,
        documentName: "Government Photo ID (Aadhaar / Voter ID)",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "1",
        isChecked: true,
        isFlaggedMissing: false,
      },
    ],
  });

  const task2 = await prisma.customerTask.create({
    data: {
      userId: demoCustomer.id,
      serviceId: srvNominee.id,
      branchId: sbiCpBranch.id,
      status: "ACTION_REQUIRED",
      readinessScore: 60,
      userNotes: "Need to add daughter as nominee. Awaiting her birth certificate photocopy.",
      customerAnswers: JSON.stringify({ nomineeAge: 16, nomineeRelation: "Daughter" }),
    },
  });

  await prisma.taskChecklistItem.createMany({
    data: [
      {
        taskId: task2.id,
        documentName: "Original Passbook or Term Deposit Receipt",
        requirementCategory: "MANDATORY",
        originalRequired: "YES",
        photocopyCount: "None",
        isChecked: true,
        isFlaggedMissing: false,
      },
      {
        taskId: task2.id,
        documentName: "Nominee Government ID Proof Copy",
        requirementCategory: "OPTIONAL",
        originalRequired: "NO",
        photocopyCount: "1",
        isChecked: false,
        isFlaggedMissing: true,
        notes: "Need to take printout of Aadhaar card.",
      },
    ],
  });

  console.log("Seeded demo customer tasks with live checklists.");
  console.log("BankReady Database Seeding Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
