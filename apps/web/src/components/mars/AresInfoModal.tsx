"use client";

import React from "react";
import MarsForAllBadge from "../MarsForAllBadge";

interface AresInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
}

export const AresInfoModal: React.FC<AresInfoModalProps> = ({
  isOpen,
  onClose,
  theme = "dark",
}) => {
  if (!isOpen) return null;
  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className={`relative w-full max-w-2xl ${
        isDark ? "bg-[#0b0f17] border-slate-700" : "bg-white border-slate-300"
      } border flex flex-col max-h-[85vh]`}>
        {/* Header */}
        <div className={`${
          isDark ? "bg-[#111827] border-slate-800" : "bg-slate-100 border-slate-300"
        } px-4 py-3 border-b flex items-center justify-between`}>
          <MarsForAllBadge size={34} showSubtext />
          <button
            onClick={onClose}
            title="Close Info"
            className={`w-6 h-6 ${
              isDark ? "bg-[#1f2937] hover:bg-[#374151] border-slate-600 text-slate-300" : "bg-white hover:bg-slate-200 border-slate-300 text-slate-700"
            } border font-mono text-xs flex items-center justify-center transition-colors`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={`p-4 overflow-y-auto space-y-3.5 text-xs ${
          isDark ? "text-slate-300" : "text-slate-700"
        } leading-relaxed font-sans`}>
          <section>
            <h4 className="font-mono text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
              MISSION BRIEF &amp; ARCHITECTURAL SCOPE
            </h4>
            <p className="font-mono text-[11px]">
              <strong>MARSFORALL // GALE-01</strong> is an autonomous planetary GIS, machine learning prospector,
              and Marswalk route navigation system developed for the <strong>NASA Space Apps Challenge 2026</strong> submission:
              <em>"Interplanetary Survival Guide: Martian Map"</em>.
            </p>
            <p className={`mt-1.5 ${isDark ? "text-slate-400" : "text-slate-600"} font-mono text-[11px]`}>
              While global exploratory portals (such as JPL Mars Trek) address regional views,
              MARSFORALL solves the hyperlocalized operational gap required for human astronaut surface excursions
              ("Marswalks") on Mount Sharp (Aeolis Mons), Gale Crater, specifically integrating 5 NASA operational layers,
              the 2025 Curiosity rover Boxwork mineral veins, MGS MAG crustal magnetic shielding, and historical traverse logs.
            </p>
          </section>

          <section className={`${
            isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"
          } p-3 border space-y-1.5 font-mono text-[10px]`}>
            <h4 className="font-bold text-cyan-500 uppercase tracking-wider">
              SCIENTIFIC DATA ATTRIBUTIONS
            </h4>
            <ul className="space-y-1 list-none">
              <li>
                <span className="text-amber-500 font-bold">[1] USGS ASTROGEOLOGY &amp; HIRISE:</span> Sub-meter visible orbital basemaps and stratigraphic unit polygons.
              </li>
              <li>
                <span className="text-amber-500 font-bold">[2] NASA AMMOS MMGIS (PAPER 2541):</span> Hyperlocalized instrument telemetry architecture (Mastcam, ChemCam LIBS oxides, APXS, REMS, RAD).
              </li>
              <li>
                <span className="text-amber-500 font-bold">[3] THERMAL INERTIA &amp; SWIM (MORGAN ET AL. 2020):</span> 5-term SWIM index consistency (CN, CT, CG, CRS, CRD) and dielectric permittivity ε' calculation.
              </li>
              <li>
                <span className="text-amber-500 font-bold">[4] IMPACT MORPHOLOGY (PAPERS 2909 &amp; 2132):</span> Crater degradation scaling, Hapke macroscopic roughness, and Lambertian photometric scattering.
              </li>
              <li>
                <span className="text-amber-500 font-bold">[5] NASA WORLDVIEW / GIBS &amp; OVERPASS:</span> Real-time terrestrial analogue multispectral data (Atacama Desert, Haughton Crater, Death Valley, Rio Tinto).
              </li>
              <li>
                <span className="text-amber-500 font-bold">[6] MSL CURIOSITY RAW IMAGES:</span> Official Mastcam/Navcam raw photos for astronaut eye-level Surface Point-of-View (POV) verification.
              </li>
            </ul>
          </section>

          <section className={`${
            isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"
          } p-3 border space-y-1 font-mono text-[10px]`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 uppercase tracking-wider">
                PROJECT SOURCE // OPEN REPOSITORY
              </span>
              <a
                href="https://github.com/muhammaddz4ki/MarsForAll"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline font-bold"
              >
                github.com/muhammaddz4ki/MarsForAll
              </a>
            </div>
            <p className={`${isDark ? "text-slate-400" : "text-slate-600"} mt-0.5`}>
              Official open-source repository for the NASA Space Apps Challenge 2026 hackathon submission.
              Contains full monorepo source code, mathematical planetary science engines, 3D WebGL photogrammetric explorer, and offline dataset bundles.
            </p>
          </section>

          <section className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"} font-mono`}>
            <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-800"} uppercase`}>[STRICT ZERO NASA LOGO NOTICE]</span>
            <p className="mt-0.5">
              This independent project is submitted for academic and hackathon evaluation in the NASA Space Apps Challenge 2026.
              In strict compliance with NASA regulations, no official NASA insignia ("meatball") or NASA "worm" logos are used.
              All space agency references represent factual scientific data source attributions.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className={`${
          isDark ? "bg-[#111827] border-slate-800" : "bg-slate-100 border-slate-300"
        } px-4 py-2 border-t flex justify-end font-mono`}>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold uppercase transition-colors"
          >
            ACKNOWLEDGE &amp; RETURN
          </button>
        </div>
      </div>
    </div>
  );
};

export default AresInfoModal;