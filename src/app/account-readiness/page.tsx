"use client";

import React, { useState } from "react";
import StatusBadge from "@/components/StatusBadge";

export default function AccountReadinessPage() {
  const [mode, setMode] = useState<"CUSTOMER_REPORTED" | "INTEGRATION_SANDBOX">("CUSTOMER_REPORTED");
  const [bankCode, setBankCode] = useState("SBI");
  const [accountNumber, setAccountNumber] = useState("XXXX-5821");
  const [requestedAmount, setRequestedAmount] = useState(50000);

  // Mode A Inputs
  const [reportedKyc, setReportedKyc] = useState("VERIFIED");
  const [reportedPanLinked, setReportedPanLinked] = useState(true);
  const [reportedHasRestriction, setReportedHasRestriction] = useState(false);
  const [reportedRestrictionDetails, setReportedRestrictionDetails] = useState("");

  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const handleRunCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/account-readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          bankCode,
          accountNumber,
          requestedAmount: Number(requestedAmount),
          reportedKyc,
          reportedPanLinked,
          reportedHasRestriction,
          reportedRestrictionDetails,
        }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setEvaluation(data.result);
      }
    } catch {
      alert("Evaluation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D4E]">Account Readiness Evaluation</h1>
        <p className="text-xs text-slate-500">
          Pre-screen for account restrictions, withdrawal limits, and KYC compliance before visiting your bank branch.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-xl max-w-md">
        <button
          type="button"
          onClick={() => { setMode("CUSTOMER_REPORTED"); setEvaluation(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === "CUSTOMER_REPORTED"
              ? "bg-white text-[#142D4E] shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Mode A: Customer Reported
        </button>

        <button
          type="button"
          onClick={() => { setMode("INTEGRATION_SANDBOX"); setEvaluation(null); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === "INTEGRATION_SANDBOX"
              ? "bg-white text-[#142D4E] shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Mode B: Bank Provider Sandbox
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#142D4E]">
              {mode === "CUSTOMER_REPORTED"
                ? "Self-Reported Banking Profile Assessment"
                : "Open Banking Integration Sandbox Feed"}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "CUSTOMER_REPORTED"
                ? "Enter what you believe to be your current account and KYC status."
                : "Simulates verified core banking API integration checks for participating banks."}
            </p>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {mode === "CUSTOMER_REPORTED" ? "Self-Reported" : "Sandbox Test"}
          </span>
        </div>

        <form onSubmit={handleRunCheck} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bank</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#142D4E]"
              >
                <option value="SBI">State Bank of India (Sandbox Configured)</option>
                <option value="HDFC">HDFC Bank (Integration Pending)</option>
                <option value="ICICI">ICICI Bank (Integration Pending)</option>
                <option value="PNB">Punjab National Bank (Integration Pending)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Mask / Ref</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. XXXX-5821"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#142D4E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Intended Transaction Amount (₹)</label>
              <input
                type="number"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#142D4E]"
              />
            </div>
          </div>

          {mode === "CUSTOMER_REPORTED" ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Customer-Reported Status Facts</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your KYC Status</label>
                  <select
                    value={reportedKyc}
                    onChange={(e) => setReportedKyc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="VERIFIED">I believe KYC is fully verified & up to date</option>
                    <option value="PENDING">I received a notice / re-KYC due</option>
                    <option value="UNKNOWN">I am unsure of my KYC status</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Linked to Account</label>
                  <select
                    value={reportedPanLinked ? "yes" : "no"}
                    onChange={(e) => setReportedPanLinked(e.target.value === "yes")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="yes">Yes, PAN is linked</option>
                    <option value="no">No, PAN is not linked / no PAN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportedHasRestriction}
                    onChange={(e) => setReportedHasRestriction(e.target.checked)}
                    className="rounded border-slate-300 text-[#142D4E]"
                  />
                  <span>I have received an account hold, dormant account, or restriction notice from the bank</span>
                </label>

                {reportedHasRestriction && (
                  <input
                    type="text"
                    value={reportedRestrictionDetails}
                    onChange={(e) => setReportedRestrictionDetails(e.target.value)}
                    placeholder="Describe restriction (e.g. dormant for 2 years, signature mismatch notice)..."
                    className="w-full mt-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <span className="font-bold block">Participating Bank Sandbox Integration:</span>
              <p className="leading-relaxed">
                Connects through mockable provider interfaces (`getCustomerServiceStatus`, `getApplicableTransactionLimits`, `getKycStatus`, `getPanLinkageStatus`, `getServiceRestrictions`).
                If a live integration is unavailable for the selected bank, the system will fall back to customer-reported checks.
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#0B1F36] text-white text-xs font-bold transition-all shadow-sm"
            >
              {loading ? "Analyzing Status..." : "Run Readiness Evaluation"}
            </button>
          </div>
        </form>

        {/* Evaluation Output */}
        {evaluation && (
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#142D4E]">Evaluation Results</h3>
                <span className="text-[11px] text-slate-500">
                  Mode: <strong className="text-slate-700">{evaluation.mode}</strong>
                </span>
              </div>
              <StatusBadge status={evaluation.overallStatus} />
            </div>

            <div className="space-y-3">
              {evaluation.checks.map((check: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800">{check.title}</div>
                    <div className="text-xs font-semibold text-slate-900">{check.value}</div>
                    <div className="text-[10px] text-slate-500">Source: {check.source}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    check.status === "PASS"
                      ? "bg-emerald-100 text-emerald-800"
                      : check.status === "WARN"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {check.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Notice:</strong> {evaluation.disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
