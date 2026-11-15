"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function MarsMissionSection() {
  const tAbout = useTranslations("landing.about");

  return (
    <section
      id="misi-taktis"
      className="relative w-full min-h-[85vh] py-20 sm:py-28 lg:py-32 bg-[#05070b] text-white flex items-center justify-center overflow-hidden select-none"
    >
      {/* 0. CUSTOM DEEP BACKGROUND & SEAMLESS TRANSITIONS */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/page3-bg.jpg"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (!img.src.endsWith(".png")) {
              img.src = "/images/page3-bg.png";
            } else if (!img.src.endsWith(".webp")) {
              img.src = "/images/page3-bg.webp";
            } else {
              img.style.display = "none";
            }
          }}
          alt="Page Background"
          className="w-full h-full object-cover object-center opacity-30 filter saturate-125"
        />

        {/* Deep, Soft Top & Bottom Black Gradients for Seamless Blending */}
        <div className="absolute top-0 left-0 right-0 h-48 sm:h-64 lg:h-80 bg-gradient-to-b from-[#05070b] via-[#05070b]/95 via-30% via-[#05070b]/50 via-65% to-transparent pointer-events-none z-[2]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 sm:h-64 lg:h-80 bg-gradient-to-t from-[#05070b] via-[#05070b]/95 via-30% via-[#05070b]/50 via-65% to-transparent pointer-events-none z-[2]" />
        
        {/* Subtle horizontal vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070b]/80 via-transparent to-[#05070b]/80 pointer-events-none z-[1]" />
      </div>

      {/* Subtle warm nebula atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,0.06)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.05)_0%,transparent_60%)] pointer-events-none z-[1]" />

      {/* Main Content Area - DiBisalitas 2-Column Grid (Tepat di atas gradasi & background) */}
      <div className="relative z-20 w-full max-w-[90rem] mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
        
        {/* ──── LEFT: 3D TABLET / LAPTOP MOCKUP ──── */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center justify-center lg:justify-start"
          style={{ perspective: "1200px" }}
        >
          {/* Faint Glow Behind Device */}
          <div className="absolute w-[90%] h-[90%] bg-[#f97316]/10 blur-[100px] rounded-full top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          {/* The 3D Mockup Frame with Realistic Perspective */}
          <div
            className="relative w-full max-w-[720px]"
            style={{
              transform: "rotateY(16deg) rotateX(4deg) rotateZ(-2deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Tablet Body */}
            <div
              className="relative w-full aspect-[16/10] rounded-xl md:rounded-2xl overflow-hidden border-[4px] md:border-[8px] border-[#18202f] bg-[#07090e]"
              style={{
                boxShadow:
                  "-25px 35px 70px rgba(0,0,0,0.85), 0 0 25px rgba(0,0,0,0.6), inset 0 0 15px rgba(255,255,255,0.05)",
              }}
            >
              {/* Screen Image displaying Live Hero Page (Halaman Paling Awal) */}
              <img
                src="/images/mars-cockpit-tablet.png"
                alt="Tampilan Halaman Hero Mars"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.src.endsWith(".png")) {
                    img.src = "/images/mars-hero-page-screen.png";
                  }
                }}
              />

              {/* Screen Glare & Vignette */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
            </div>

            {/* Tablet / Laptop Bottom Lip Hint */}
            <div className="w-[60%] mx-auto h-[4px] md:h-[6px] bg-[#141b29] rounded-b-xl" />
          </div>
        </motion.div>

        {/* ──── RIGHT: TYPOGRAPHY (MATCHING DIBISALITAS) ──── */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="flex flex-col space-y-6 lg:pl-6 justify-center"
        >
          {/* Eyebrow Label */}
          <span className="text-sm md:text-base font-light tracking-normal text-slate-400">
            {tAbout("aboutEyebrow")}
          </span>

          {/* Headline: Plain White Lead + Italic Coral Accent */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black leading-[1.08] tracking-tight text-white">
            <span>{tAbout("aboutHeadlineLead")}</span>{" "}
            <em className="font-black italic text-[#f97316]">
              {tAbout("aboutHeadlineAccent")}
            </em>
          </h2>

          {/* Description Paragraph */}
          <p className="text-slate-300 text-sm md:text-[15px] leading-relaxed max-w-lg font-light">
            {tAbout("aboutMissionStatement")}
          </p>

          {/* CTA Button */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/peta"
              className="px-8 py-3.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-[0_0_25px_rgba(249,115,22,0.35)] hover:shadow-[0_0_35px_rgba(249,115,22,0.55)] group"
            >
              <span>{tAbout("cta")}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
