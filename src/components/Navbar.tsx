"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserSession } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data?.user || null);
      })
      .catch(() => {
        setUser(null);
      });

    fetch("/api/notifications?unreadOnly=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) {
          setUnreadCount(data.count);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch {
      // ignore
    }
  };

  const { t } = useLanguage();

  const navLinks = [
    { name: t("nav.services", "Services"), href: "/services" },
    { name: t("nav.branches", "Find Branch"), href: "/branches" },
    { name: t("nav.wizard", "Readiness Wizard"), href: "/wizard" },
    { name: t("nav.accountCheck", "Account Check"), href: "/account-readiness" },
    { name: t("nav.forms", "Official Forms"), href: "/forms" },
    { name: t("nav.holidays", "Holidays"), href: "/holidays" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#142D4E] text-white shadow-md border-b border-[#0B1F36]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-[#0B1F36] border border-[#B99A57]/40 flex items-center justify-center text-[#B99A57] font-bold shadow-sm group-hover:border-[#B99A57] transition-colors shrink-0">
              <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                Bank<span className="text-[#B99A57]">Ready</span>
              </span>
              <span className="text-[10px] text-slate-300 tracking-wider uppercase font-medium">
                {t("nav.tagline", "Pre-Visit Banking Platform")}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#0B1F36] text-[#B99A57] font-semibold"
                      : "text-slate-200 hover:text-white hover:bg-[#0B1F36]/60"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Language Selector / Auth Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Selector */}
            <LanguageSelector variant="navbar" />

            {/* Notification Bell */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-slate-200 hover:text-white hover:bg-[#0B1F36] transition-colors"
              title="Branch Announcements & Notices"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#B42318] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 rounded-md bg-[#0B1F36] border border-slate-700 text-sm font-medium text-white hover:bg-[#0B1F36]/80 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#18794E]"></span>
                  <span>{user.name.split(" ")[0]}</span>
                  {user.role === "ADMIN" && (
                    <span className="text-[10px] bg-[#B99A57] text-[#0B1F36] px-1.5 py-0.5 rounded font-bold">Admin</span>
                  )}
                  {user.role === "EMPLOYEE" && (
                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">Staff</span>
                  )}
                </Link>

                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 rounded-md bg-[#B99A57] text-[#0B1F36] text-sm font-semibold hover:bg-[#a68847] transition-colors"
                  >
                    {t("nav.adminPortal", "Admin Portal")}
                  </Link>
                )}

                {user.role === "EMPLOYEE" && (
                  <Link
                    href="/employee"
                    className="px-3 py-1.5 rounded-md bg-[#B99A57] text-[#0B1F36] text-sm font-semibold hover:bg-[#a68847] transition-colors"
                  >
                    {t("nav.staffPortal", "Staff Portal")}
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-md text-sm text-slate-300 hover:text-white hover:bg-[#0B1F36] transition-colors"
                >
                  {t("nav.logout", "Logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-md text-sm font-medium text-slate-200 hover:text-white hover:bg-[#0B1F36] transition-colors"
                >
                  {t("nav.login", "Login")}
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-md text-sm font-semibold bg-[#B99A57] text-[#0B1F36] hover:bg-[#a68847] transition-colors shadow-sm"
                >
                  {t("nav.createAccount", "Create Account")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector variant="navbar" className="scale-90" />

            <Link
              href="/notifications"
              className="relative p-2 text-slate-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#B42318] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-200 hover:text-white hover:bg-[#0B1F36]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1F36] border-b border-slate-700 px-4 pt-2 pb-4 space-y-2">
          {/* Mobile Language Selector */}
          <div className="py-2">
            <LanguageSelector variant="mobile" />
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:text-white hover:bg-[#142D4E]"
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-700 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-[#142D4E]"
                >
                  {t("nav.dashboard", "Dashboard")} ({user.name})
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-[#B99A57] text-[#0B1F36]"
                  >
                    {t("nav.adminPortal", "Admin Portal")}
                  </Link>
                )}
                {user.role === "EMPLOYEE" && (
                  <Link
                    href="/employee"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium bg-[#B99A57] text-[#0B1F36]"
                  >
                    {t("nav.staffPortal", "Staff Portal")}
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-[#142D4E]"
                >
                  {t("nav.logout", "Logout")}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-2 rounded-md text-base font-medium text-white bg-[#142D4E]"
                >
                  {t("nav.login", "Login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-2 rounded-md text-base font-medium bg-[#B99A57] text-[#0B1F36] font-semibold"
                >
                  {t("nav.createAccount", "Create Account")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
