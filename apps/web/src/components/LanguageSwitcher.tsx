"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "pill" | "compact" | "card" | "dropdown" | "minimal";
  className?: string;
  showIcon?: boolean;
}

const LANGUAGES = [
  { code: "id", label: "Indonesia", flag: "ID" },
  { code: "en", label: "English", flag: "EN" },
  { code: "es", label: "Español", flag: "ES" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "zh", label: "中文", flag: "ZH" },
];

export default function LanguageSwitcher({
  variant = "pill",
  className = "",
  showIcon = true,
}: LanguageSwitcherProps) {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const setLanguage = (locale: string) => {
    if (locale !== currentLocale) {
      router.replace(pathname, { locale: locale as any });
    }
    setDropdownOpen(false);
  };

  const toggleLanguage = () => {
    const next = currentLocale === "id" ? "en" : "id";
    setLanguage(next);
  };

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-1 font-mono text-xs select-none ${className}`}>
        {["id", "en"].map((lang, idx) => {
          const isActive = currentLocale === lang;
          return (
            <React.Fragment key={lang}>
              {idx > 0 && <span className="text-slate-600 select-none">/</span>}
              <button
                type="button"
                onClick={() => setLanguage(lang)}
                className={`uppercase tracking-wider transition-colors px-1 py-0.5 rounded text-[11px] ${
                  isActive
                    ? "text-[#f97316] font-bold"
                    : "text-slate-400 hover:text-white font-medium"
                }`}
                title={`Ganti bahasa ke ${lang.toUpperCase()}`}
              >
                {lang}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={toggleLanguage}
        className={`px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/80 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 ${className}`}
        title="Ganti Bahasa (ID / EN)"
      >
        {showIcon && <Globe className="w-3.5 h-3.5 text-[#2a9d8f]" />}
        <span className="uppercase">{currentLocale}</span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div className={`p-3 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 shadow-sm ${className}`}>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Pilih Bahasa
        </div>
        <div className="flex gap-2">
          {["id", "en"].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                currentLocale === lang
                  ? "bg-[#2a9d8f] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: Pill (ID / EN toggle or dropdown)
  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-0.5 shadow-sm">
        {["id", "en"].map((lang) => {
          const isActive = currentLocale === lang;
          return (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`relative px-2.5 py-1 text-[11px] font-bold uppercase rounded-full transition-all duration-200 ${
                isActive
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="lang-pill-active"
                  className="absolute inset-0 rounded-full bg-[#2a9d8f] shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{lang}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

