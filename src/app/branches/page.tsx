"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [preferredId, setPreferredId] = useState<string | null>(null);

  // Fetch banks
  useEffect(() => {
    fetch("/api/banks")
      .then((res) => res.json())
      .then((data) => {
        if (data.banks) setBanks(data.banks);
      })
      .catch(() => {});

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.preferredBranchId) {
          setPreferredId(data.user.preferredBranchId);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch branches with filters
  const fetchBranches = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedBankId) params.append("bankId", selectedBankId);
    if (cityFilter) params.append("city", cityFilter);
    if (searchQuery) params.append("q", searchQuery);

    fetch(`/api/branches?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.branches) setBranches(data.branches);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBranches();
  }, [selectedBankId, cityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBranches();
  };

  const handleSetPreferred = (branchId: string) => {
    setPreferredId(branchId);
    alert("Preferred branch updated for your session!");
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D4E]">Bank & Branch Directory</h1>
        <p className="text-xs text-slate-500">
          Find verified branch opening hours, lunch counters, IFSC codes, and contact details.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by Bank</label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#142D4E]"
            >
              <option value="">All Banks</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by City</label>
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="e.g. New Delhi, Mumbai, Bengaluru"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#142D4E]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Search Keywords</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Branch name, IFSC, PIN code..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#142D4E]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#142D4E] hover:bg-[#0B1F36] text-white text-xs font-bold transition-all shadow-sm"
            >
              Search Branches
            </button>
          </div>
        </form>
      </div>

      {/* Branches List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          Loading branch directory...
        </div>
      ) : branches.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700 text-sm">No branches found matching your search criteria.</p>
          <p>Try clearing filters or search for major metropolitan cities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {branches.map((b) => {
            const isPreferred = preferredId === b.id;

            return (
              <div
                key={b.id}
                className={`bg-white p-6 rounded-2xl border transition-all shadow-sm flex flex-col justify-between ${
                  isPreferred ? "border-[#B99A57] ring-1 ring-[#B99A57]" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        {b.bank.name}
                      </span>
                      <h3 className="text-base font-bold text-[#142D4E] mt-0.5">{b.name}</h3>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        b.liveStatus.isOpen
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}>
                        {b.liveStatus.statusLabel}
                      </span>
                      {isPreferred && (
                        <span className="text-[10px] bg-[#B99A57] text-[#0B1F36] px-1.5 py-0.2 rounded font-bold">
                          Preferred Branch ★
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{b.address}, {b.city}, {b.state} - {b.pinCode}</span>
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <span>IFSC: <strong className="text-slate-800 font-mono">{b.ifscCode}</strong></span>
                      <span>Phone: <strong className="text-slate-800">{b.contactPhone}</strong></span>
                    </div>
                  </div>

                  {/* Timings & Lunch Counter Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Operating Hours:</span>
                      <span>{b.openingTime} - {b.closingTime} (Mon-Sat*)</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Lunch Window:</span>
                      <span>{b.lunchStartTime} - {b.lunchEndTime} ({b.counterStatus})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      *Closed on Sundays and 2nd/4th Saturdays as per RBI Negotiable Instruments Act.
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Source: {b.verifiedSource}</span>
                    <span>Verified: {new Date(b.lastVerifiedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleSetPreferred(b.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-[#142D4E]"
                  >
                    {isPreferred ? "Selected as Preferred" : "Set as Preferred"}
                  </button>

                  <Link
                    href={`/wizard?branch=${b.id}`}
                    className="px-4 py-2 rounded-lg bg-[#142D4E] hover:bg-[#0B1F36] text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Prepare Visit Here →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
