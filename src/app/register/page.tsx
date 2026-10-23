"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAlreadyRegistered(false);

    const cleanName = name.trim();
    if (!cleanName) {
      setError(t("val.requiredField", "Please enter your full legal name."));
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(t("val.requiredField", "Please enter your email address."));
      return;
    }

    if (password.length < 8) {
      setError(t("val.passMinLen", "Password must be at least 8 characters long."));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("val.passMismatch", "Passwords do not match."));
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
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: phone.trim() || undefined,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.alreadyRegistered || res.status === 409) {
          setAlreadyRegistered(true);
          setError(
            data.error ||
              t(
                "val.accountExists",
                "An account with this email address already exists. Please sign in instead."
              )
          );
        } else {
          setError(data.error || t("val.regFailed", "Registration failed. Please check your details."));
        }
        setLoading(false);
        return;
      }

      // Success
      setSuccessMessage(t("val.accountCreated", "Account created successfully! Redirecting to dashboard..."));
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 700);
    } catch {
      setError(t("val.networkError", "An unexpected network error occurred. Please check your connection."));
      setLoading(false);
    }
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
        <h1 className="text-xl font-bold text-slate-900">{t("register.title", "Create Your Account")}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {t("register.subtitle", "Save custom pre-visit checklists and track bank requirements")}
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs: Sign In / Create Account */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-center">
          <Link
            href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
            className="py-3 text-slate-500 hover:text-slate-800 transition-colors"
          >
            {t("nav.login", "Sign In")}
          </Link>
          <button
            type="button"
            className="py-3 text-[#142D4E] bg-white border-b-2 border-[#142D4E] font-bold"
          >
            {t("nav.createAccount", "Create Account")}
          </button>
        </div>

        <div className="p-6">
          {/* Success Message Banner */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Already Registered Alert with Direct Sign In Link */}
          {alreadyRegistered && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="font-semibold flex items-center gap-1.5 mb-1.5">
                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
              <p className="text-slate-600 text-[11px] mb-2.5">
                {t(
                  "register.alreadyRegisteredPrompt",
                  "You already have a BankReady account registered with this email address."
                )}
              </p>
              <Link
                href={`/login?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142D4E] text-white font-bold hover:bg-[#0B1F36] transition-colors"
              >
                <span>{t("register.signIn", "Sign In to Your Account")}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}

          {/* Standard Error Alert */}
          {!alreadyRegistered && error && (
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
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t("label.fullNamePlaceholder", "e.g. Ramesh Sharma")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent transition-all"
              />
            </div>

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
                  if (alreadyRegistered) setAlreadyRegistered(false);
                }}
                placeholder={t("label.emailPlaceholder", "name@example.com")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("label.phone", "Phone Number")}{" "}
                <span className="text-slate-400 font-normal">({t("label.optional", "Optional")})</span>
              </label>
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("label.phonePlaceholder", "10-digit mobile number")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("label.password", "Password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={t("label.passwordPlaceholder", "Min 8 chars")}
                    className="w-full px-3.5 py-2.5 pr-9 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("label.confirmPassword", "Confirm Password")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={t("label.confirmPasswordPlaceholder", "Re-type password")}
                    className="w-full px-3.5 py-2.5 pr-9 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#142D4E] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] text-red-600 font-medium">
                {t("val.passMismatch", "Passwords do not match.")}
              </p>
            )}

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
              className="w-full py-2.5 rounded-lg bg-[#B99A57] hover:bg-[#a68847] text-[#0B1F36] text-sm font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>{t("btn.creatingAccount", "Creating Account...")}</span>
              ) : (
                <>
                  <span>{t("btn.createAccount", "Create Free Customer Account")}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              {t("register.hasAccount", "Already have an account?")}{" "}
              <Link
                href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
                className="font-bold text-[#142D4E] hover:underline"
              >
                {t("register.signIn", "Sign in here")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center py-20 text-slate-400 text-xs">Loading registration...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
