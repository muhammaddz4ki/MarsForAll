"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

export default function MarsTakeMeSection() {
  const tAbout = useTranslations("landing.about");

  return (
    <section
      id="take-me-to-mars"
      className="relative w-full min-h-[580px] sm:min-h-[660px] lg:min-h-0 lg:aspect-[1376/768] bg-[#05070b] text-white flex items-center justify-center overflow-hidden select-none"
    >
      {/* 0. CINEMATIC FULL-BLEED MARTIAN SURFACE BACKGROUND (MATCHING ORIGINAL IMAGE PROPORTIONS) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/mars-expedition-walk.jpg"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (!img.src.endsWith(".png")) {
              img.src = "/images/page2-bg.jpg";
            } else if (!img.src.endsWith(".webp")) {
              img.src = "/images/page2-bg.webp";
            }
          }}
          alt="Martian Expedition Walk Surface"
          className="w-full h-full object-cover object-[center_bottom] lg:object-center brightness-105 contrast-[1.05]"
        />
        {/* Subtle Right-Side Gradient ONLY to guarantee high text contrast without darkening the astronaut on the left */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#05070b]/90 via-[#05070b]/45 via-50% to-transparent pointer-events-none" />
        
        {/* Seamless Bottom Gradient Connecting to Next Section */}
        <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-60 lg:h-72 bg-gradient-to-t from-[#05070b] via-[#05070b]/95 via-30% via-[#05070b]/50 via-65% to-transparent pointer-events-none z-[1]" />
      </div>

      {/* 1. MAIN HERO CONTENT GRID */}
      <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 z-10 flex flex-col justify-center min-h-[50vh]">

        {/* MAIN TEXT BLOCK (RIGHT SIDE TO NEVER COVER THE ASTRONAUT) */}
        <div className="w-full flex justify-end py-2 sm:py-4">
          <div className="w-full lg:w-[58%] xl:w-[54%] max-w-2xl space-y-4 text-left">

            {/* Huge Bebas Neue Display Headline (TAKE ME TO MARS) */}
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-display font-normal uppercase tracking-normal leading-[0.85] text-white select-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
                {tAbout("mainTitle")}
              </h2>

              {/* Empowering Tagline */}
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug drop-shadow-md font-sans pt-1">
                {tAbout("motto")}
              </p>
            </div>

            {/* Mission Description */}
            <p className="text-sm sm:text-base text-slate-200/90 font-light leading-relaxed font-sans max-w-xl drop-shadow">
              {tAbout("descDetailed")}
            </p>

            {/* Action CTA Button */}
            <div className="pt-1 flex flex-wrap items-center gap-4">
              <Link
                href="/peta"
                className="inline-flex items-center gap-3 px-8 py-3.5 sm:py-4 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-mono text-xs sm:text-sm font-bold tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] group"
              >
                <span>{tAbout("ctaPrimary")}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
