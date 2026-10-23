"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotRegistered(false);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(t("val.requiredField", "Please enter your email address."));
      return;
    }

    if (!password) {
      setError(t("val.requiredField", "Please enter your password."));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.notRegistered) {
          setNotRegistered(true);
          setError(
            data.error ||
              t(
                "val.accountNotFound",
                "No account found with this email. Please create an account first."
              )
          );
        } else if (data.wrongPassword) {
          setError(
            data.error ||
              t(
                "val.incorrectPassword",
                "Incorrect password. Please verify and try again."
              )
          );
        } else {
          setError(data.error || t("val.loginFailed", "Login failed. Please check your credentials."));
        }
        setLoading(false);
        return;
      }

      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user?.role === "EMPLOYEE") {
        router.push("/employee");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError(t("val.networkError", "An unexpected network error occurred. Please check your connection."));
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setNotRegistered(false);
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
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#142D4E] border border-[#B99A57]/60 flex items-center justify-center text-[#B99A57] font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            B
          </div>
          <span className="text-2xl font-extrabold text-[#142D4E] tracking-tight">
            Bank<span className="text-[#B99A57]">Ready</span>
          </span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">{t("login.title", "Sign In to BankReady")}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {t("login.subtitle", "Access your pre-visit checklists, saved tasks, and branch alerts")}
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs: Sign In / Create Account */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-center">
          <button
            type="button"
            className="py-3 text-[#142D4E] bg-white border-b-2 border-[#142D4E] font-bold"
          >
            {t("nav.login", "Sign In")}
          </button>
          <Link
            href={email ? `/register?email=${encodeURIComponent(email)}` : "/register"}
            className="py-3 text-slate-500 hover:text-slate-800 transition-colors"
          >
            {t("nav.createAccount", "Create Account")}
          </Link>
        </div>

        <div className="p-6">
          {/* Unregistered Account Alert with Immediate Sign Up CTA */}
          {notRegistered && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="font-semibold flex items-center gap-1.5 mb-1.5">
                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
              <p className="text-slate-600 text-[11px] mb-2.5">
                {t(
                  "login.createAccountPrompt",
                  "Create an account in less than a minute to save your pre-visit documents."
                )}
              </p>
              <Link
                href={`/register?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142D4E] text-white font-bold hover:bg-[#0B1F36] transition-colors"
              >
                <span>{t("nav.createAccount", "Create Free Account")}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}

          {/* Standard Error Alert */}
          {!notRegistered && error && (
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
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                  if (notRegistered) setNotRegistered(false);
                }}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t("label.password", "Password")}
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#0B1F36] text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
              <Link
                href={email ? `/register?email=${encodeURIComponent(email)}` : "/register"}
                className="font-bold text-[#142D4E] hover:underline"
              >
                {t("nav.createAccount", "Create an Account")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Discrete Collapsible Demo Credentials Helper */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setShowDemoCredentials(!showDemoCredentials)}
          className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
        >
          <span>Need pre-seeded test accounts?</span>
          <svg
            className={`w-3 h-3 transition-transform ${showDemoCredentials ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDemoCredentials && (
          <div className="mt-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm text-left animate-fadeIn">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <span className="text-[11px] font-bold text-[#142D4E] uppercase tracking-wider">
                Click to Autofill:
              </span>
              <button
                type="button"
                onClick={handleResetData}
                className="text-[10px] text-slate-500 hover:text-[#142D4E] underline"
                title="Reset database to original demo records"
              >
                {t("btn.resetDemo", "Reset Demo Data")}
              </button>
            </div>

            {seedStatus && (
              <div className="mb-2 p-1.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium text-center">
                {seedStatus}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("demo.customer@bankready.test", "Demo1234!")}
                className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
              >
                <div className="text-[11px] font-bold text-[#142D4E]">Customer</div>
                <div className="text-[10px] text-slate-500 truncate">Ramesh Sharma</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("demo.admin@bankready.test", "DemoAdmin1234!")}
                className="p-1.5 rounded bg-amber-50/60 hover:bg-amber-100/60 border border-amber-200 text-left transition-colors"
              >
                <div className="text-[11px] font-bold text-amber-900">Admin</div>
                <div className="text-[10px] text-slate-500 truncate">Platform Lead</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("demo.employee@bankready.test", "DemoEmp1234!")}
                className="p-1.5 rounded bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200 text-left transition-colors"
              >
                <div className="text-[11px] font-bold text-blue-900">Employee</div>
                <div className="text-[10px] text-slate-500 truncate">SBI Officer</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center py-20 text-slate-400 text-xs">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
