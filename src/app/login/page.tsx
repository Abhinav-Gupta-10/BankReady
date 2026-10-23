"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("val.loginFailed", "Login failed."));
        setLoading(false);
        return;
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "EMPLOYEE") {
        router.push("/employee");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError(t("val.networkError", "An unexpected network error occurred."));
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleResetData = async () => {
    setSeedStatus(t("val.dbResetting", "Resetting demo database..."));
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSeedStatus(t("val.dbRefreshed", "Database refreshed with clean demo data!"));
      } else {
        setSeedStatus("Seed error: " + (data.error || "Unknown"));
      }
    } catch {
      setSeedStatus("Failed to contact seed endpoint.");
    }
    setTimeout(() => setSeedStatus(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#142D4E] border border-[#B99A57]/50 flex items-center justify-center text-[#B99A57] font-bold text-lg">
            B
          </div>
          <span className="text-2xl font-bold text-[#142D4E]">
            Bank<span className="text-[#B99A57]">Ready</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900">{t("login.title", "Sign In to BankReady")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t("login.subtitle", "Access your pre-visit checklists, saved tasks, and branch alerts")}
        </p>
      </div>

      {/* Demo Credentials Box */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-[#142D4E] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#18794E]"></span>
            {t("login.demoHeading", "Test Demo Accounts")}
          </span>
          <button
            type="button"
            onClick={handleResetData}
            className="text-[11px] text-slate-500 hover:text-[#142D4E] underline"
            title="Reset database to original demo records"
          >
            {t("btn.resetDemo", "Reset Demo Data")}
          </button>
        </div>

        {seedStatus && (
          <div className="mb-2 p-2 rounded bg-emerald-50 text-emerald-800 text-xs font-medium text-center">
            {seedStatus}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials("demo.customer@bankready.test", "Demo1234!")}
            className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
          >
            <div className="text-[11px] font-bold text-[#142D4E]">Customer</div>
            <div className="text-[10px] text-slate-500 truncate">Ramesh Sharma</div>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials("demo.admin@bankready.test", "DemoAdmin1234!")}
            className="p-2 rounded bg-amber-50/60 hover:bg-amber-100/60 border border-amber-200 text-left transition-colors"
          >
            <div className="text-[11px] font-bold text-amber-900">Admin</div>
            <div className="text-[10px] text-slate-500 truncate">Platform Lead</div>
          </button>

          <button
            type="button"
            onClick={() => fillCredentials("demo.employee@bankready.test", "DemoEmp1234!")}
            className="p-2 rounded bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200 text-left transition-colors"
          >
            <div className="text-[11px] font-bold text-blue-900">Employee</div>
            <div className="text-[10px] text-slate-500 truncate">SBI Officer</div>
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("label.email", "Email Address")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t("label.password", "Password")}
              </label>
              <span className="text-[11px] text-slate-500">
                {t("label.passwordPlaceholder", "Min 8 characters")}
              </span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#0B1F36] text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>{t("btn.loggingIn", "Signing in...")}</span>
            ) : (
              <>
                <span>{t("btn.login", "Sign In")}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            {t("login.noAccount", "Don't have an account?")}{" "}
            <Link href="/register" className="font-semibold text-[#142D4E] hover:underline">
              {t("nav.createAccount", "Create an Account")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
