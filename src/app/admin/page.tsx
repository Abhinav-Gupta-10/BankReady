"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "announcements" | "audit">("overview");

  // New Rule Form
  const [newDocName, setNewDocName] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newCategory, setNewCategory] = useState("MANDATORY");
  const [newPhotocopies, setNewPhotocopies] = useState("1");
  const [newSourceUrl, setNewSourceUrl] = useState("https://rbi.org.in");

  // Announcement Form
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementPriority, setAnnouncementPriority] = useState("NORMAL");

  const loadData = () => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) {
          setStats(data.stats);
          setRecentLogs(data.recentLogs || []);
        }
      })
      .catch(() => {});

    fetch("/api/admin/document-rules")
      .then((res) => res.json())
      .then((data) => {
        if (data.rules) setRules(data.rules);
      })
      .catch(() => {});

    fetch("/api/banks")
      .then((res) => res.json())
      .then((data) => {
        if (data.banks) setBanks(data.banks);
      })
      .catch(() => {});

    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          const allServices = data.categories.flatMap((c: any) => c.services);
          setServices(allServices);
          if (allServices.length > 0 && !newServiceId) {
            setNewServiceId(allServices[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newServiceId) return;

    try {
      const res = await fetch("/api/admin/document-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: newServiceId,
          documentName: newDocName,
          requirementCategory: newCategory,
          photocopyCount: newPhotocopies,
          officialSourceUrl: newSourceUrl,
          verificationStatus: "VERIFIED",
        }),
      });

      if (res.ok) {
        alert("Document requirement rule published successfully!");
        setNewDocName("");
        loadData();
      } else {
        alert("Failed to create rule.");
      }
    } catch {
      alert("Error submitting rule.");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementMsg) return;

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementTitle,
          message: announcementMsg,
          priority: announcementPriority,
          status: "PUBLISHED",
        }),
      });

      if (res.ok) {
        alert("Announcement broadcasted to customers!");
        setAnnouncementTitle("");
        setAnnouncementMsg("");
        loadData();
      }
    } catch {
      alert("Error publishing announcement.");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document rule?")) return;
    try {
      const res = await fetch(`/api/admin/document-rules?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRules(rules.filter((r) => r.id !== id));
      }
    } catch {
      alert("Failed to delete rule.");
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B99A57]"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Administrative Control Panel</span>
          </div>
          <h1 className="text-2xl font-bold text-[#142D4E] mt-0.5">Platform Administration</h1>
          <p className="text-xs text-slate-500">
            Maintain bank rules, verify statutory document checklists, and publish branch announcements.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "overview" ? "bg-white text-[#142D4E] shadow-sm" : "text-slate-600"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "rules" ? "bg-white text-[#142D4E] shadow-sm" : "text-slate-600"
            }`}
          >
            Document Rules ({rules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("announcements")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "announcements" ? "bg-white text-[#142D4E] shadow-sm" : "text-slate-600"
            }`}
          >
            Post Notice
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "audit" ? "bg-white text-[#142D4E] shadow-sm" : "text-slate-600"
            }`}
          >
            Audit Log
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Users</span>
              <div className="text-2xl font-black text-[#142D4E]">{stats?.customersCount ?? "..."}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Banks</span>
              <div className="text-2xl font-black text-[#142D4E]">{stats?.banksCount ?? "..."}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Branches</span>
              <div className="text-2xl font-black text-[#142D4E]">{stats?.branchesCount ?? "..."}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Banking Services</span>
              <div className="text-2xl font-black text-[#142D4E]">{stats?.servicesCount ?? "..."}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Verified Rules</span>
              <div className="text-2xl font-black text-[#18794E]">{stats?.rulesCount ?? "..."}</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Tasks</span>
              <div className="text-2xl font-black text-[#142D4E]">{stats?.activeTasksCount ?? "..."}</div>
            </div>
          </div>

          {/* Quick Bank Summary Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#142D4E]">Configured Banking Institutions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Bank Name</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Helpline</th>
                    <th className="py-2.5 px-3">Official Portal</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {banks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-[#142D4E]">{b.name}</td>
                      <td className="py-3 px-3 font-mono font-semibold">{b.code}</td>
                      <td className="py-3 px-3 text-slate-600">{b.helplineNumber}</td>
                      <td className="py-3 px-3">
                        <a href={b.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {b.websiteUrl}
                        </a>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RULES MANAGEMENT TAB */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {/* Add Rule Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#142D4E]">Publish New Document Requirement Rule</h2>
            <form onSubmit={handleCreateRule} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banking Service</label>
                <select
                  value={newServiceId}
                  onChange={(e) => setNewServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Name</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Registered Rent Agreement (< 2 months)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Requirement Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                >
                  <option value="MANDATORY">MANDATORY</option>
                  <option value="CONDITIONAL">CONDITIONAL</option>
                  <option value="OPTIONAL">OPTIONAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Photocopy Count</label>
                <input
                  type="text"
                  value={newPhotocopies}
                  onChange={(e) => setNewPhotocopies(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Regulatory Citation URL</label>
                <input
                  type="url"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#142D4E] hover:bg-[#0B1F36] text-white text-xs font-bold transition-all shadow-sm"
                >
                  Publish Rule
                </button>
              </div>
            </form>
          </div>

          {/* Rules Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#142D4E]">Published Service Document Rules</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Document</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Photocopies</th>
                    <th className="py-2.5 px-3">Version</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-[#142D4E]">{r.service.name}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{r.documentName}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={r.requirementCategory} />
                      </td>
                      <td className="py-3 px-3 text-slate-600">{r.photocopyCount}</td>
                      <td className="py-3 px-3 text-slate-500">v{r.version}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(r.id)}
                          className="text-red-600 hover:underline font-bold text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === "announcements" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-[#142D4E]">Broadcast Branch Announcement</h2>
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Title</label>
              <input
                type="text"
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g. Special Aadhaar-PAN Linkage Desk Open This Saturday"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message Content</label>
              <textarea
                rows={4}
                required
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                placeholder="Details of the announcement for customers..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-[#B99A57] text-[#0B1F36] text-xs font-bold hover:bg-[#a68847] transition-all shadow-sm"
            >
              Broadcast Notice
            </button>
          </form>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === "audit" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#142D4E]">System Audit Trail</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#142D4E]">{log.action}</div>
                  <div className="text-slate-600">{log.details}</div>
                  <div className="text-[10px] text-slate-400">
                    User: {log.user?.email || "System"} ({log.user?.role || "AUTO"})
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
