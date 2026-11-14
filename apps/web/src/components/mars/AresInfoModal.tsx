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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <AresMissionBadge size={38} showSubtext />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          <section>
            <h4 className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              Mission Statement &amp; Challenge Core Brief
            </h4>
            <p>
              <strong>ARES-PATH // GALE-01</strong> is an autonomous planetary GIS, machine learning prospector,
              and Marswalk route navigation system developed for the <strong>NASA Space Apps Challenge 2026</strong> submission:
              <em>"Interplanetary Survival Guide: Martian Map"</em>.
            </p>
            <p className="mt-1.5 text-slate-400">
              While global exploratory portals (such as JPL Mars Trek) address macro-scale regional views,
              ARES-PATH solves the hyperlocalized operational gap required for human astronaut surface excursions
              ("Marswalks") on Mount Sharp (Aeolis Mons), Gale Crater, specifically evaluating the 2025 Curiosity rover
              Boxwork crystalline mineral vein discoveries.
            </p>
          </section>

          <section className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
            <h4 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Scientific Data Attribution &amp; Literature Grounding
            </h4>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-300">
              <li>
                <strong>USGS Planetary Geologic Mapping Program &amp; HiRISE Mosaic:</strong>
                Sub-meter visible orbital basemaps and stratigraphic unit polygons.
              </li>
              <li>
                <strong>NASA AMMOS MMGIS (github.com/NASA-AMMOS/MMGIS &amp; Paper 2541):</strong>
                Hyperlocalized instrument telemetry integration (Mastcam, ChemCam LIBS, APXS, REMS, RAD).
              </li>
              <li>
                <strong>Subsurface Water-Ice &amp; Thermal Inertia Model (Morgan et al., Nature Astronomy 2020):</strong>
                MGS TES &amp; Odyssey THEMIS Apparent Thermal Inertia (ATI baseline ~75 tiu) and consistency index (CT = +1, 0, -1).
              </li>
              <li>
                <strong>Impact Morphology &amp; Photometry (Papers 2909 &amp; 2132):</strong>
                Crater degradation scaling ($\beta$ exponents) and Hapke macroscopic roughness parameters for suit traversal impedance.
              </li>
              <li>
                <strong>NASA Worldview / GIBS &amp; OpenStreetMap Overpass API:</strong>
                Real-time terrestrial analogue multispectral data (Atacama Desert, Haughton Crater, Death Valley, Río Tinto).
              </li>
              <li>
                <strong>Mars Curiosity &amp; Perseverance Raw Images Archive:</strong>
                Reference imagery for astronaut eye-level Surface Point-of-View (POV) simulation.
              </li>
            </ul>
          </section>

          <section className="text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Strict Non-Endorsement &amp; Branding Notice:</span>
            <p className="mt-1">
              This independent project is submitted for academic and hackathon evaluation in the NASA Space Apps Challenge 2026.
              In full compliance with NASA branding regulations, no official NASA insignia ("meatball") or NASA "worm" logos are used.
              All space agency references represent factual scientific data source attributions.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition-colors"
          >
            Acknowledge &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default AresInfoModal;
