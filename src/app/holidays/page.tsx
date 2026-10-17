"use client";

import React, { useState, useEffect } from "react";

export default function BankHolidaysPage() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/holidays")
      .then((res) => res.json())
      .then((data) => {
        if (data.holidays) setHolidays(data.holidays);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D4E]">Bank Holidays & Operating Calendar</h1>
        <p className="text-xs text-slate-500">
          Scheduled gazetted bank holidays, 2nd & 4th Saturday closures, and exceptional branch operating hours under the Negotiable Instruments Act.
        </p>
      </div>

      {/* Statutory Rule Explainer Banner */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
        <span className="font-bold block">Reserve Bank of India Weekend Closure Mandate:</span>
        <p className="leading-relaxed">
          All commercial banks in India (public and private sector) are <strong>closed on Sundays</strong> and on the <strong>2nd and 4th Saturdays</strong> of every month. Banks remain open for customer service on the <strong>1st, 3rd, and 5th Saturdays</strong> (subject to state festival declarations).
        </p>
      </div>

      {/* Holidays List */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#142D4E]">Scheduled Bank Holidays (2026)</h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading holiday calendar...</div>
        ) : holidays.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No scheduled holidays found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {holidays.map((h) => (
              <div key={h.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#142D4E]/5 border border-[#142D4E]/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-[#142D4E]">
                      {new Date(h.holidayDate).toLocaleString("default", { month: "short" })}
                    </span>
                    <span className="text-lg font-black text-[#142D4E]">
                      {new Date(h.holidayDate).getDate()}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{h.name}</h3>
                      {h.isNational && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          National Holiday
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {h.state ? `State: ${h.state}` : "All India Commercial Banks"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{h.description || "All public and private sector branches closed."}</p>
                  </div>
                </div>

                <div className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  Branches Closed
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
