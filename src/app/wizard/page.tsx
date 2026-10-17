"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { ReadinessEvaluation, DocumentItem } from "@/lib/types";

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get("service") || "";

  const [step, setStep] = useState(1);
  const [banks, setBanks] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Wizard Selections
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedServiceSlug, setSelectedServiceSlug] = useState(preselectedService);

  // Dynamic Questions Answers
  const [answers, setAnswers] = useState<Record<string, any>>({
    amount: "50000",
    hasPan: "yes",
    method: "branch_counter",
    addressChanged: "no",
    hasAadhaar: "yes",
    nomineeRelation: "Spouse",
  });

  // Evaluation Report
  const [evaluation, setEvaluation] = useState<ReadinessEvaluation | null>(null);
  const [serviceId, setServiceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userNotes, setUserNotes] = useState("");

  // Load Banks & Services
  useEffect(() => {
    fetch("/api/banks")
      .then((res) => res.json())
      .then((data) => {
        if (data.banks) {
          setBanks(data.banks);
          if (data.banks.length > 0 && !selectedBankId) {
            setSelectedBankId(data.banks[0].id);
          }
        }
      })
      .catch(() => {});

    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  // Load Branches when selected bank changes
  useEffect(() => {
    if (selectedBankId) {
      fetch(`/api/branches?bankId=${selectedBankId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.branches) {
            setBranches(data.branches);
            if (data.branches.length > 0) {
              setSelectedBranchId(data.branches[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [selectedBankId]);

  // If preselected service is present, auto-select it
  useEffect(() => {
    if (preselectedService) {
      setSelectedServiceSlug(preselectedService);
      setStep(2);
    }
  }, [preselectedService]);

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/readiness/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: selectedServiceSlug,
          bankId: selectedBankId,
          branchId: selectedBranchId,
          answers,
        }),
      });

      const data = await res.json();
      if (res.ok && data.evaluation) {
        setEvaluation(data.evaluation);
        setServiceId(data.serviceId);
        setStep(4);
      }
    } catch {
      alert("Failed to evaluate readiness. Please verify network connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDocCheck = (docName: string) => {
    if (!evaluation) return;
    const updatedDocs = evaluation.documents.map((d) => {
      if (d.documentName === docName) {
        return { ...d, isChecked: !d.isChecked, isFlaggedMissing: false };
      }
      return d;
    });

    const mandatory = updatedDocs.filter((d) => d.requirementCategory === "MANDATORY");
    const checked = mandatory.filter((d) => d.isChecked).length;
    const score = Math.round((checked / (mandatory.length || 1)) * 100);

    setEvaluation({
      ...evaluation,
      documents: updatedDocs,
      readinessScore: score,
      overallStatus: score === 100 ? "READY_VERIFIED" : "ACTION_REQUIRED",
    });
  };

  const handleToggleDocMissing = (docName: string) => {
    if (!evaluation) return;
    const updatedDocs = evaluation.documents.map((d) => {
      if (d.documentName === docName) {
        return { ...d, isFlaggedMissing: !d.isFlaggedMissing, isChecked: false };
      }
      return d;
    });

    const hasMissing = updatedDocs.some((d) => d.isFlaggedMissing);

    setEvaluation({
      ...evaluation,
      documents: updatedDocs,
      overallStatus: hasMissing ? "ACTION_REQUIRED" : evaluation.overallStatus,
    });
  };

  const handleSaveTask = async () => {
    if (!evaluation) return;
    setSavingTask(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          branchId: selectedBranchId,
          status: evaluation.overallStatus,
          readinessScore: evaluation.readinessScore,
          userNotes,
          customerAnswers: answers,
          checklistItems: evaluation.documents.map((d) => ({
            documentName: d.documentName,
            requirementCategory: d.requirementCategory,
            originalRequired: d.originalRequired,
            photocopyCount: d.photocopyCount,
            isChecked: Boolean(d.isChecked),
            isFlaggedMissing: Boolean(d.isFlaggedMissing),
            notes: d.notes,
            officialSourceUrl: d.officialSourceUrl,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          router.push(`/tasks/${data.task.id}`);
        }, 1200);
      } else {
        alert(data.error || "Please log in to save your task.");
        if (res.status === 401) {
          router.push("/login");
        }
      }
    } catch {
      alert("Failed to save task.");
    } finally {
      setSavingTask(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Wizard Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18794E]"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step-by-Step Preparation</span>
          </div>
          <h1 className="text-2xl font-bold text-[#142D4E] mt-1">Service Readiness Wizard</h1>
          <p className="text-xs text-slate-500">
            Know required documents, rules, branch hours, and statutory constraints before visiting.
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? "bg-[#142D4E] text-[#B99A57] ring-2 ring-[#B99A57]"
                    : step > s
                    ? "bg-[#18794E] text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 4 && <div className={`w-6 h-0.5 ${step > s ? "bg-[#18794E]" : "bg-slate-200"}`}></div>}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Bank & Branch Selection */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-[#142D4E]">Step 1: Select Bank & Branch</h2>
            <p className="text-xs text-slate-500">Choose the banking institution and location you intend to visit.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Bank</label>
              <div className="space-y-2">
                {banks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBankId(b.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedBankId === b.id
                        ? "border-[#142D4E] bg-[#142D4E]/5 ring-1 ring-[#142D4E]"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-[#142D4E]">{b.name}</div>
                      <div className="text-[11px] text-slate-500">Helpline: {b.helplineNumber}</div>
                    </div>
                    {selectedBankId === b.id && (
                      <span className="w-5 h-5 rounded-full bg-[#142D4E] text-white flex items-center justify-center text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Branch</label>
              <div className="space-y-2">
                {branches.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    No branches configured for this bank yet.
                  </div>
                ) : (
                  branches.map((br) => (
                    <button
                      key={br.id}
                      type="button"
                      onClick={() => setSelectedBranchId(br.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        selectedBranchId === br.id
                          ? "border-[#142D4E] bg-[#142D4E]/5 ring-1 ring-[#142D4E]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-[#142D4E]">{br.name}</div>
                        <div className="text-[11px] text-slate-500">{br.city}, {br.state} — IFSC: {br.ifscCode}</div>
                        <div className="text-[10px] text-emerald-700 mt-1">
                          Hours: {br.openingTime} - {br.closingTime} (Lunch: {br.lunchStartTime} - {br.lunchEndTime})
                        </div>
                      </div>
                      {selectedBranchId === br.id && (
                        <span className="w-5 h-5 rounded-full bg-[#142D4E] text-white flex items-center justify-center text-xs">✓</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-lg bg-[#142D4E] text-white text-sm font-bold hover:bg-[#0B1F36] transition-all flex items-center gap-2"
            >
              <span>Next: Select Service</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Service Selection */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#142D4E]">Step 2: Choose Banking Service</h2>
              <p className="text-xs text-slate-500">What service do you plan to complete at the branch?</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-500 hover:text-[#142D4E] underline"
            >
              ← Back to Branch
            </button>
          </div>

          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-3">
                <h3 className="text-xs font-bold text-[#142D4E] uppercase tracking-wider">{cat.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.services.map((srv: any) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceSlug(srv.slug)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        selectedServiceSlug === srv.slug
                          ? "border-[#142D4E] bg-[#142D4E]/5 ring-2 ring-[#142D4E]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-[#142D4E]">{srv.name}</div>
                        <div className="text-xs text-slate-600 mt-1 leading-relaxed">{srv.description}</div>
                      </div>
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {srv.branchVisitRequired ? "Branch visit required" : "Online optional"}
                        </span>
                        {selectedServiceSlug === srv.slug && (
                          <span className="font-bold text-[#142D4E]">Selected ✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!selectedServiceSlug}
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-lg bg-[#142D4E] text-white text-sm font-bold hover:bg-[#0B1F36] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span>Next: Transaction Details</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Dynamic Context Questions */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#142D4E]">Step 3: Relevant Transaction Questions</h2>
              <p className="text-xs text-slate-500">
                Tailoring requirements to your specific transaction context. We NEVER ask for passwords, OTPs, or PINs.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-xs text-slate-500 hover:text-[#142D4E] underline"
            >
              ← Back to Service
            </button>
          </div>

          <div className="space-y-4 max-w-xl">
            {/* Conditional Questions for Cash Withdrawal */}
            {selectedServiceSlug.includes("withdrawal") && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Intended Withdrawal Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={answers.amount}
                    onChange={(e) => setAnswers({ ...answers, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#142D4E]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cash transactions of ₹50,000 and above trigger mandatory PAN under Rule 114B.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Do you have an original PAN Card available to carry?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="hasPan"
                        value="yes"
                        checked={answers.hasPan === "yes"}
                        onChange={() => setAnswers({ ...answers, hasPan: "yes" })}
                      />
                      <span>Yes, original PAN available</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="hasPan"
                        value="no"
                        checked={answers.hasPan === "no"}
                        onChange={() => setAnswers({ ...answers, hasPan: "no" })}
                      />
                      <span>No (Form 60 fallback required)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Counter Withdrawal Instrument
                  </label>
                  <select
                    value={answers.method}
                    onChange={(e) => setAnswers({ ...answers, method: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#142D4E]"
                  >
                    <option value="branch_counter">Withdrawal Slip + Physical Passbook</option>
                    <option value="self_cheque">Signed Self-Cheque Leaf</option>
                    <option value="third_party">Third Party Bearer Cheque</option>
                  </select>
                </div>
              </>
            )}

            {/* Questions for KYC Update */}
            {selectedServiceSlug.includes("kyc") && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Has your current residential address changed since your last KYC?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="addressChanged"
                        value="no"
                        checked={answers.addressChanged === "no"}
                        onChange={() => setAnswers({ ...answers, addressChanged: "no" })}
                      />
                      <span>No, address is identical</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="addressChanged"
                        value="yes"
                        checked={answers.addressChanged === "yes"}
                        onChange={() => setAnswers({ ...answers, addressChanged: "yes" })}
                      />
                      <span>Yes, address has changed</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Do you possess an Aadhaar card linked with your active mobile number?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="hasAadhaar"
                        value="yes"
                        checked={answers.hasAadhaar === "yes"}
                        onChange={() => setAnswers({ ...answers, hasAadhaar: "yes" })}
                      />
                      <span>Yes (Eligible for OTP e-KYC)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="hasAadhaar"
                        value="no"
                        checked={answers.hasAadhaar === "no"}
                        onChange={() => setAnswers({ ...answers, hasAadhaar: "no" })}
                      />
                      <span>No (Physical document inspection)</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Questions for Nominee */}
            {selectedServiceSlug.includes("nominee") && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relationship of the Nominee
                  </label>
                  <select
                    value={answers.nomineeRelation}
                    onChange={(e) => setAnswers({ ...answers, nomineeRelation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sibling">Brother / Sister</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Is the nominee an adult (aged 18 or above)?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="isMinor"
                        value="no"
                        defaultChecked
                        onChange={() => setAnswers({ ...answers, isMinor: false })}
                      />
                      <span>Yes, Adult (18+)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="isMinor"
                        value="yes"
                        onChange={() => setAnswers({ ...answers, isMinor: true })}
                      />
                      <span>Minor (Guardian appointment required)</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* General Check */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Are you aware of any active stop-payment or account restriction notices?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="hasRestriction"
                    value="no"
                    defaultChecked
                    onChange={() => setAnswers({ ...answers, hasRestriction: false })}
                  />
                  <span>No active restrictions known</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="hasRestriction"
                    value="yes"
                    onChange={() => setAnswers({ ...answers, hasRestriction: true })}
                  />
                  <span>Yes, received a notice</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleEvaluate}
              className="px-7 py-2.5 rounded-lg bg-[#B99A57] text-[#0B1F36] text-sm font-bold hover:bg-[#a68847] transition-all flex items-center gap-2 shadow-sm"
            >
              {loading ? "Evaluating Rules..." : "Evaluate Readiness Report"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Preparation Report & Save */}
      {step === 4 && evaluation && (
        <div className="space-y-6">
          {/* Printable Report Header */}
          <div className="printable-card bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Readiness Evaluation Report
                </div>
                <h2 className="text-2xl font-black text-[#142D4E] mt-1">
                  {evaluation.visitSummary.serviceName}
                </h2>
                <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2 items-center">
                  <span>{evaluation.visitSummary.bankName}</span>
                  <span>•</span>
                  <span>{evaluation.visitSummary.branchName}</span>
                  <span>•</span>
                  <span className="text-slate-400">Evaluated: {evaluation.visitSummary.printableTimestamp}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={evaluation.overallStatus} className="text-sm px-3.5 py-1" />
                <span className="text-xs text-slate-500 font-semibold">
                  Readiness Score: {evaluation.readinessScore}%
                </span>
              </div>
            </div>

            {/* Branch Operating Status Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              evaluation.branchEvaluation.isOpen
                ? "bg-emerald-50/70 border-emerald-200"
                : "bg-red-50/70 border-red-200"
            }`}>
              <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                evaluation.branchEvaluation.isOpen ? "bg-[#18794E]" : "bg-[#B42318]"
              }`}></div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Branch Status: {evaluation.branchEvaluation.timingSummary}</span>
                  {evaluation.branchEvaluation.isLunchBreak && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200 text-amber-900 font-bold">
                      Staggered Lunch Break
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {evaluation.branchEvaluation.warning || "Branch is operating regular counter services."}
                </p>
                <div className="text-[11px] text-slate-500">
                  Counters: {evaluation.branchEvaluation.counterStatus}
                </div>
              </div>
            </div>

            {/* Documents Required Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#142D4E]">Documents to Carry</h3>
                  <p className="text-xs text-slate-500">
                    Check the boxes as you prepare each physical document at home.
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {evaluation.documents.filter((d) => d.isChecked).length} of {evaluation.documents.length} prepared
                </span>
              </div>

              <div className="space-y-2.5">
                {evaluation.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      doc.isFlaggedMissing
                        ? "bg-red-50/40 border-red-200"
                        : doc.isChecked
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-slate-50/60 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={doc.isChecked || false}
                          onChange={() => handleToggleDocCheck(doc.documentName)}
                          className="w-4 h-4 mt-1 rounded border-slate-300 text-[#142D4E] focus:ring-[#142D4E] cursor-pointer"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{doc.documentName}</span>
                            <StatusBadge status={doc.requirementCategory} />
                            <StatusBadge status={doc.verificationStatus} />
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{doc.whyNeeded}</p>

                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                            <span>Original Required: <strong className="text-slate-700">{doc.originalRequired}</strong></span>
                            <span>Photocopy Count: <strong className="text-slate-700">{doc.photocopyCount}</strong></span>
                            <span>Self-Attestation: <strong className="text-slate-700">{doc.attestationRequired ? "Yes" : "No"}</strong></span>
                            {doc.officialSourceUrl && (
                              <a
                                href={doc.officialSourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>Official Regulatory Source ↗</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0 no-print">
                        <button
                          type="button"
                          onClick={() => handleToggleDocMissing(doc.documentName)}
                          className={`text-xs px-2.5 py-1 rounded border font-medium ${
                            doc.isFlaggedMissing
                              ? "bg-red-600 text-white border-red-600"
                              : "text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {doc.isFlaggedMissing ? "Flagged Missing" : "Flag Missing"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Forms Section */}
            {evaluation.forms.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-bold text-[#142D4E]">Official Forms & Applications</h3>
                <div className="space-y-2.5">
                  {evaluation.forms.map((form, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-sm text-[#142D4E]">{form.formName}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{form.purpose}</div>
                        <div className="text-[11px] text-slate-500 mt-1">Instructions: {form.instructions}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 no-print">
                        {form.downloadUrl && (
                          <a
                            href={form.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-[#142D4E] hover:bg-slate-100"
                          >
                            Download Form
                          </a>
                        )}
                        {form.onlineUrl && (
                          <a
                            href={form.onlineUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-[#142D4E] text-white text-xs font-bold hover:bg-[#0B1F36]"
                          >
                            Online Portal
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remaining Pre-Visit Actions */}
            {evaluation.remainingActions.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-base font-bold text-[#142D4E]">Remaining Actions Before Leaving Home</h3>
                <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-700">
                  {evaluation.remainingActions.map((action, idx) => (
                    <li key={idx} className="leading-relaxed">{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regulatory Caveats */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Verification Disclaimers:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {evaluation.visitSummary.verificationCaveats.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Bar (Print & Save Task) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-bold text-slate-700 mb-1">Add Private Notes (Optional)</label>
              <input
                type="text"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="e.g. Carry passbook from top drawer, check with teller #3"
                className="w-full sm:w-80 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Checklist</span>
              </button>

              <button
                type="button"
                disabled={savingTask || saveSuccess}
                onClick={handleSaveTask}
                className="px-6 py-2.5 rounded-lg bg-[#B99A57] text-[#0B1F36] text-xs font-bold hover:bg-[#a68847] transition-all shadow-sm flex items-center gap-2"
              >
                {saveSuccess ? (
                  <span>✓ Saved to Tasks!</span>
                ) : savingTask ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Save to My Tasks</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceReadinessWizard() {
  return (
    <React.Suspense fallback={
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-amber-600 rounded-full mx-auto mb-4" />
        <p>Loading Banking Service Readiness Wizard...</p>
      </div>
    }>
      <WizardContent />
    </React.Suspense>
  );
}
