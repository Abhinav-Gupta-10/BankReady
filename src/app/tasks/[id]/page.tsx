"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userNotes, setUserNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetch(`/api/tasks/${taskId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.task) {
            setTask(data.task);
            setUserNotes(data.task.userNotes || "");
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [taskId]);

  const handleToggleItem = async (itemId: string, field: "isChecked" | "isFlaggedMissing") => {
    if (!task) return;

    const currentItem = task.checklistItems.find((i: any) => i.id === itemId);
    if (!currentItem) return;

    const payload: any = {};
    if (field === "isChecked") {
      payload.isChecked = !currentItem.isChecked;
      payload.isFlaggedMissing = false;
    } else {
      payload.isFlaggedMissing = !currentItem.isFlaggedMissing;
      payload.isChecked = false;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setTask({
          ...task,
          status: data.taskStatus,
          readinessScore: data.readinessScore,
          checklistItems: task.checklistItems.map((item: any) =>
            item.id === itemId ? data.item : item
          ),
        });
      }
    } catch {
      alert("Failed to update item.");
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userNotes }),
      });
      if (res.ok) {
        alert("Personal notes saved.");
      }
    } catch {
      alert("Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/tasks");
      }
    } catch {
      alert("Failed to delete task.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 text-center text-xs text-slate-500">
        Loading task checklist...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Task Not Found</h2>
        <Link href="/tasks" className="text-xs text-[#142D4E] underline font-bold">
          ← Return to Saved Tasks
        </Link>
      </div>
    );
  }

  const mandatoryItems = task.checklistItems.filter((i: any) => i.requirementCategory === "MANDATORY");
  const checkedMandatory = mandatoryItems.filter((i: any) => i.isChecked).length;
  const missingItems = task.checklistItems.filter((i: any) => i.isFlaggedMissing);

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/tasks"
          className="text-xs font-bold text-[#142D4E] hover:text-[#B99A57] flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to All Tasks</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Visit Summary</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteTask}
            className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            Delete Task
          </button>
        </div>
      </div>

      {/* Printable Task Card */}
      <div className="printable-card bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Banking Task Checklist</span>
            <h1 className="text-2xl font-black text-[#142D4E] mt-1">{task.service.name}</h1>
            <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2 items-center">
              <span>{task.branch?.bank?.name || "Bank"}</span>
              <span>•</span>
              <span>{task.branch?.name || "Main Branch"}</span>
              <span>•</span>
              <span>IFSC: {task.branch?.ifscCode || "N/A"}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={task.status} className="text-sm px-3.5 py-1" />
            <span className="text-xs text-slate-600 font-bold">
              Readiness: {task.readinessScore}%
            </span>
          </div>
        </div>

        {/* Progress Overview Bar */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Mandatory Document Preparation</span>
            <span>{checkedMandatory} of {mandatoryItems.length} Marked Ready</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-[#18794E] transition-all"
              style={{ width: `${Math.round((checkedMandatory / (mandatoryItems.length || 1)) * 100)}%` }}
            ></div>
          </div>
          {missingItems.length > 0 && (
            <p className="text-[11px] text-red-600 font-semibold pt-1">
              ⚠️ Attention: You have marked {missingItems.length} document(s) as currently missing. Arrange them before visiting.
            </p>
          )}
        </div>

        {/* Checklist Rows */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#142D4E] uppercase tracking-wider">Document Checklist</h2>

          <div className="space-y-3">
            {task.checklistItems.map((item: any) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.isFlaggedMissing
                    ? "bg-red-50/50 border-red-200"
                    : item.isChecked
                    ? "bg-emerald-50/40 border-emerald-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={() => handleToggleItem(item.id, "isChecked")}
                      className="w-4 h-4 mt-1 rounded border-slate-300 text-[#142D4E] focus:ring-[#142D4E] cursor-pointer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${item.isChecked ? "line-through text-slate-500" : "text-slate-900"}`}>
                          {item.documentName}
                        </span>
                        <StatusBadge status={item.requirementCategory} />
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Original: <strong className="text-slate-700">{item.originalRequired}</strong></span>
                        <span>Photocopy Count: <strong className="text-slate-700">{item.photocopyCount}</strong></span>
                        {item.officialSourceUrl && (
                          <a
                            href={item.officialSourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Official Regulatory Policy ↗
                          </a>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-600 italic pt-1">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 no-print">
                    <button
                      type="button"
                      onClick={() => handleToggleItem(item.id, "isFlaggedMissing")}
                      className={`text-xs px-2 py-0.5 rounded border font-medium ${
                        item.isFlaggedMissing
                          ? "bg-red-600 text-white border-red-600"
                          : "text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {item.isFlaggedMissing ? "Missing" : "Flag Missing"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Private Customer Notes */}
        <div className="space-y-2 pt-2 no-print">
          <label className="block text-xs font-bold text-[#142D4E]">Personal Visit Notes</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="e.g. Carry ₹200 for passbook duplicate fee, check with counter #2"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
            <button
              type="button"
              disabled={savingNotes}
              onClick={handleSaveNotes}
              className="px-4 py-2 rounded-lg bg-[#142D4E] text-white text-xs font-bold hover:bg-[#0B1F36]"
            >
              {savingNotes ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>

        {/* Official Disclaimers */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
          <span className="font-bold text-slate-700 block">BankReady Transparency Notice:</span>
          <p>
            Checking a box indicates you have marked the document as available at home. It does not certify that the document has been physically validated or accepted by branch officers. Always carry original credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
