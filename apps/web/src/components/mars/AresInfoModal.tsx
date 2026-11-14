"use client";

import React from "react";
import AresMissionBadge from "../AresMissionBadge";

interface AresInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AresInfoModal: React.FC<AresInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="relative w-full max-w-2xl bg-[#0b0f17] border border-slate-700 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#111827] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <AresMissionBadge size={32} showSubtext />
          <button
            onClick={onClose}
            title="Close Info"
            className="w-6 h-6 bg-[#1f2937] hover:bg-[#374151] border border-slate-600 text-slate-300 font-mono text-xs flex items-center justify-center transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-300 leading-relaxed font-sans">
          <section>
            <h4 className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              MISSION BRIEF &amp; ARCHITECTURAL SCOPE
            </h4>
            <p className="font-mono text-[11px] text-slate-300">
              <strong>ARES-PATH // GALE-01</strong> is an autonomous planetary GIS, machine learning prospector,
              and Marswalk route navigation system developed for the <strong>NASA Space Apps Challenge 2026</strong> submission:
              <em>"Interplanetary Survival Guide: Martian Map"</em>.
            </p>
            <p className="mt-1.5 text-slate-400 font-mono text-[11px]">
              While global exploratory portals (such as JPL Mars Trek) address regional views,
              ARES-PATH solves the hyperlocalized operational gap required for human astronaut surface excursions
              ("Marswalks") on Mount Sharp (Aeolis Mons), Gale Crater, specifically evaluating the 2025 Curiosity rover
              Boxwork crystalline mineral vein discoveries.
            </p>
          </section>

          <section className="bg-[#111827] p-3 border border-slate-800 space-y-1.5 font-mono text-[10px]">
            <h4 className="font-bold text-cyan-400 uppercase tracking-wider">
              SCIENTIFIC DATA ATTRIBUTIONS
            </h4>
            <ul className="space-y-1 text-slate-300 list-none">
              <li>
                <span className="text-amber-400 font-bold">[1] USGS ASTROGEOLOGY &amp; HIRISE:</span> Sub-meter visible orbital basemaps and stratigraphic unit polygons.
              </li>
              <li>
                <span className="text-amber-400 font-bold">[2] NASA AMMOS MMGIS (PAPER 2541):</span> Hyperlocalized instrument telemetry architecture (Mastcam, ChemCam LIBS, APXS, REMS, RAD).
              </li>
              <li>
                <span className="text-amber-400 font-bold">[3] THERMAL INERTIA (MORGAN ET AL. 2020):</span> MGS TES &amp; Odyssey THEMIS Apparent Thermal Inertia (ATI threshold 75 tiu) and consistency index (CT = +1, 0, -1).
              </li>
              <li>
                <span className="text-amber-400 font-bold">[4] IMPACT MORPHOLOGY (PAPERS 2909 &amp; 2132):</span> Crater degradation scaling and Hapke macroscopic roughness parameters for suit traversal impedance.
              </li>
              <li>
                <span className="text-amber-400 font-bold">[5] NASA WORLDVIEW / GIBS &amp; OVERPASS:</span> Real-time terrestrial analogue multispectral data (Atacama Desert, Haughton Crater, Death Valley, Rio Tinto).
              </li>
              <li>
                <span className="text-amber-400 font-bold">[6] MSL CURIOSITY RAW IMAGES:</span> Reference telemetry for astronaut eye-level Surface Point-of-View (POV) simulation.
              </li>
            </ul>
          </section>

          <section className="text-[10px] text-slate-400 font-mono">
            <span className="font-bold text-slate-300 uppercase">[STRICT ZERO NASA LOGO NOTICE]</span>
            <p className="mt-0.5">
              This independent project is submitted for academic and hackathon evaluation in the NASA Space Apps Challenge 2026.
              In strict compliance with NASA regulations, no official NASA insignia ("meatball") or NASA "worm" logos are used.
              All space agency references represent factual scientific data source attributions.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-[#111827] px-4 py-2 border-t border-slate-800 flex justify-end font-mono">
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
