"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default function ServicesCatalogPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    services: cat.services.filter((s: any) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.services.length > 0);

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142D4E]">Banking Services Catalog</h1>
          <p className="text-xs text-slate-500">
            Browse verified regulatory rules, statutory forms, and required document checklists for each banking task.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services (e.g. withdrawal, kyc, nominee)..."
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#142D4E]"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          Loading banking services catalog...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No banking services match &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-[#142D4E] flex items-center gap-2">
                  <span>{cat.name}</span>
                  <span className="text-xs text-slate-400 font-normal">({cat.services.length} services)</span>
                </h2>
                <p className="text-xs text-slate-500">{cat.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.services.map((service: any) => (
                  <div
                    key={service.id}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-[#142D4E] hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {cat.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {service.branchVisitRequired ? "Branch Required" : "Digital Option"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#142D4E]">{service.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{service.description}</p>

                      {service.requirementRules && service.requirementRules.length > 0 && (
                        <div className="pt-2 space-y-1">
                          <span className="text-[11px] font-bold text-slate-700 block">Key Mandates:</span>
                          <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                            {service.requirementRules.slice(0, 2).map((r: any) => (
                              <li key={r.id}>
                                <strong>{r.documentName}</strong> ({r.requirementCategory})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {service.officialFormName && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Applicable Form:</span>
                          <span className="font-semibold text-slate-800">{service.officialFormName}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      {service.isAvailableOnline && service.onlinePortalUrl ? (
                        <a
                          href={service.onlinePortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Official Portal ↗
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">In-branch counter only</span>
                      )}

                      <Link
                        href={`/wizard?service=${service.slug}`}
                        className="px-3.5 py-1.5 rounded-lg bg-[#142D4E] hover:bg-[#0B1F36] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                      >
                        <span>Prepare</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
