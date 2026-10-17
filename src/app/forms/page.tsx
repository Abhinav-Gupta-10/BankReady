import React from "react";
import Link from "next/link";

export default function FormsDirectoryPage() {
  const forms = [
    {
      formName: "Form 60 (Income Tax Declaration)",
      code: "ITD-F60",
      purpose: "Declaration to be filed by an individual or a person (not being a company or firm) who does not have a permanent account number and who enters into any transaction specified in Rule 114B (cash withdrawals >= ₹50,000).",
      downloadUrl: "https://incometaxindia.gov.in/forms/income-tax%20rules/103120000000007849.pdf",
      onlineUrl: null,
      branchVerificationRequired: true,
      physicalSignatureRequired: true,
      supportingDocs: "Copy of Officially Valid Document (OVD) showing identity and address.",
      instructions: "Fill two physical copies in capital letters. Attach one self-attested identity proof photocopy.",
      authority: "Income Tax Department, Ministry of Finance",
    },
    {
      formName: "Form DA-1 (Nomination Form)",
      code: "BR-DA1",
      purpose: "Statutory nomination of a person under Section 45ZA of the Banking Regulation Act, 1949 and Rule 2(1) of Banking Companies (Nomination) Rules, 1985.",
      downloadUrl: "https://bankready.test/forms/form-da1-nomination.pdf",
      onlineUrl: "https://onlinesbi.sbi",
      branchVerificationRequired: true,
      physicalSignatureRequired: true,
      supportingDocs: "Passbook or FD Receipt; Nominee identity proof copy.",
      instructions: "Provide exact legal name of nominee, date of birth, address, and appoint a guardian if nominee is minor (under 18 years).",
      authority: "Reserve Bank of India (RBI)",
    },
    {
      formName: "Periodic Re-KYC Update Mandate",
      code: "RBI-KYC-01",
      purpose: "Customer Due Diligence (CDD) periodic information update complying with Section 38 of RBI Master Directions on KYC.",
      downloadUrl: "https://bankready.test/forms/rekyc-standard.pdf",
      onlineUrl: "https://onlinesbi.sbi/sbijava/rekyc.html",
      branchVerificationRequired: false,
      physicalSignatureRequired: true,
      supportingDocs: "OVD (Aadhaar, Passport, Voter ID), 2 passport photos, and address proof if changed.",
      instructions: "Can be submitted via online portal or Net Banking if there is no change in KYC status. Branch visit only required if documents require biometric authentication.",
      authority: "Reserve Bank of India (RBI)",
    },
    {
      formName: "Cheque Requisition & Positive Pay Mandate",
      code: "CTS-PPS-01",
      purpose: "Requisition slip for issuing personalized cheque book and enrolling high-value cheques in Positive Pay System.",
      downloadUrl: null,
      onlineUrl: "https://www.npci.org.in/what-we-do/cts/positive-pay-system",
      branchVerificationRequired: false,
      physicalSignatureRequired: false,
      supportingDocs: "Existing account passbook or debit card validation.",
      instructions: "Cheques issued above ₹50,000 can be submitted electronically to the bank via mobile app or SMS before delivering to payee.",
      authority: "National Payments Corporation of India (NPCI) & RBI",
    },
    {
      formName: "Form 15G / Form 15H (TDS Exemption)",
      code: "ITD-15G",
      purpose: "Declaration under section 197A(1), 197A(1A) and 197A(1C) by an individual claiming certain incomes without deduction of tax (Fixed Deposit Interest).",
      downloadUrl: "https://incometaxindia.gov.in/forms/income-tax%20rules/103120000000007850.pdf",
      onlineUrl: "https://www.incometax.gov.in",
      branchVerificationRequired: false,
      physicalSignatureRequired: true,
      supportingDocs: "Valid PAN card original and deposit account numbers.",
      instructions: "Form 15G is for individuals below 60 years; Form 15H is for Senior Citizens (60+). Can be submitted via Internet Banking at the start of every financial year.",
      authority: "Income Tax Department",
    },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D4E]">Official Bank Forms & Online Services</h1>
        <p className="text-xs text-slate-500">
          Verified statutory forms, pre-visit instructions, and official online banking links.
        </p>
      </div>

      <div className="space-y-4">
        {forms.map((form, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{form.authority}</span>
                <h3 className="text-base font-bold text-[#142D4E] mt-0.5">{form.formName}</h3>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  form.branchVerificationRequired
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}>
                  {form.branchVerificationRequired ? "Branch Verification Required" : "Online Eligible"}
                </span>

                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                  {form.physicalSignatureRequired ? "Physical Signature Needed" : "Digital OTP Eligible"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{form.purpose}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-700 block text-[11px]">Supporting Documents Required:</span>
                <span className="text-slate-600">{form.supportingDocs}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block text-[11px]">Pre-Visit Preparation:</span>
                <span className="text-slate-600">{form.instructions}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">Standard Form Code: {form.code}</span>

              <div className="flex items-center gap-3">
                {form.downloadUrl ? (
                  <a
                    href={form.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Download Official PDF ↗
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No physical download needed</span>
                )}

                {form.onlineUrl ? (
                  <a
                    href={form.onlineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-[#142D4E] hover:bg-[#0B1F36] text-white text-xs font-bold transition-colors"
                  >
                    Open Online Portal ↗
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">In-branch only</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
