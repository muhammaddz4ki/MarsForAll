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
  const isTorridon = waypoint.id === "glen_torridon_trough";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-amber-500/40 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Tactical Banner */}
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <div>
              <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
                MASTCAM / POV EYE-LEVEL SURFACE RECONNAISSANCE
              </span>
              <h2 className="text-sm font-semibold text-white">{waypoint.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded">
              ELEV: {waypoint.elevationM} m
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Viewport Simulation Area */}
        <div className="relative w-full h-80 sm:h-96 bg-gradient-to-b from-[#421b14] via-[#752a1b] to-[#1f0e0b] overflow-hidden flex items-end justify-center">
          {/* Martian Distant Horizon & Sky */}
          <div className="absolute inset-0 opacity-70 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-700/40 via-orange-950/30 to-black/60" />

          {/* Mount Sharp Central Peak Background Silhouette */}
          <svg className="absolute bottom-16 w-full h-48 opacity-40 text-orange-950" viewBox="0 0 1000 300" preserveAspectRatio="none">
            <polygon points="0,300 150,140 320,180 500,60 700,160 880,110 1000,300" fill="currentColor" />
          </svg>

          {/* Near Field Terrain & Boxwork / Rock Geometry */}
          <svg className="absolute bottom-0 w-full h-40 text-[#291310]" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <path
              d="M0,200 L0,120 Q120,80 250,110 T500,85 T750,120 T1000,90 L1000,200 Z"
              fill="currentColor"
            />
            {/* Boxwork Vein polygonal ridges or rocks */}
            {isBoxwork && (
              <g stroke="#f59e0b" strokeWidth="2.5" fill="none" opacity="0.85">
                <path d="M 280,125 L 340,95 L 420,115 L 490,85 L 560,110" />
                <path d="M 340,95 L 380,60 L 440,75 L 420,115" />
                <path d="M 440,75 L 510,50 L 530,90" />
                <circle cx="340" cy="95" r="4" fill="#fbbf24" />
                <circle cx="440" cy="75" r="4" fill="#fbbf24" />
                <circle cx="510" cy="50" r="4" fill="#fbbf24" />
              </g>
            )}
            {isHab && (
              <g fill="#10b981" opacity="0.9">
                <ellipse cx="500" cy="115" rx="55" ry="32" fill="#047857" stroke="#34d399" strokeWidth="2" />
                <rect x="420" y="115" width="25" height="15" fill="#065f46" />
                <rect x="555" y="115" width="25" height="15" fill="#065f46" />
              </g>
            )}
          </svg>

          {/* Simulated Tactical Visor HUD Reticle */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
            <div className="flex justify-between items-start text-cyan-400 font-mono text-[10px]">
              <div>
                <span>AZIMUTH: 142° SE</span>
                <br />
                <span>PITCH: -4.5° EYE-LEVEL</span>
              </div>
              <div className="text-right">
                <span>REMS AMBIENT: -24°C</span>
                <br />
                <span>GROUND TEMP: +3°C (SOL NOON)</span>
              </div>
            </div>

            {/* Center Crosshairs */}
            <div className="self-center flex items-center justify-center">
              <div className="w-16 h-16 border border-cyan-400/50 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              </div>
            </div>

            <div className="flex justify-between items-end text-amber-400 font-mono text-[10px]">
              <div>
                <span>OPTICAL DUST TAU: 0.38</span>
                <br />
                <span>UV FLUX: 8.2 W/m²</span>
              </div>
              <div className="text-right text-emerald-400">
                <span>RAD DOSIMETRY: {waypoint.surfaceRadiationMSvSol} mSv/sol</span>
                <br />
                <span>STATUS: NOMINAL SURFACE SENSING</span>
              </div>
            </div>
          </div>

          {/* Filter Switcher Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-700/80 backdrop-blur z-10 font-mono text-[10px]">
            <button
              onClick={() => setActiveFilter("natural")}
              className={`px-3 py-1 rounded transition-colors ${
                activeFilter === "natural" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-300 hover:text-white"
              }`}
            >
              Natural Color
            </button>
            <button
              onClick={() => setActiveFilter("mastcam_false_color")}
              className={`px-3 py-1 rounded transition-colors ${
                activeFilter === "mastcam_false_color"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Mastcam IR Filter
            </button>
            <button
              onClick={() => setActiveFilter("chemcam_targets")}
              className={`px-3 py-1 rounded transition-colors ${
                activeFilter === "chemcam_targets"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              ChemCam Laser Grid
            </button>
          </div>
        </div>

        {/* Rover & Science Instrument Detail Cards */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/60 overflow-y-auto">
          {/* Mineralogy Breakdown */}
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="font-mono text-[10px] text-cyan-400 uppercase block mb-1.5">
              Geochemical Abundances (APXS)
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Sulfates (SO3):</span>
                <span className="font-mono font-bold text-amber-300">{waypoint.mineralogy.sulfatePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hematite / Iron Oxide:</span>
                <span className="font-mono font-bold text-rose-300">{waypoint.mineralogy.hematitePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phyllosilicates (Clay):</span>
                <span className="font-mono font-bold text-emerald-300">{waypoint.mineralogy.phyllosilicateClayPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Silica (SiO2):</span>
                <span className="font-mono font-bold text-slate-200">{waypoint.mineralogy.silicaPercent}%</span>
              </div>
            </div>
          </div>

          {/* In-Situ Discovery Log */}
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <span className="font-mono text-[10px] text-amber-400 uppercase block mb-1">
              Curiosity Rover Ground Truth
            </span>
            <p className="text-[11px] font-semibold text-slate-200">
              {waypoint.roverGroundTruth?.instrument}: {waypoint.roverGroundTruth?.targetName}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
              "{waypoint.roverGroundTruth?.keyFinding}"
            </p>
          </div>

          {/* Astronaut Suit Traverse Conditions */}
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[10px] text-emerald-400 uppercase block mb-1">
                EVA Suit Traverse Envelope
              </span>
              <p className="text-[11px] text-slate-300">
                Mean slope: <span className="font-mono font-bold text-white">{waypoint.meanSlopeDeg}°</span> (max: {waypoint.maxSlopeDeg}°)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Thermal Inertia: {waypoint.apparentThermalInertiaTiu} tiu (CT: {waypoint.consistencyIndexCT > 0 ? "+1" : waypoint.consistencyIndexCT})
              </p>
            </div>
            <div className="mt-2">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                  waypoint.evaSuitTraversable
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-red-500/20 text-red-300 border border-red-500/40"
                }`}
              >
                {waypoint.evaSuitTraversable ? "✓ TRAVERSABLE BY ASTRONAUT" : "⚠ EXCEEDS SAFE SUIT ENVELOPE"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Attribution */}
        <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Simulated terrain camera telemetry based on Curiosity Mastcam &amp; HiRISE elevation models</span>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurfacePovModal;
