"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  motion,
  useInView,
  AnimatePresence,
  Variants,
  LayoutGroup,
} from "framer-motion";
import {
  Compass,
  Thermometer,
  Sparkles,
  Shield,
  Route,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Eye,
  Globe,
  Radio,
  Atom,
  Wind,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MarsVideoHero from "@/components/landing/MarsVideoHero";
import MarsTakeMeSection from "@/components/landing/MarsTakeMeSection";
import MarsMissionSection from "@/components/landing/MarsMissionSection";

/* ============================================
   ANIMATION VARIANTS
============================================ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ============================================
   COUNTER HOOK
============================================ */
function useCounter(end: number, duration: number = 2000, startCounting: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startCounting) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, startCounting]);
  return count;
}

/* ============================================
   1. FIVE PLANETARY SCIENTIFIC LAYERS DATA (SYNTHESIZED)
============================================ */
type ScienceDomainConfig = {
  id: string;
  number: string;
  tagKey: "layer1Tag" | "layer2Tag" | "layer3Tag" | "layer4Tag" | "layer5Tag";
  catKey: "layer1Cat" | "layer2Cat" | "layer3Cat" | "layer4Cat" | "layer5Cat";
  titleKey: "layer1Title" | "layer2Title" | "layer3Title" | "layer4Title" | "layer5Title";
  instKey: "layer1Inst" | "layer2Inst" | "layer3Inst" | "layer4Inst" | "layer5Inst";
  descKey: "layer1Desc" | "layer2Desc" | "layer3Desc" | "layer4Desc" | "layer5Desc";
  metric: string;
  color: string;
  border: string;
  accent: string;
  badgeBg: string;
  mainImg: string;
  icon: any;
  link: string;
};

const scienceMatrixConfig: ScienceDomainConfig[] = [
  {
    id: "layer-geologi",
    number: "01",
    tagKey: "layer1Tag",
    catKey: "layer1Cat",
    titleKey: "layer1Title",
    instKey: "layer1Inst",
    descKey: "layer1Desc",
    metric: "25 cm/px [NOACHIAN/HESPERIAN]",
    color: "bg-[#18110b]",
    border: "border-amber-500/40",
    accent: "text-amber-400",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    mainImg: "/images/domains/domain-geology.jpg",
    icon: Globe,
    link: "/peta",
  },
  {
    id: "layer-topografi",
    number: "02",
    tagKey: "layer2Tag",
    catKey: "layer2Cat",
    titleKey: "layer2Title",
    instKey: "layer2Inst",
    descKey: "layer2Desc",
    metric: "< 15° [SAFE TRAVERSE]",
    color: "bg-[#0b1320]",
    border: "border-emerald-500/40",
    accent: "text-emerald-400",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    mainImg: "/images/domains/domain-slope.jpg",
    icon: Compass,
    link: "/peta",
  },
  {
    id: "layer-termal",
    number: "03",
    tagKey: "layer3Tag",
    catKey: "layer3Cat",
    titleKey: "layer3Title",
    instKey: "layer3Inst",
    descKey: "layer3Desc",
    metric: "485 tiu [BEDROCK FIRM]",
    color: "bg-[#101424]",
    border: "border-cyan-500/40",
    accent: "text-cyan-400",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    mainImg: "/images/domains/domain-thermal.jpg",
    icon: Thermometer,
    link: "/peta",
  },
  {
    id: "layer-mineral",
    number: "04",
    tagKey: "layer4Tag",
    catKey: "layer4Cat",
    titleKey: "layer4Title",
    instKey: "layer4Inst",
    descKey: "layer4Desc",
    metric: "6.8 wt% WEH [34 L/t]",
    color: "bg-[#180e24]",
    border: "border-purple-500/40",
    accent: "text-purple-400",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    mainImg: "/images/domains/domain-minerals.jpg",
    icon: Sparkles,
    link: "/peta",
  },
  {
    id: "layer-radiasi",
    number: "05",
    tagKey: "layer5Tag",
    catKey: "layer5Cat",
    titleKey: "layer5Title",
    instKey: "layer5Inst",
    descKey: "layer5Desc",
    metric: "72 nT [-13.7% GCR]",
    color: "bg-[#200e14]",
    border: "border-rose-500/40",
    accent: "text-rose-400",
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    mainImg: "/images/domains/domain-radiation.jpg",
    icon: Shield,
    link: "/peta",
  },
];

function MartianScienceMatrixSection() {
  const tMatrix = useTranslations("landing.matrixSection");
  const [activeIndex, setActiveIndex] = useState(1);

  const scienceMatrixData = scienceMatrixConfig.map((item) => ({
    ...item,
    domainTag: tMatrix(item.tagKey),
    category: tMatrix(item.catKey),
    title: tMatrix(item.titleKey),
    instrument: tMatrix(item.instKey),
    description: tMatrix(item.descKey),
  }));

  const activeItem = scienceMatrixData[activeIndex];
  const ActiveIcon = activeItem.icon;
  const len = scienceMatrixData.length;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % len);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + len) % len);
  };

  const idxMinus2 = (activeIndex - 2 + len) % len;
  const idxMinus1 = (activeIndex - 1 + len) % len;
  const idxPlus1 = (activeIndex + 1) % len;
  const idxPlus2 = (activeIndex + 2) % len;

  return (
    <section id="layer-sains" className="py-24 md:py-32 px-4 sm:px-6 bg-[#05070b] text-white relative overflow-hidden select-none">
      {/* Top and Bottom Seamless Blending Gradients (Connecting Sections) */}
      <div className="absolute top-0 left-0 right-0 h-44 sm:h-60 lg:h-72 bg-gradient-to-b from-[#05070b] via-[#05070b]/70 via-50% to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-60 lg:h-72 bg-gradient-to-t from-[#05070b] via-[#05070b]/70 via-50% to-transparent pointer-events-none z-10" />
      
      {/* Background Watermark */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 text-[14rem] md:text-[24rem] font-serif text-white/[0.02] tracking-tighter pointer-events-none select-none z-0 whitespace-nowrap">
        MATRIX
      </div>

      <div className="relative z-30 w-full max-w-[1400px] mx-auto flex flex-col items-center">
        {/* Section Header (Always above any gradient) */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8 md:mb-12 relative z-30">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-[1.12]">
            {tMatrix("headingLead")}{" "}
            <span className="text-[#f97316]">{tMatrix("headingHighlight")}</span>{" "}
            <br className="hidden sm:inline" />
            {tMatrix("headingSuffix")}
          </h2>

          <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed font-sans max-w-2xl mx-auto">
            {tMatrix("subtitle")}
          </p>
        </div>

        {/* 3D Coverflow Carousel Area */}
        <div className="relative w-full h-[380px] sm:h-[440px] md:h-[540px] lg:h-[620px] flex justify-center items-center px-4 md:px-0">
          <div 
            className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 w-full"
            style={{ perspective: "2000px", transformStyle: "preserve-3d" }}
          >
            <AnimatePresence mode="wait">
              {/* Card -2 */}
              <motion.div 
                key={`matrix-c-2-${activeIndex}`}
                initial={{ opacity: 0, rotateY: 0, z: -300, x: "300%" }}
                whileInView={{ opacity: 1, rotateY: 25, z: -150, x: 20 }}
                viewport={{ once: false, margin: "-60px" }}
                exit={{ opacity: 0, rotateY: 0, z: -300, x: "300%" }}
                transition={{ duration: 0.85, ease: [0.32, 0.72, 0, 1] }}
                onClick={() => setActiveIndex(idxMinus2)}
                className="order-1 hidden md:block w-[100px] lg:w-[140px] xl:w-[180px] h-[220px] lg:h-[300px] xl:h-[380px] rounded-xl lg:rounded-2xl overflow-hidden grayscale brightness-50 flex-shrink-0 relative border border-white/10 cursor-pointer hover:brightness-75 transition-all"
                title={scienceMatrixData[idxMinus2].title}
              >
                <img src={scienceMatrixData[idxMinus2].mainImg} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
              </motion.div>

              {/* Card -1 */}
              <motion.div 
                key={`matrix-c-1-${activeIndex}`}
                initial={{ opacity: 0, rotateY: 0, z: -200, x: "150%" }}
                whileInView={{ opacity: 1, rotateY: 15, z: -80, x: 10 }}
                viewport={{ once: false, margin: "-60px" }}
                exit={{ opacity: 0, rotateY: 0, z: -200, x: "150%" }}
                transition={{ duration: 0.85, ease: [0.32, 0.72, 0, 1] }}
                onClick={() => setActiveIndex(idxMinus1)}
                className="order-2 w-[80px] sm:w-[120px] md:w-[150px] lg:w-[180px] xl:w-[240px] h-[220px] sm:h-[280px] md:h-[320px] lg:h-[400px] xl:h-[480px] rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden grayscale brightness-75 flex-shrink-0 relative border border-white/10 cursor-pointer hover:brightness-90 transition-all"
                title={scienceMatrixData[idxMinus1].title}
              >
                <img src={scienceMatrixData[idxMinus1].mainImg} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
              </motion.div>

              {/* Card +1 */}
              <motion.div 
                key={`matrix-c1-${activeIndex}`}
                initial={{ opacity: 0, rotateY: 0, z: -200, x: "-150%" }}
                whileInView={{ opacity: 1, rotateY: -15, z: -80, x: -10 }}
                viewport={{ once: false, margin: "-60px" }}
                exit={{ opacity: 0, rotateY: 0, z: -200, x: "-150%" }}
                transition={{ duration: 0.85, ease: [0.32, 0.72, 0, 1] }}
                onClick={() => setActiveIndex(idxPlus1)}
                className="order-4 w-[80px] sm:w-[120px] md:w-[150px] lg:w-[180px] xl:w-[240px] h-[220px] sm:h-[280px] md:h-[320px] lg:h-[400px] xl:h-[480px] rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden grayscale brightness-75 flex-shrink-0 relative border border-white/10 cursor-pointer hover:brightness-90 transition-all"
                title={scienceMatrixData[idxPlus1].title}
              >
                <img src={scienceMatrixData[idxPlus1].mainImg} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
              </motion.div>

              {/* Card +2 */}
              <motion.div 
                key={`matrix-c2-${activeIndex}`}
                initial={{ opacity: 0, rotateY: 0, z: -300, x: "-300%" }}
                whileInView={{ opacity: 1, rotateY: -25, z: -150, x: -20 }}
                viewport={{ once: false, margin: "-60px" }}
                exit={{ opacity: 0, rotateY: 0, z: -300, x: "-300%" }}
                transition={{ duration: 0.85, ease: [0.32, 0.72, 0, 1] }}
                onClick={() => setActiveIndex(idxPlus2)}
                className="order-5 hidden md:block w-[100px] lg:w-[140px] xl:w-[180px] h-[220px] lg:h-[300px] xl:h-[380px] rounded-xl lg:rounded-2xl overflow-hidden grayscale brightness-50 flex-shrink-0 relative border border-white/10 cursor-pointer hover:brightness-75 transition-all"
                title={scienceMatrixData[idxPlus2].title}
              >
                <img src={scienceMatrixData[idxPlus2].mainImg} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
              </motion.div>
            </AnimatePresence>

            {/* Center Card 0 (Active Highlighted Card with Synthesized 5-Layer Details) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: false, margin: "-60px" }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              className="order-3 relative w-[270px] sm:w-[320px] md:w-[390px] lg:w-[440px] h-[390px] sm:h-[450px] md:h-[530px] lg:h-[590px] z-20 flex-shrink-0"
            >
              {/* Inner Card (Holds full-bleed image and descriptions with overflow-hidden) */}
              <div className={`w-full h-full rounded-[1.75rem] md:rounded-[2.5rem] overflow-hidden ${activeItem.border} border shadow-2xl relative transform transition-colors duration-500 hover:scale-[1.01]`}>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={`matrix-center-${activeIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full relative flex flex-col justify-between"
                  >
                    {/* 1. FULL BLEED BACKGROUND IMAGE */}
                    <img 
                      src={activeItem.mainImg} 
                      alt={activeItem.title} 
                      className="absolute inset-0 w-full h-full object-cover z-0" 
                    />

                    {/* 2. GRADIENT VIGNETTES (TOP FOR BADGES, DEEP BOTTOM FOR TEXT CONTRAST) */}
                    <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#05070b]/90 via-[#05070b]/50 to-transparent pointer-events-none z-[1]" />
                    <div className="absolute bottom-0 left-0 right-0 h-[72%] bg-gradient-to-t from-[#05070b] via-[#05070b]/90 via-45% via-[#05070b]/50 via-75% to-transparent pointer-events-none z-[1]" />

                    {/* 3. TOP BADGES */}
                    <div className="relative z-10 p-3.5 sm:p-5 flex items-center justify-between gap-2 pointer-events-none">
                      <span className="px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold tracking-wider bg-black/75 backdrop-blur-md text-[#f97316] border border-[#f97316]/40 shadow-sm">
                        {activeItem.domainTag}
                      </span>
                      <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold tracking-tight bg-black/75 backdrop-blur-md ${activeItem.accent} border border-white/10 shadow-sm`}>
                        {activeItem.metric}
                      </span>
                    </div>

                    {/* 4. BOTTOM CONTENT (TITLE, INSTRUMENT, DESCRIPTION, AND CTA) */}
                    <div className="relative z-10 p-4 sm:p-6 md:p-7 flex flex-col space-y-1.5 sm:space-y-2 mt-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase font-semibold">
                          {activeItem.category}
                        </span>
                      </div>

                      <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-serif font-bold leading-tight drop-shadow-md">
                        {activeItem.title}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-300 font-medium">
                        <ActiveIcon className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
                        <span className="truncate">{activeItem.instrument}</span>
                      </div>

                      <p className="text-slate-200 text-xs sm:text-[13px] md:text-sm leading-relaxed font-sans font-light line-clamp-3 sm:line-clamp-4 drop-shadow">
                        {activeItem.description}
                      </p>

                      {/* Cockpit Link CTA */}
                      <div className="pt-2 flex items-center justify-end">
                        <Link
                          href={activeItem.link}
                          className="text-[10px] sm:text-xs font-mono font-semibold tracking-wider text-[#f97316] hover:text-white transition-colors flex items-center gap-1 uppercase"
                        >
                          <span>{tMatrix("inspectCta")}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Floating Action Button (Next Card / Ganti Halaman) */}
              <button 
                onClick={nextSlide} 
                className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 md:-bottom-6 md:-left-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.7)] hover:scale-110 active:scale-95 transition-all z-30 group cursor-pointer border-2 border-black/10"
                aria-label="Layer sains berikutnya"
                title="Ganti halaman layer sains"
              >
                <ArrowUpRight className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 stroke-[2.5]" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Carousel 5 Indicators */}
        <div className="flex justify-center items-center gap-2.5 sm:gap-3 mt-12 md:mt-20">
          {scienceMatrixData.map((d, i) => (
            <button 
              key={d.id}
              onClick={() => setActiveIndex(i)}
              className={`h-2 md:h-2.5 rounded-full transition-all duration-500 cursor-pointer ${i === activeIndex ? `w-10 md:w-16 bg-[#f97316]` : 'w-2 md:w-2.5 bg-white/20 hover:bg-white/40'}`}
              aria-label={`Pilih ${d.title}`}
              title={d.title}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

/* ============================================
   6. CTA & STATS SECTION
============================================ */
function CTAAndStatsSection() {
  const tStats = useTranslations("landing.stats");
  const tRing = useTranslations("landing.statsRing");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-80px" });

  const stat1 = useCounter(4180, 2000, isInView);
  const stat2 = useCounter(5, 1500, isInView);
  const stat3 = useCounter(96, 2000, isInView);
  const stat4 = useCounter(15, 1500, isInView);

  const text = tRing("text");
  const characters = text.split("");

  return (
    <section className="relative w-full bg-[#05070b] text-white overflow-x-clip overflow-y-visible flex flex-col items-center justify-center pt-24 pb-16 z-40 select-none">
      {/* Seamless Top & Bottom Gradients */}
      <div className="absolute top-0 left-0 right-0 h-44 sm:h-60 lg:h-72 bg-gradient-to-b from-[#05070b] via-[#05070b]/70 via-50% to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-60 lg:h-72 bg-gradient-to-t from-[#05070b] via-[#05070b]/70 via-50% to-transparent pointer-events-none z-10" />
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#f97316]/10 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-[30%] right-0 w-[500px] h-[500px] bg-[#06b6d4]/10 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* --- 3D ROTATING TEXT RING (CTA) --- */}
      <div 
        className="relative w-full max-w-4xl aspect-[4/3] md:aspect-[16/9] lg:aspect-[21/9] flex items-center justify-center z-20 mb-12 md:mb-16"
        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: "translateZ(0)", transformStyle: "preserve-3d" }}
        >
          <div className="absolute w-40 h-40 md:w-80 md:h-80 bg-[#f97316]/15 blur-3xl rounded-full" />
          <div className="relative translate-y-8 sm:translate-y-12 md:translate-y-16 flex flex-col justify-end">
            <motion.img 
              initial={{ opacity: 0, y: -100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-60px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              src="/images/placeholder-hand.png" 
              alt="Martian Sample Extraction Glove" 
              className="w-56 sm:w-72 md:w-[22rem] lg:w-[26rem] h-auto object-contain drop-shadow-[0_0_40px_rgba(249,115,22,0.4)] block relative"
              style={{ 
                WebkitMaskImage: "radial-gradient(100% 100% at 50% 100%, black 50%, transparent 100%)", 
                maskImage: "radial-gradient(100% 100% at 50% 100%, black 50%, transparent 100%)" 
              }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Tilted Wrapper for the Ring */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: "rotateZ(-15deg) rotateX(15deg)", transformStyle: "preserve-3d" }}
        >
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="relative w-full h-full flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {characters.map((char, i) => (
              <span
                key={i}
                className="absolute text-4xl sm:text-5xl md:text-6xl lg:text-[5rem] font-bold text-white lowercase select-none tracking-tight font-serif"
                style={{
                  transform: `rotateY(${i * (360 / characters.length)}deg) translateZ(clamp(140px, 30vw, 320px))`,
                  textShadow: "0 0 15px rgba(249, 115, 22, 0.8), 0 0 35px rgba(249, 115, 22, 0.4)"
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* --- STATS SECTION --- */}
      <div id="statistik" className="w-full max-w-6xl mx-auto px-6 relative z-10 scroll-mt-28" ref={ref}>
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 relative z-0">
          <motion.h2 
            variants={fadeUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="text-3xl md:text-4xl lg:text-5xl font-serif text-white tracking-tight leading-[1.12]"
          >
            Orbital Readiness.
          </motion.h2>

          <p className="text-slate-400 text-sm font-sans font-light">
            {tStats("title")}
          </p>
        </div>

        {/* 4-Card Horizontal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <motion.div 
            variants={fadeUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            custom={0}
            whileHover={{ scale: 1.03, y: -6 }}
            className="bg-[#0b0f17]/95 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-[#f97316]/50"
          >
            <h3 className="text-5xl font-bold mb-2 font-mono tabular-nums text-white">{stat1}+</h3>
            <h4 className="text-xs font-bold text-[#f97316] font-mono tracking-widest uppercase mb-3">{tStats("solLabel")}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{tStats("solDesc")}</p>
          </motion.div>

          <motion.div 
            variants={fadeUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            custom={1}
            whileHover={{ scale: 1.03, y: -6 }}
            className="bg-[#0b0f17]/95 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-cyan-400/50"
          >
            <h3 className="text-5xl font-bold mb-2 font-mono tabular-nums text-white">{stat2}</h3>
            <h4 className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase mb-3">{tStats("layerLabel")}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{tStats("layerDesc")}</p>
          </motion.div>

          <motion.div 
            variants={fadeUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            custom={2}
            whileHover={{ scale: 1.03, y: -6 }}
            className="bg-[#0b0f17]/95 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-emerald-400/50"
          >
            <h3 className="text-5xl font-bold mb-2 font-mono tabular-nums text-white">{stat3}%</h3>
            <h4 className="text-xs font-bold text-emerald-400 font-mono tracking-widest uppercase mb-3">{tStats("accuracyLabel")}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{tStats("accuracyDesc")}</p>
          </motion.div>

          <motion.div 
            variants={fadeUp}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            custom={3}
            whileHover={{ scale: 1.03, y: -6 }}
            className="bg-[#0b0f17]/95 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-amber-400/50"
          >
            <h3 className="text-5xl font-bold mb-2 font-mono tabular-nums text-white">&lt; {stat4}°</h3>
            <h4 className="text-xs font-bold text-amber-400 font-mono tracking-widest uppercase mb-3">{tStats("slopeLabel")}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{tStats("slopeDesc")}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================
   7. EXPLORATION SITES & TERRESTRIAL ANALOGUES
============================================ */
/* ============================================
   7. EXPLORATION SITES & TERRESTRIAL ANALOGUES (FULL MAP SLIDER)
============================================ */
const analogueMaps = [
  {
    id: "analogue-map-1",
    title: "Planetary Analogue Map 01",
    src: "/images/analogues/analogue-map-1.webp",
    tag: "MAP 01 // TERRESTRIAL ANALOGUE SITES",
  },
  {
    id: "analogue-map-2",
    title: "Planetary Analogue Map 02",
    src: "/images/analogues/analogue-map-2.webp",
    tag: "MAP 02 // TACTICAL SURFACE MATRIX",
  },
];

const analogueSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : direction < 0 ? "-100%" : 0,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.35 },
    },
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.35 },
    },
  }),
};

function ImpactSection() {
  const [[page, direction], setPage] = useState([0, 0]);

  const activeIndex = ((page % analogueMaps.length) + analogueMaps.length) % analogueMaps.length;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const setSlide = (newIndex: number) => {
    const dir = newIndex > activeIndex ? 1 : -1;
    setPage([newIndex, dir]);
  };

  return (
    <section
      id="analogi"
      className="relative w-full min-h-[600px] sm:min-h-[750px] md:min-h-[900px] lg:min-h-screen lg:aspect-[16/9] bg-[#05070b] overflow-hidden flex items-center justify-center select-none"
    >
      {/* 0. FULL-BLEED SLIDING BACKGROUND IMAGES */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={analogueSlideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={(_e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -10000 || offset.x < -100) {
                paginate(1);
              } else if (swipe > 10000 || offset.x > 100) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            {/* Full Image background with automatic webp -> jpg -> png fallback */}
            <img
              src={analogueMaps[activeIndex].src}
              alt={analogueMaps[activeIndex].title}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.endsWith(".webp")) {
                  target.src = target.src.replace(".webp", ".jpg");
                } else if (target.src.endsWith(".jpg")) {
                  target.src = target.src.replace(".jpg", ".png");
                }
              }}
              className="w-full h-full object-cover object-center select-none pointer-events-none"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 1. SEAMLESS TOP & BOTTOM GRADIENTS TO BLEND WITH ADJACENT PAGES */}
      <div className="absolute top-0 left-0 right-0 h-44 sm:h-60 lg:h-72 bg-gradient-to-b from-[#05070b] via-[#05070b]/70 via-50% to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-60 lg:h-72 bg-gradient-to-t from-[#05070b] via-[#05070b]/70 via-50% to-transparent pointer-events-none z-10" />

      {/* 2. UNIFIED SLEEK BOTTOM CONTROL DOCK (CLEAN, TIDY, ZERO TEXT CLASH) */}
      <div className="absolute bottom-8 sm:bottom-12 md:bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 sm:gap-4 bg-[#07090e]/85 backdrop-blur-xl px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.85)]">
        {/* Prev Arrow */}
        <button
          onClick={() => paginate(-1)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/5"
          aria-label="Previous map slide"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </button>

        {/* Tactical Tag & Counter */}
        <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
          <span className="text-[9px] sm:text-[11px] font-mono tracking-widest uppercase text-[#f97316] font-bold whitespace-nowrap">
            {analogueMaps[activeIndex].tag}
          </span>
          <span className="text-white/20 font-mono text-xs">|</span>
          <span className="text-[10px] sm:text-xs font-mono text-white/90 tabular-nums font-bold whitespace-nowrap">
            {String(activeIndex + 1).padStart(2, "0")} / {String(analogueMaps.length).padStart(2, "0")}
          </span>
        </div>

        {/* Slide Indicators */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {analogueMaps.map((map, i) => (
            <button
              key={map.id}
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                i === activeIndex
                  ? "w-6 sm:w-8 bg-[#f97316] shadow-sm shadow-[#f97316]/50"
                  : "w-1.5 sm:w-2 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Next Arrow */}
        <button
          onClick={() => paginate(1)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/5"
          aria-label="Next map slide"
        >
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </button>
      </div>
    </section>
  );
}

/* ============================================
   8. SHOWCASE COCKPIT SECTION
============================================ */
function ShowcaseSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative w-full bg-[#05070b] overflow-x-clip overflow-y-visible flex flex-col items-center justify-center pt-10 pb-0 select-none">
      {/* Seamless Top Gradient (Tepat di atas background, di bawah aset laptop) */}
      <div className="absolute top-0 left-0 right-0 h-44 sm:h-60 lg:h-72 bg-gradient-to-b from-[#05070b] via-[#05070b]/70 via-50% to-transparent pointer-events-none z-10" />

      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1200px] h-[400px] sm:h-[600px] md:h-[800px] bg-[#f97316]/15 blur-[150px] rounded-[100%] pointer-events-none z-0" />

      <div className="relative w-full mx-auto px-2 sm:px-4 z-20 flex items-center justify-center mt-4 md:mt-8 pb-0">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 w-[100%] sm:w-[110%] md:w-[120%] lg:w-[115%] xl:w-[120%] flex justify-center scale-110 sm:scale-125 lg:scale-110 origin-bottom"
        >
          <img 
            src="/images/showcase-laptops-dark.png" 
            alt="MARSFORALL Unified Cockpit" 
            className="w-full h-auto drop-shadow-[0_40px_80px_rgba(0,0,0,0.9)] object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </motion.div>
      </div>

      {/* Seamless Bottom Gradient (Tepat di atas background, di bawah footer) */}
      <div className="absolute bottom-0 left-0 w-full h-44 sm:h-60 lg:h-72 bg-gradient-to-t from-[#05070b] via-[#05070b]/70 via-50% to-transparent pointer-events-none z-10" />
    </section>
  );
}

/* ============================================
   9. FOOTER
============================================ */
function Footer() {
  const tFooter = useTranslations("landing.footer");

  return (
    <footer className="bg-[#05070b] text-slate-400 py-16 border-t border-white/5 px-6 relative z-50 select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <img 
              src="/favicon.png" 
              alt="MARSFORALL Badge" 
              className="w-8 h-8 object-contain" 
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.src.includes("marsforall-logo.png")) {
                  img.src = "/images/marsforall-logo.png";
                }
              }}
            />
            <span className="text-lg font-bold text-white font-mono tracking-tight notranslate" translate="no">
              MARS<span className="text-[#f97316]">FOR</span>ALL
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-sans font-light">
            {tFooter("brandDesc")}
          </p>
          <div className="text-[11px] text-slate-500 pt-2 font-mono">
            {tFooter("attribution")}
          </div>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="font-bold text-white uppercase tracking-wider mb-2">
            {tFooter("colLayersTitle")}
          </div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("l1")}</Link></div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("l2")}</Link></div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("l3")}</Link></div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("l4")}</Link></div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("l5")}</Link></div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("e6")}</Link></div>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="font-bold text-white uppercase tracking-wider mb-2">
            {tFooter("colCockpitTitle")}
          </div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("c1")}</Link></div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("c2")}</Link></div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("c3")}</Link></div>
          <div><Link href="/peta" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("c4")}</Link></div>
          <div><Link href="#analogi" className="text-slate-400 hover:text-[#f97316] transition-colors">{tFooter("c5")}</Link></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-10 mt-10 border-t border-white/10 text-center text-xs text-slate-500 font-mono">
        {tFooter("policy", { year: new Date().getFullYear().toString() })}
      </div>
    </footer>
  );
}

/* ============================================
   10. SPLASH SCREEN (MARS SCANNER INTRO)
============================================ */
function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const tSplash = useTranslations("landing.splash");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem("mars_splash_seen", "1");
    } catch {}
    onCompleteRef.current();
  };

  useEffect(() => {
    try {
      if (sessionStorage.getItem("mars_splash_seen") === "1") {
        onCompleteRef.current();
        return;
      }
    } catch {}

    const timer = setTimeout(() => {
      handleDismiss();
    }, 1400);

    const onKeyDown = () => handleDismiss();
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleDismiss}
      className="fixed inset-0 z-[99999] bg-[#07090e] flex items-center justify-center overflow-hidden cursor-pointer select-none"
    >
      <div
        className="absolute w-[650px] h-[650px] rounded-full pointer-events-none opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,0.6) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(249,115,22,0.9) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Main Logo Text */}
        <div className="flex items-center justify-center gap-0 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 font-mono">
          <motion.span
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 0.8, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-white"
          >
            MARS
          </motion.span>

          <div className="relative mx-3 sm:mx-5 flex items-center justify-center">
            <span className="text-[#f97316] font-light text-4xl sm:text-5xl md:text-6xl">[</span>
            <span className="text-[#f97316] font-black px-2 text-4xl sm:text-5xl md:text-6xl">FOR</span>
            <span className="text-[#f97316] font-light text-4xl sm:text-5xl md:text-6xl">]</span>

            {/* Cyan Laser Scanner line */}
            <motion.div
              initial={{ left: "0%", opacity: 0 }}
              animate={{
                left: ["0%", "100%", "0%"],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                delay: 0.2,
                duration: 1.4,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              className="absolute top-0 bottom-0 w-[3px] bg-[#06b6d4] shadow-[0_0_16px_4px_rgba(6,182,212,0.8)] z-20"
            />
          </div>

          <motion.span
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 0.8, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-white"
          >
            ALL
          </motion.span>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-[#f97316] text-xs sm:text-sm font-bold font-mono tracking-[0.25em] uppercase mb-8"
        >
          INTERPLANETARY SURVIVAL GUIDE
        </motion.p>

        <div className="w-52 sm:w-64 h-[3px] bg-white/15 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #f97316, #ea580c, #06b6d4)",
            }}
          />
        </div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-slate-300 text-xs sm:text-sm font-mono tracking-wider animate-pulse"
        >
          {tSplash("connecting")}
        </motion.span>
      </div>
    </motion.div>
  );
}

/* ============================================
   MAIN LANDING PAGE EXPORT
============================================ */
export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-[#05070b] text-white selection:bg-[#f97316]/30 transition-colors duration-300">
        <Navbar />
        <MarsVideoHero />
        <MarsTakeMeSection />
        <MarsMissionSection />
        <ImpactSection />
        <MartianScienceMatrixSection />
        <CTAAndStatsSection />
        <ShowcaseSection />
        <Footer />
      </div>
    </>
  );
}
