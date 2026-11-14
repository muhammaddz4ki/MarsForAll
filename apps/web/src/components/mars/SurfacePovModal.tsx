"use client";

import React, { useState } from "react";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";

interface SurfacePovModalProps {
  waypoint: MountSharpWaypoint | null;
  onClose: () => void;
  theme?: "dark" | "light";
}

export const SurfacePovModal: React.FC<SurfacePovModalProps> = ({
  waypoint,
  onClose,
  theme = "dark",
}) => {
  const [povMode, setPovMode] = useState<"raw_imagery" | "tactical_lidar">("raw_imagery");
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  if (!waypoint) return null;

  const isDark = theme === "dark";
  const isBoxwork = waypoint.id === "curiosity_boxwork_2025";
  const isHab = waypoint.id === "gale_hab_alpha";
  const roverImage = waypoint.roverRawImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
      <div className={`relative w-full max-w-4xl border flex flex-col max-h-[92vh] ${
        isDark ? "bg-[#0b0f17] border-slate-700" : "bg-white border-slate-300"
      }`}>
        {/* Top Tactical Banner */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
          isDark ? "bg-[#111827] border-slate-800" : "bg-slate-100 border-slate-300"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-red-500" />
            <div>
              <span className={`font-mono text-[10px] font-bold uppercase tracking-widest block ${
                isDark ? "text-amber-400" : "text-amber-800"
              }`}>
                SURFACE RECONNAISSANCE // {povMode === "raw_imagery" ? "ROVER RAW IMAGERY" : "TACTICAL LIDAR"}
              </span>
              <h2 className={`text-xs font-mono font-semibold uppercase ${isDark ? "text-white" : "text-slate-900"}`}>
                {waypoint.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: RAW IMAGERY vs TACTICAL LIDAR */}
            <div className="flex bg-[#07090e] border border-slate-700 p-0.5 font-mono text-[10px]">
              <button
                onClick={() => setPovMode("raw_imagery")}
                className={`px-2.5 py-1 transition-colors ${
                  povMode === "raw_imagery"
                    ? "bg-amber-600 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ROVER RAW IMAGERY
              </button>
              <button
                onClick={() => setPovMode("tactical_lidar")}
                className={`px-2.5 py-1 transition-colors ${
                  povMode === "tactical_lidar"
                    ? "bg-cyan-600 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                TACTICAL LIDAR/HUD
              </button>
            </div>

            <span className="font-mono text-[10px] text-slate-300 bg-[#161e2e] border border-slate-700 px-2 py-1 tabular-nums">
              ELEV: {waypoint.elevationM} m
            </span>

            <button
              onClick={onClose}
              title="Close Viewer"
              className="w-7 h-7 bg-[#1f2937] hover:bg-[#374151] border border-slate-600 text-slate-300 font-mono text-xs flex items-center justify-center transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Viewport Simulation Area */}
        <div className="relative w-full h-80 sm:h-96 bg-[#170a08] border-b border-slate-800 overflow-hidden flex items-end justify-center">
          {/* MODE A: REAL ROVER RAW IMAGERY (Curiosity / NASA PDS Archive) */}
          {povMode === "raw_imagery" && roverImage && !imageFailed ? (
            <div className="relative w-full h-full">
              {/* Image element with graceful fallback */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={roverImage.imageUrl}
                alt={roverImage.caption}
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover"
              />

              {/* Photo Telemetry HUD Overlay */}
              <div className="absolute top-2 left-2 right-2 flex justify-between items-center bg-[#07090e]/90 border border-slate-700 px-3 py-1 font-mono text-[9px] text-slate-300 pointer-events-none">
                <div>
                  <span className="text-amber-400 font-bold">NASA/JPL-CALTECH CURIOSITY // {roverImage.camera}</span>
                  <span className="text-slate-600 mx-2">|</span>
                  <span className="text-cyan-400 font-bold tabular-nums">SOL {roverImage.sol}</span>
                </div>
                <div className="tabular-nums text-slate-400">
                  AZ: {roverImage.pointingAzimuthDeg}° / ELEV: {roverImage.elevationAngleDeg}°
                </div>
              </div>

              {/* Bottom Caption Overlay */}
              <div className="absolute bottom-2 left-2 right-2 bg-[#07090e]/95 border border-slate-700 p-2 font-mono text-[10px] text-slate-200 pointer-events-none">
                <span className="text-amber-400 font-bold uppercase block text-[9px]">TARGET: {roverImage.targetName}</span>
                <p className="mt-0.5 text-slate-300 text-[10px] leading-tight">
                  &quot;{roverImage.caption}&quot; — <span className="text-slate-400">{roverImage.sourceCredit}</span>
                </p>
              </div>
            </div>
          ) : (
            /* MODE B: TACTICAL LIDAR / TERRAIN WIREFRAME VIEW */
            <div className="relative w-full h-full bg-[#1e0e0a] flex items-end justify-center">
              {/* Peak Silhouette */}
              <svg className="absolute bottom-16 w-full h-48 opacity-60 text-[#3b1913]" viewBox="0 0 1000 300" preserveAspectRatio="none">
                <polygon points="0,300 150,140 320,180 500,60 700,160 880,110 1000,300" fill="currentColor" />
              </svg>

              {/* Near Field Terrain */}
              <svg className="absolute bottom-0 w-full h-40 text-[#140806]" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <path
                  d="M0,200 L0,120 Q120,80 250,110 T500,85 T750,120 T1000,90 L1000,200 Z"
                  fill="currentColor"
                />
                {isBoxwork && (
                  <g stroke="#f59e0b" strokeWidth="2" fill="none">
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

              {/* Tactical Crosshair Reticle */}
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

                <div className="self-center flex items-center justify-center">
                  <div className="w-12 h-12 border border-cyan-500/70 flex items-center justify-center">
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
                    <span>RAD DOSE: <span className="tabular-nums">{waypoint.surfaceRadiationMSvSol} mSv/sol</span></span>
                    <br />
                    <span>TACTICAL LIDAR ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rover & Science Instrument Detail Cards */}
        <div className={`p-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 overflow-y-auto ${
          isDark ? "bg-[#0b0f17]" : "bg-slate-50"
        }`}>
          {/* Geochemical Abundances */}
          <div className={`p-2.5 border font-mono ${
            isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
          }`}>
            <span className={`text-[10px] uppercase font-bold block mb-1 ${
              isDark ? "text-cyan-400" : "text-cyan-800"
            }`}>
              GEOCHEMISTRY (APXS / CHEMCAM)
            </span>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">SULFATES (SO₃):</span>
                <span className="font-bold text-amber-400 tabular-nums">{waypoint.mineralogy.sulfatePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HEMATITE (Fe₂O₃):</span>
                <span className="font-bold text-red-400 tabular-nums">{waypoint.mineralogy.hematitePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CLAY (PHYLLOSILICATES):</span>
                <span className="font-bold text-emerald-400 tabular-nums">{waypoint.mineralogy.phyllosilicateClayPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SILICA (SiO₂):</span>
                <span className="font-bold text-slate-300 tabular-nums">{waypoint.mineralogy.silicaPercent}%</span>
              </div>
            </div>
          </div>

          {/* Curiosity In-Situ Log */}
          <div className={`p-2.5 border font-mono ${
            isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
          }`}>
            <span className="text-[10px] text-amber-500 uppercase font-bold block mb-1">
              MSL GROUND TRUTH
            </span>
            <p className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>
              {waypoint.roverGroundTruth?.instrument}: {waypoint.roverGroundTruth?.targetName}
            </p>
            <p className={`text-[10px] mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              &quot;{waypoint.roverGroundTruth?.keyFinding}&quot;
            </p>
          </div>

          {/* Astronaut Suit Traverse Conditions */}
          <div className={`p-2.5 border font-mono flex flex-col justify-between ${
            isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
          }`}>
            <div>
              <span className="text-[10px] text-emerald-500 uppercase font-bold block mb-1">
                SUIT MOBILITY ENVELOPE
              </span>
              <p className={`text-[10px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                SLOPE: <span className="font-bold tabular-nums">{waypoint.meanSlopeDeg}°</span> (MAX: <span className="tabular-nums">{waypoint.maxSlopeDeg}°</span>)
              </p>
              <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
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

        {/* Footer Attribution */}
        <div className={`px-4 py-2 border-t text-[10px] font-mono flex items-center justify-between ${
          isDark ? "bg-[#0b0f17] border-slate-800 text-slate-400" : "bg-slate-100 border-slate-300 text-slate-600"
        }`}>
          <span>ATTRIBUTION: NASA / JPL-CALTECH / MSSS / PDS GEOSCIENCES</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#1f2937] hover:bg-[#374151] border border-slate-700 text-white font-mono text-[11px] font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurfacePovModal;
