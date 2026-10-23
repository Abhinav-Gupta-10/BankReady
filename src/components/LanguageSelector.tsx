"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/lib/translations";

interface LanguageSelectorProps {
  className?: string;
  variant?: "navbar" | "mobile" | "footer";
}

export default function LanguageSelector({
  className = "",
  variant = "navbar",
}: LanguageSelectorProps) {
  const { language, setLanguage, languages } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  if (variant === "footer") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="text-slate-400 text-xs flex items-center gap-1">
          <svg className="w-4 h-4 text-[#B99A57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          Language:
        </span>
        <select
          id="footer-language-select"
          value={language}
          onChange={handleChange}
          aria-label="Select Language"
          className="bg-[#142D4E] text-slate-200 text-xs border border-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B99A57] cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-[#0B1F36] text-white">
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className={`flex items-center justify-between p-2 rounded-lg bg-[#142D4E] border border-slate-700/60 ${className}`}>
        <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
          <svg className="w-4 h-4 text-[#B99A57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span>Language / भाषा</span>
        </div>
        <select
          id="mobile-language-select"
          value={language}
          onChange={handleChange}
          aria-label="Select Interface Language"
          className="bg-[#0B1F36] text-[#B99A57] font-semibold text-xs border border-slate-600 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B99A57] cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-[#0B1F36] text-white">
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Default navbar variant
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-1.5 bg-[#0B1F36] hover:bg-[#0B1F36]/90 border border-slate-700/80 hover:border-[#B99A57]/60 rounded-lg px-2.5 py-1 text-xs text-slate-200 transition-colors shadow-sm">
        <svg
          className="w-4 h-4 text-[#B99A57] shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <select
          id="navbar-language-select"
          value={language}
          onChange={handleChange}
          aria-label="Select Interface Language"
          className="bg-transparent text-slate-100 font-medium text-xs focus:outline-none cursor-pointer pr-1 py-0.5"
        >
          {languages.map((lang) => (
            <option
              key={lang.code}
              value={lang.code}
              className="bg-[#0B1F36] text-slate-100 py-1"
            >
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
