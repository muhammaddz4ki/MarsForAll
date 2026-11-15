"use client";

import React, { useRef, useEffect } from "react";

export default function MarsVideoHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasScrolledAwayRef = useRef<boolean>(false);

  // Play continuously on loop, pause when scrolled away, resume when scrolled back
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    // Ensure loop is explicitly set on video element
    video.loop = true;
    video.play().catch(() => { });

    // Fallback: If for any reason loop property stalls, restart immediately on ended
    const handleEnded = () => {
      video.currentTime = 0;
      video.play().catch(() => { });
    };
    video.addEventListener("ended", handleEnded);

    // IntersectionObserver to pause when offscreen and resume when in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
            // In view: play/resume video continuously
            video.play().catch(() => { });
            hasScrolledAwayRef.current = false;
          } else if (!entry.isIntersecting || entry.intersectionRatio < 0.1) {
            // Out of view: pause to save resources
            hasScrolledAwayRef.current = true;
            video.pause();
          }
        });
      },
      { threshold: [0, 0.1, 0.2, 0.5, 0.8] }
    );

    observer.observe(section);

    // Watch scroll position for instant resume when returning to top
    const handleScroll = () => {
      if (window.scrollY <= 50 && hasScrolledAwayRef.current) {
        if (videoRef.current) {
          videoRef.current.play().catch(() => { });
          hasScrolledAwayRef.current = false;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      video.removeEventListener("ended", handleEnded);
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToNext = () => {
    if (sectionRef.current) {
      const nextSection = sectionRef.current.nextElementSibling;
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen min-h-[600px] overflow-hidden bg-black select-none"
    >
      {/* 1. FULLSCREEN BACKGROUND VIDEO (Loops continuously) */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster="/images/mars-hero-exact.jpg"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src="/video/hero-mars.mp4" type="video/mp4" />
        <source src="/videos/hero-mars.mp4" type="video/mp4" />
        <source src="/hero-mars.mp4" type="video/mp4" />
      </video>

      {/* 2. TOP SHADOW VIGNETTE (For navbar contrast) */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent z-10 pointer-events-none" />

      {/* 3. DEEP BOTTOM SHADOW VIGNETTE (Ultra-smooth seamless black transition into next page) */}
      <div className="absolute bottom-0 left-0 right-0 h-64 sm:h-80 lg:h-[420px] bg-gradient-to-t from-[#05070b] via-[#05070b]/90 via-40% via-[#05070b]/40 to-transparent z-10 pointer-events-none" />

      {/* 4. CLEAN SCROLL DOWN PILL INDICATOR */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-auto">
        <button
          type="button"
          onClick={scrollToNext}
          className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
          aria-label="Scroll ke halaman berikutnya"
        >
          <div className="w-7 h-11 rounded-full border border-white/25 group-hover:border-[#f97316] flex items-start justify-center p-1.5 transition-colors bg-black/40 backdrop-blur-sm">
            <div className="w-1.5 h-2.5 bg-[#f97316] rounded-full animate-bounce shadow-[0_0_8px_#f97316]" />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 group-hover:text-white uppercase transition-colors">
            Scroll
          </span>
        </button>
      </div>
    </section>
  );
}
