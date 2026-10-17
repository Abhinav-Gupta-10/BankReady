"use client";

import React, { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";

export default function EmployeePortalPage() {
  const [employee, setEmployee] = useState<any>(null);
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Editable Branch State
  const [counterStatus, setCounterStatus] = useState("");
  const [lunchStart, setLunchStart] = useState("");
  const [lunchEnd, setLunchEnd] = useState("");
  const [isClosedTemporarily, setIsClosedTemporarily] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  const [updating, setUpdating] = useState(false);

  // Announcement State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [postingNotice, setPostingNotice] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setEmployee(data.user);
          if (data.user.preferredBranchId) {
            fetch(`/api/branches?id=${data.user.preferredBranchId}`)
              .then((r) => r.json())
              .then((bData) => {
                const b = bData.branches?.find((br: any) => br.id === data.user.preferredBranchId) || bData.branches?.[0];
                if (b) {
                  setBranch(b);
                  setCounterStatus(b.counterStatus || "");
                  setLunchStart(b.lunchStartTime || "14:00");
                  setLunchEnd(b.lunchEndTime || "14:30");
                  setIsClosedTemporarily(b.isClosedTemporarily || false);
                  setClosureReason(b.temporaryClosureReason || "");
                }
              });
          } else {
            // fallback to first branch
            fetch("/api/branches")
              .then((r) => r.json())
              .then((bData) => {
                if (bData.branches?.[0]) {
                  const b = bData.branches[0];
                  setBranch(b);
                  setCounterStatus(b.counterStatus || "");
                  setLunchStart(b.lunchStartTime || "14:00");
                  setLunchEnd(b.lunchEndTime || "14:30");
                  setIsClosedTemporarily(b.isClosedTemporarily || false);
                  setClosureReason(b.temporaryClosureReason || "");
                }
              });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateBranchStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) return;
    setUpdating(true);

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...branch,
          counterStatus,
          lunchStartTime: lunchStart,
          lunchEndTime: lunchEnd,
          isClosedTemporarily,
          temporaryClosureReason: closureReason,
        }),
      });

      if (res.ok) {
        alert("Branch status & counter operational status updated successfully!");
      } else {
        alert("Failed to update branch status.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeMsg || !branch) return;
    setPostingNotice(true);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankId: branch.bankId,
          branchId: branch.id,
          title: noticeTitle,
          message: noticeMsg,
          priority: "NORMAL",
          status: "PUBLISHED",
        }),
      });

      if (res.ok) {
        alert("Branch notice published for visiting customers!");
        setNoticeTitle("");
        setNoticeMsg("");
      } else {
        alert("Failed to post notice.");
      }
    } catch {
      alert("Error posting notice.");
    } finally {
      setPostingNotice(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading branch officer portal...</div>;
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branch Officer Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-[#142D4E] mt-0.5">
            {branch ? `${branch.bank.name} — ${branch.name}` : "Branch Management"}
          </h1>
          <p className="text-xs text-slate-500">
            Officer: <strong>{employee?.name}</strong> • Branch IFSC: <strong>{branch?.ifscCode}</strong>
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
          Authorized Officer
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branch Operations & Counter Status Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-[#142D4E]">Live Counter & Operating Status</h2>
            <p className="text-xs text-slate-500">Updates customer-facing alerts immediately.</p>
          </div>

          <form onSubmit={handleUpdateBranchStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Counter Status Notice</label>
              <input
                type="text"
                value={counterStatus}
                onChange={(e) => setCounterStatus(e.target.value)}
                placeholder="e.g. Counter 3 & 4 open for cash. Passbook printer working."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#142D4E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lunch Break Start</label>
                <input
                  type="text"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  placeholder="14:00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lunch Break End</label>
                <input
                  type="text"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                  placeholder="14:30"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isClosedTemporarily}
                  onChange={(e) => setIsClosedTemporarily(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span>Declare Temporary Emergency Branch Closure</span>
              </label>

              {isClosedTemporarily && (
                <input
                  type="text"
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="Reason (e.g. Local flooding, severe power maintenance, IT system upgrade)..."
                  className="w-full px-3 py-1.5 rounded-lg border border-red-300 text-xs"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#0B1F36] text-white text-xs font-bold transition-all shadow-sm"
            >
              {updating ? "Publishing Update..." : "Publish Branch Status"}
            </button>
          </form>
        </div>

        {/* Post Branch Bulletin */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-base font-bold text-[#142D4E]">Publish Branch Customer Notice</h2>
            <p className="text-xs text-slate-500">Notifies customers visiting this branch.</p>
          </div>

          <form onSubmit={handlePostNotice} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notice Headline</label>
              <input
                type="text"
                required
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="e.g. Special Senior Citizen Re-KYC Desk Open Today"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#142D4E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Details</label>
              <textarea
                rows={5}
                required
                value={noticeMsg}
                onChange={(e) => setNoticeMsg(e.target.value)}
                placeholder="Enter instructions, eligible counters, or relevant timings..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={postingNotice}
              className="w-full py-2.5 rounded-lg bg-[#B99A57] text-[#0B1F36] text-xs font-bold hover:bg-[#a68847] transition-all shadow-sm"
            >
              {postingNotice ? "Broadcasting..." : "Broadcast Notice to Customers"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
