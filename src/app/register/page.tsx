"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("val.passMismatch", "Passwords do not match."));
      return;
    }

    if (password.length < 8) {
      setError(t("val.passMinLen", "Password must be at least 8 characters long."));
      return;
    }

    if (!acceptedTerms) {
      setError(t("val.termsRequired", "You must accept the terms of service and disclaimer to continue."));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("val.regFailed", "Registration failed."));
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("val.networkError", "An unexpected network error occurred."));
      setLoading(false);
    }
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
        <h2 className="text-xl font-bold text-slate-900">{t("register.title", "Create Your Account")}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t("register.subtitle", "Save custom pre-visit checklists and track bank requirements")}
        </p>
      </div>

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
              {t("label.fullName", "Full Legal Name")}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("label.fullNamePlaceholder", "e.g. Ramesh Sharma")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("label.email", "Email Address")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("label.emailPlaceholder", "name@example.com")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("label.phone", "Phone Number")} <span className="text-slate-400 font-normal">({t("label.optional", "Optional")})</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("label.phonePlaceholder", "10-digit mobile number")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("label.password", "Password")}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("label.passwordPlaceholder", "Min 8 characters")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("label.confirmPassword", "Confirm Password")}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("label.confirmPasswordPlaceholder", "Re-type password")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#142D4E] focus:ring-[#142D4E]"
            />
            <label htmlFor="terms" className="text-[11px] text-slate-600 leading-tight">
              {t(
                "label.termsAgree",
                "I understand BankReady is an advisory preparation platform and I accept the terms of service and regulatory compliance guidelines."
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#B99A57] hover:bg-[#a68847] text-[#0B1F36] text-sm font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? t("btn.creatingAccount", "Creating Account...") : t("btn.createAccount", "Create Free Customer Account")}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            {t("register.hasAccount", "Already have an account?")}{" "}
            <Link href="/login" className="font-semibold text-[#142D4E] hover:underline">
              {t("register.signIn", "Sign in here")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
