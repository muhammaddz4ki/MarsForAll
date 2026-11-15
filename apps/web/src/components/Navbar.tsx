"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const t = useTranslations("landing.navbar");

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? "bg-black/40 backdrop-blur-md py-3 sm:py-3.5"
          : "bg-transparent py-4 sm:py-5"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
        
        {/* =========================================================
            LEFT GROUP: Clean Professional Brand Logo & Nav Links
        ========================================================= */}
        <div className="flex items-center gap-4 sm:gap-8">
          
          {/* Logo Emblem & Brand Name (Bener & Rapih) */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group notranslate" translate="no">
            <img
              src="/favicon.png"
              alt="MARSFORALL Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain transition-transform duration-200 group-hover:scale-105 shrink-0"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.src.includes("marsforall-logo.png")) {
                  img.src = "/images/marsforall-logo.png";
                }
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold font-mono tracking-wider text-white uppercase leading-tight select-none">
                MARS<span className="text-[#f97316]">FOR</span>ALL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Clean, Uncluttered, Direct Scroll) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <a
              href="#analogi"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {t("analogues")}
            </a>

            <a
              href="#layer-sains"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {t("layers")}
            </a>

            <Link
              href="/peta"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-cyan-400 hover:bg-white/10 transition-colors flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{t("cockpit")}</span>
            </Link>
          </nav>
        </div>

        {/* =========================================================
            RIGHT GROUP: Language Switcher & Primary CTA (Searchbar & Light/Dark Dihapus)
        ========================================================= */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Minimalist Language Switcher (ID / EN) */}
          <LanguageSwitcher variant="minimal" />

          {/* Primary CTA (Buka Peta Mars) */}
          <Link
            href="/peta"
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white font-mono text-xs font-bold tracking-wider transition-all duration-200 flex items-center gap-1.5 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] shrink-0"
          >
            <span>{t("openMap")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle Mobile Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer (Responsif, Transparan Glass) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/85 backdrop-blur-xl px-5 pt-3 pb-6 mt-3 space-y-4 font-mono text-xs border-t border-white/10"
          >
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="px-2 py-2 text-slate-200 hover:text-[#f97316] transition-colors"
              >
                {t("home")}
              </Link>
              <a
                href="#layer-sains"
                onClick={() => setMobileOpen(false)}
                className="px-2 py-2 text-slate-200 hover:text-[#f97316] transition-colors"
              >
                {t("layers")}
              </a>
              <Link
                href="/peta"
                onClick={() => setMobileOpen(false)}
                className="px-2 py-2 text-slate-200 hover:text-cyan-400 transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>{t("cockpit")}</span>
              </Link>
              <a
                href="#analogi"
                onClick={() => setMobileOpen(false)}
                className="px-2 py-2 text-slate-200 hover:text-[#f97316] transition-colors"
              >
                {t("analogues")}
              </a>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-slate-400">Bahasa:</span>
              <LanguageSwitcher variant="minimal" />
            </div>

            <Link
              href="/peta"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 rounded-lg bg-[#f97316] text-white font-bold text-center block tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.4)]"
            >
              {t("openMap")}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
