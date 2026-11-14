"use client";

import React, { useState } from "react";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";

interface SurfacePovModalProps {
  waypoint: MountSharpWaypoint | null;
  onClose: () => void;
}

export const SurfacePovModal: React.FC<SurfacePovModalProps> = ({ waypoint, onClose }) => {
  const [activeFilter, setActiveFilter] = useState<"natural" | "mastcam_false_color" | "chemcam_targets">("natural");

  if (!waypoint) return null;

  const isBoxwork = waypoint.id === "curiosity_boxwork_2025";
  const isHab = waypoint.id === "gale_hab_alpha";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-4xl bg-[#0b0f17] border border-slate-700 flex flex-col max-h-[90vh]">
        {/* Top Tactical Banner (Solid, Sharp 1px Border) */}
        <div className="bg-[#111827] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-red-500" />
            <div>
              <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                MASTCAM // EYE-LEVEL SURFACE RECONNAISSANCE
              </span>
              <h2 className="text-xs font-mono font-semibold text-white uppercase">{waypoint.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-300 bg-[#161e2e] border border-slate-700 px-2 py-0.5 tabular-nums">
              ELEV: {waypoint.elevationM} m
            </span>
            <button
              onClick={onClose}
              title="Close Viewer"
              className="w-6 h-6 bg-[#1f2937] hover:bg-[#374151] border border-slate-600 text-slate-300 font-mono text-xs flex items-center justify-center transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Viewport Simulation Area (SOLID FLAT COLORS, NO GRADIENTS) */}
        <div className="relative w-full h-80 sm:h-96 bg-[#26130f] border-b border-slate-800 overflow-hidden flex items-end justify-center">
          {/* Mount Sharp Central Peak Background Silhouette (Solid Flat Polygons) */}
          <svg className="absolute bottom-16 w-full h-48 opacity-50 text-[#3b1913]" viewBox="0 0 1000 300" preserveAspectRatio="none">
            <polygon points="0,300 150,140 320,180 500,60 700,160 880,110 1000,300" fill="currentColor" />
          </svg>

          {/* Near Field Terrain & Boxwork / Rock Geometry (Solid Dark Ground) */}
          <svg className="absolute bottom-0 w-full h-40 text-[#170a08]" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <path
              d="M0,200 L0,120 Q120,80 250,110 T500,85 T750,120 T1000,90 L1000,200 Z"
              fill="currentColor"
            />
            {/* Boxwork Vein polygonal ridges */}
            {isBoxwork && (
              <g stroke="#d97706" strokeWidth="2" fill="none">
                <path d="M 280,125 L 340,95 L 420,115 L 490,85 L 560,110" />
                <path d="M 340,95 L 380,60 L 440,75 L 420,115" />
                <path d="M 440,75 L 510,50 L 530,90" />
                <rect x="338" y="93" width="4" height="4" fill="#fbbf24" />
                <rect x="438" y="73" width="4" height="4" fill="#fbbf24" />
                <rect x="508" y="48" width="4" height="4" fill="#fbbf24" />
              </g>
            )}
            {isHab && (
              <g fill="#065f46">
                <ellipse cx="500" cy="115" rx="55" ry="32" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <rect x="420" y="115" width="25" height="15" fill="#047857" />
                <rect x="555" y="115" width="25" height="15" fill="#047857" />
              </g>
            )}
          </svg>

          {/* Simulated Tactical HUD Reticle (Sharp 1px vector lines, tabular nums) */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 font-mono text-[10px]">
            <div className="flex justify-between items-start text-cyan-400">
              <div>
                <span>AZIMUTH: <span className="tabular-nums">142° SE</span></span>
                <br />
                <span>PITCH: <span className="tabular-nums">-4.5°</span></span>
              </div>
              <div className="text-right">
                <span>REMS AMBIENT: <span className="tabular-nums">-24°C</span></span>
                <br />
                <span>GROUND TEMP: <span className="tabular-nums">+3°C</span></span>
              </div>
            </div>

            {/* Center Crosshairs */}
            <div className="self-center flex items-center justify-center">
              <div className="w-12 h-12 border border-cyan-500/60 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-400" />
              </div>
            </div>

            <div className="flex justify-between items-end text-amber-400">
              <div>
                <span>OPTICAL TAU: <span className="tabular-nums">0.38</span></span>
                <br />
                <span>UV FLUX: <span className="tabular-nums">8.2 W/m²</span></span>
              </div>
              <div className="text-right text-emerald-400">
                <span>RAD DOSIMETRY: <span className="tabular-nums">{waypoint.surfaceRadiationMSvSol} mSv/sol</span></span>
                <br />
                <span>STATUS: NOMINAL GROUND TELEMETRY</span>
              </div>
            </div>
          </div>

          {/* Filter Switcher Overlay (Flat Solid) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1 bg-[#0b0f17] p-1 border border-slate-700 z-10 font-mono text-[10px]">
            <button
              onClick={() => setActiveFilter("natural")}
              className={`px-2.5 py-0.5 transition-colors ${
                activeFilter === "natural" ? "bg-amber-600 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              NATURAL
            </button>
            <button
              onClick={() => setActiveFilter("mastcam_false_color")}
              className={`px-2.5 py-0.5 transition-colors ${
                activeFilter === "mastcam_false_color" ? "bg-amber-600 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              MASTCAM IR
            </button>
            <button
              onClick={() => setActiveFilter("chemcam_targets")}
              className={`px-2.5 py-0.5 transition-colors ${
                activeFilter === "chemcam_targets" ? "bg-amber-600 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              CHEMCAM LIBS
            </button>
          </div>
        </div>

        {/* Rover & Science Instrument Detail Cards (Flat Solid Cards, 1px Border) */}
        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-[#0b0f17] overflow-y-auto">
          {/* Geochemical Abundances */}
          <div className="bg-[#111827] p-2.5 border border-slate-800 font-mono">
            <span className="text-[10px] text-cyan-400 uppercase font-bold block mb-1">
              GEOCHEMISTRY (APXS)
            </span>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">SULFATES (SO3):</span>
                <span className="font-bold text-amber-300 tabular-nums">{waypoint.mineralogy.sulfatePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HEMATITE (Fe2O3):</span>
                <span className="font-bold text-rose-300 tabular-nums">{waypoint.mineralogy.hematitePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CLAY (PHYLLOSILICATES):</span>
                <span className="font-bold text-emerald-300 tabular-nums">{waypoint.mineralogy.phyllosilicateClayPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SILICA (SiO2):</span>
                <span className="font-bold text-slate-200 tabular-nums">{waypoint.mineralogy.silicaPercent}%</span>
              </div>
            </div>
          </div>

          {/* Curiosity In-Situ Log */}
          <div className="bg-[#111827] p-2.5 border border-slate-800 font-mono">
            <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">
              MSL GROUND TRUTH
            </span>
            <p className="text-[10px] font-bold text-slate-200">
              {waypoint.roverGroundTruth?.instrument}: {waypoint.roverGroundTruth?.targetName}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              "{waypoint.roverGroundTruth?.keyFinding}"
            </p>
          </div>

          {/* Astronaut Suit Traverse Conditions */}
          <div className="bg-[#111827] p-2.5 border border-slate-800 font-mono flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
                SUIT MOBILITY ENVELOPE
              </span>
              <p className="text-[10px] text-slate-300">
                SLOPE: <span className="font-bold text-white tabular-nums">{waypoint.meanSlopeDeg}°</span> (MAX: <span className="tabular-nums">{waypoint.maxSlopeDeg}°</span>)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                THERMAL INERTIA: <span className="tabular-nums">{waypoint.apparentThermalInertiaTiu} tiu</span>
              </p>
            </div>
            <div className="mt-2">
              <span
                className={`inline-block px-1.5 py-0.5 text-[9px] font-bold border ${
                  waypoint.evaSuitTraversable
                    ? "bg-[#064e3b] text-[#34d399] border-[#059669]"
                    : "bg-[#7f1d1d] text-[#fca5a5] border-[#dc2626]"
                }`}
              >
                {waypoint.evaSuitTraversable ? "[TRAVERSABLE]" : "[EXCEEDS SAFE ENVELOPE]"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Attribution (Solid Flat) */}
        <div className="bg-[#0b0f17] px-4 py-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <span>SOURCE: NASA MSL MASTCAM / HIRISE ELEVATION TILES</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#1f2937] hover:bg-[#374151] border border-slate-700 text-white font-mono text-[11px] transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurfacePovModal;
