"use client";

import React, { useState, useEffect } from "react";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";
import { MarswalkRouteResult } from "@/lib/martian/marswalkRouter";

interface VisorHudOverlayProps {
  selectedWaypoint: MountSharpWaypoint | null;
  activeRoute: MarswalkRouteResult | null;
  onOpenPovModal: (wp: MountSharpWaypoint) => void;
  onToggleViewMode: () => void;
}

export const VisorHudOverlay: React.FC<VisorHudOverlayProps> = ({
  selectedWaypoint,
  activeRoute,
  onOpenPovModal,
  onToggleViewMode,
}) => {
  const [heading, setHeading] = useState<number>(142);
  const [heartRate, setHeartRate] = useState<number>(84);
  const [o2Level, setO2Level] = useState<number>(activeRoute?.remainingO2Percent ?? 92);

  // Subtle live fluctuation for realism
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate(Math.round(82 + Math.random() * 6));
      setHeading((prev) => (prev + (Math.random() > 0.5 ? 1 : -1) + 360) % 360);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const target = selectedWaypoint ?? activeRoute?.targetWaypoint;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Curved Visor Vignette Frame */}
      <div className="absolute inset-0 rounded-[40px] border-[14px] border-slate-900/60 shadow-[inset_0_0_80px_rgba(6,182,212,0.15)] pointer-events-none" />

      {/* TOP HUD BAR: Tactical Telemetry & Compass Tape */}
      <div className="relative z-10 flex items-center justify-between pointer-events-auto">
        {/* Left: EVA Mission Time & Comm Status */}
        <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-cyan-500/40 text-cyan-400 font-mono text-[11px] flex items-center gap-3 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="font-bold tracking-widest">EVA-01 // SOL 4180</div>
            <div className="text-[9px] text-slate-400">MRO RELAY: LOCKED (401.5 MHz)</div>
          </div>
        </div>

        {/* Center: Dynamic Heading Compass Tape */}
        <div className="hidden md:flex flex-col items-center bg-slate-950/85 backdrop-blur-md px-6 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 font-mono shadow-lg">
          <div className="text-[9px] text-slate-400 tracking-widest uppercase">ASTRONAUT BEARING</div>
          <div className="flex items-center gap-4 text-xs font-black">
            <span className="text-slate-500">120°</span>
            <span className="text-slate-400">130°</span>
            <span className="text-amber-300 text-sm border-b-2 border-amber-400 px-1.5">
              {heading}° SE
            </span>
            <span className="text-slate-400">150°</span>
            <span className="text-slate-500">160°</span>
          </div>
        </div>

        {/* Right: Mode Switcher & Return to Habitat */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleViewMode}
            className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/50 px-3 py-1.5 rounded-lg font-mono text-xs font-bold shadow-lg transition-colors flex items-center gap-1.5"
          >
            <span>🌐</span> Return to Habitat Control
          </button>
        </div>
      </div>

      {/* LEFT TELEMETRY RIBBON: Astronaut Life Support System */}
      <div className="relative z-10 self-start w-64 bg-slate-950/85 backdrop-blur-md p-3.5 rounded-xl border border-cyan-500/40 text-cyan-300 font-mono space-y-2.5 shadow-xl pointer-events-auto">
        <div className="flex items-center justify-between border-b border-cyan-900/50 pb-1.5 text-[10px]">
          <span className="font-bold tracking-wider text-cyan-400 uppercase">LIFE SUPPORT (PLSS)</span>
          <span className="text-emerald-400 font-bold">NOMINAL</span>
        </div>

        {/* Oxygen */}
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-slate-400">O2 TANK:</span>
            <span className="font-bold text-cyan-200">{o2Level}% (3.8h)</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-cyan-900">
            <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${o2Level}%` }} />
          </div>
        </div>

        {/* Suit Pressure & Heat */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-slate-900/80 p-1.5 rounded border border-cyan-950">
            <span className="text-slate-400 block">SUIT PRESS</span>
            <span className="font-bold text-white">29.6 kPa</span>
          </div>
          <div className="bg-slate-900/80 p-1.5 rounded border border-cyan-950">
            <span className="text-slate-400 block">HEART RATE</span>
            <span className="font-bold text-emerald-400">{heartRate} BPM</span>
          </div>
        </div>

        {/* Radiation & Battery */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-slate-900/80 p-1.5 rounded border border-cyan-950">
            <span className="text-slate-400 block">RAD DOSE</span>
            <span className="font-bold text-amber-300">
              {target?.surfaceRadiationMSvSol ?? 0.68} mSv/d
            </span>
          </div>
          <div className="bg-slate-900/80 p-1.5 rounded border border-cyan-950">
            <span className="text-slate-400 block">BATTERY</span>
            <span className="font-bold text-cyan-300">
              {activeRoute?.remainingBatteryPercent ?? 88}%
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT TELEMETRY RIBBON: Target Range & Terrain Hazard */}
      {target && (
        <div className="relative z-10 self-end w-64 bg-slate-950/85 backdrop-blur-md p-3.5 rounded-xl border border-amber-500/40 text-amber-300 font-mono space-y-2 shadow-xl pointer-events-auto">
          <div className="flex items-center justify-between border-b border-amber-900/50 pb-1 text-[10px]">
            <span className="font-bold tracking-wider text-amber-400 uppercase">NAVIGATION HUD</span>
            <span className="text-cyan-400 font-bold">LOCKED</span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white leading-tight">{target.name}</h4>
            <span className="text-[10px] text-slate-400">{target.geologicUnit.split("(")[0]}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-900/80 p-1.5 rounded border border-amber-950">
              <span className="text-slate-400 block">DISTANCE</span>
              <span className="font-bold text-amber-300">
                {activeRoute?.totalDistanceKm ?? 4.2} km
              </span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-amber-950">
              <span className="text-slate-400 block">TERRAIN SLOPE</span>
              <span className="font-bold text-emerald-400">{target.meanSlopeDeg}°</span>
            </div>
          </div>

          <button
            onClick={() => onOpenPovModal(target)}
            className="w-full mt-1 py-1.5 px-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <span>👁️</span> Open Surface POV
          </button>
        </div>
      )}

      {/* BOTTOM TACTICAL STATUS BAR */}
      <div className="relative z-10 self-center bg-slate-950/90 backdrop-blur-md px-6 py-2 rounded-full border border-cyan-500/30 text-cyan-400 font-mono text-xs flex items-center gap-6 shadow-2xl pointer-events-auto">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>TERRAIN SAFETY: SAFE CORRIDOR</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300">
          MODE: {activeRoute?.supportMode === "SOLO_ASTRONAUT" ? "SOLO WALK" : "PAIRED + CARGO MULE"}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-amber-400 font-bold">TARGET: {target?.name.split(" ")[0]}</span>
      </div>
    </div>
  );
};

export default VisorHudOverlay;
