"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0B1F36] text-slate-300 border-t border-slate-800 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#142D4E] border border-[#B99A57]/50 flex items-center justify-center text-[#B99A57] font-bold">
                B
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Bank<span className="text-[#B99A57]">Ready</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t(
                "home.heroSubtitle",
                "Verify required documents, calculate cash withdrawal thresholds under IT Rule 114B, check real-time branch hours, lunch breaks, and holidays before you step out."
              )}
            </p>
            <div className="text-xs text-[#B99A57] font-medium flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-[#18794E]"></span>
              {t("footer.tagline", "Official Indian Banking Rules Compliant")}
            </div>
          </div>

          {/* Quick Services */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              {t("footer.tools", "Preparation Tools")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/wizard" className="hover:text-white transition-colors">
                  {t("nav.wizard", "Service Readiness Wizard")}
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  {t("nav.services", "Banking Services Catalog")}
                </Link>
              </li>
              <li>
                <Link href="/branches" className="hover:text-white transition-colors">
                  {t("nav.branches", "Find a Bank Branch")}
                </Link>
              </li>
              <li>
                <Link href="/account-readiness" className="hover:text-white transition-colors">
                  {t("nav.accountCheck", "Account Readiness Check")}
                </Link>
              </li>
              <li>
                <Link href="/forms" className="hover:text-white transition-colors">
                  {t("nav.forms", "Official Bank Forms")}
                </Link>
              </li>
              <li>
                <Link href="/holidays" className="hover:text-white transition-colors">
                  {t("nav.holidays", "Bank Holiday Calendar")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Important Regulatory Citations */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              {t("footer.standards", "Regulatory Standards")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://rbi.org.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  RBI Master Directions on KYC
                </a>
              </li>
              <li>
                <a href="https://incometaxindia.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Income Tax Rule 114B (PAN Mandate)
                </a>
              </li>
              <li>
                <a href="https://rbi.org.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Banking Regulation Act (Nomination)
                </a>
              </li>
              <li>
                <a href="https://npci.org.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Positive Pay System (Cheque Fraud)
                </a>
              </li>
            </ul>
          </div>

          {/* Critical Security Warning */}
          <div>
            <div className="p-4 rounded-lg bg-[#142D4E] border border-amber-900/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B99A57]">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{t("footer.securityTitle", "Security Notice")}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {t(
                  "footer.securityDesc",
                  "BankReady will NEVER ask for your ATM PIN, Net Banking Password, UPI PIN, OTP, or Card CVV. Never share banking credentials with anyone."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer Bar & Language Selector */}
        <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="leading-relaxed text-center md:text-left max-w-3xl">
            {t(
              "footer.disclaimer",
              "Disclaimer: BankReady provides informational guidance to assist customers in preparing for banking services. Checklist completion does not guarantee transaction execution; all services are subject to physical verification and bank approval."
            )}
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <LanguageSelector variant="footer" />
            <div className="whitespace-nowrap text-slate-400">
              {t("footer.copyright", "© 2026 BankReady Platform.")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
