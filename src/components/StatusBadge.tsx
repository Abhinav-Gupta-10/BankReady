import React from "react";
import { ReadinessStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ReadinessStatus | "MANDATORY" | "CONDITIONAL" | "OPTIONAL" | "VERIFIED" | "UNVERIFIED" | "PENDING_REVIEW" | "OPEN" | "CLOSED" | "LUNCH";
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  let badgeClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let displayLabel = label || status;
  let icon = null;

  switch (status) {
    case "READY_VERIFIED":
      badgeClasses = "bg-[#18794E]/10 text-[#18794E] border-[#18794E]/30 font-semibold";
      displayLabel = label || "Ready for Visit";
      icon = (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      );
      break;

    case "ACTION_REQUIRED":
      badgeClasses = "bg-amber-500/10 text-[#B7791F] border-amber-500/30 font-semibold";
      displayLabel = label || "Action Required";
      icon = (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
      break;

    case "POSSIBLE_ISSUE":
      badgeClasses = "bg-orange-500/10 text-orange-700 border-orange-500/30 font-semibold";
      displayLabel = label || "Possible Issue";
      icon = (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;

    case "BRANCH_CLOSED":
    case "CLOSED":
      badgeClasses = "bg-[#B42318]/10 text-[#B42318] border-[#B42318]/30 font-semibold";
      displayLabel = label || "Branch Closed";
      icon = (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;

    case "OPEN":
      badgeClasses = "bg-emerald-500/10 text-emerald-800 border-emerald-500/30 font-semibold";
      displayLabel = label || "Open Now";
      icon = (
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
      );
      break;

    case "LUNCH":
      badgeClasses = "bg-amber-100 text-amber-800 border-amber-300 font-medium";
      displayLabel = label || "Lunch Break";
      break;

    case "MANDATORY":
      badgeClasses = "bg-red-50 text-red-700 border-red-200 font-semibold";
      displayLabel = "Mandatory";
      break;

    case "CONDITIONAL":
      badgeClasses = "bg-blue-50 text-blue-700 border-blue-200 font-medium";
      displayLabel = "Conditional";
      break;

    case "OPTIONAL":
      badgeClasses = "bg-slate-100 text-slate-600 border-slate-200";
      displayLabel = "Optional";
      break;

    case "VERIFIED":
      badgeClasses = "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium";
      displayLabel = "Verified Source";
      icon = (
        <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
      break;

    case "UNVERIFIED":
      badgeClasses = "bg-amber-50 text-amber-700 border-amber-200";
      displayLabel = "Unverified";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${badgeClasses} ${className}`}
    >
      {icon}
      <span>{displayLabel}</span>
    </span>
  );
}
