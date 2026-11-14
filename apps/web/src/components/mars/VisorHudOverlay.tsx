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

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate(Math.round(82 + Math.random() * 6));
      setHeading((prev) => (prev + (Math.random() > 0.5 ? 1 : -1) + 360) % 360);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const target = selectedWaypoint ?? activeRoute?.targetWaypoint;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 overflow-hidden font-mono">
      {/* Tactical HUD Corner Crosshair Brackets (NO VIGNETTE, NO GRADIENT) */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-500/80 pointer-events-none" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-500/80 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-500/80 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-500/80 pointer-events-none" />

      {/* TOP HUD BAR: Tactical Telemetry & Compass Tape */}
      <div className="relative z-10 flex items-center justify-between pointer-events-auto">
        {/* Left: EVA Mission Time & Comm Status */}
        <div className="bg-[#0b0f17] px-3 py-1.5 border border-cyan-600 text-cyan-400 text-[10px] flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 bg-cyan-400" />
          <div>
            <div className="font-bold tracking-widest">EVA-01 // SOL 4180</div>
            <div className="text-[9px] text-slate-400">MRO RELAY: LOCKED 401.5 MHz</div>
          </div>
        </div>

        {/* Center: Dynamic Heading Compass Tape (Tabular Nums) */}
        <div className="hidden md:flex flex-col items-center bg-[#0b0f17] px-5 py-1 border border-amber-600 text-amber-400">
          <div className="text-[8px] text-slate-400 tracking-widest uppercase">ASTRONAUT BEARING</div>
          <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
            <span className="text-slate-600">120°</span>
            <span className="text-slate-500">130°</span>
            <span className="text-amber-300 text-xs border-b border-amber-400 px-1 font-bold">
              {heading}° SE
            </span>
            <span className="text-slate-500">150°</span>
            <span className="text-slate-600">160°</span>
          </div>
        </div>

        {/* Right: Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleViewMode}
            className="bg-[#111827] hover:bg-[#1f2937] text-cyan-300 border border-cyan-600 px-2.5 py-1 text-[11px] font-bold transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>HABITAT CONTROL</span>
          </button>
        </div>
      </div>

      {/* LEFT TELEMETRY RIBBON: Astronaut Life Support System */}
      <div className="relative z-10 self-start w-60 bg-[#0b0f17] p-2.5 border border-cyan-600 text-cyan-300 space-y-2 pointer-events-auto">
        <div className="flex items-center justify-between border-b border-cyan-900 pb-1 text-[9px]">
          <span className="font-bold tracking-wider text-cyan-400 uppercase">PLSS LIFE SUPPORT</span>
          <span className="text-emerald-400 font-bold">[NOMINAL]</span>
        </div>

        {/* Oxygen */}
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-slate-400">O2 TANK:</span>
            <span className="font-bold text-cyan-200 tabular-nums">{o2Level}% (3.8h)</span>
          </div>
          <div className="w-full bg-[#1e293b] h-1 border border-cyan-900">
            <div className="bg-cyan-400 h-1" style={{ width: `${o2Level}%` }} />
          </div>
        </div>

        {/* Suit Pressure & Heat */}
        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className="bg-[#111827] p-1 border border-slate-800">
            <span className="text-slate-400 block">SUIT PRESS</span>
            <span className="font-bold text-white tabular-nums">29.6 kPa</span>
          </div>
          <div className="bg-[#111827] p-1 border border-slate-800">
            <span className="text-slate-400 block">HEART RATE</span>
            <span className="font-bold text-emerald-400 tabular-nums">{heartRate} BPM</span>
          </div>
        </div>

        {/* Radiation & Battery */}
        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className="bg-[#111827] p-1 border border-slate-800">
            <span className="text-slate-400 block">RAD DOSE</span>
            <span className="font-bold text-amber-300 tabular-nums">
              {target?.surfaceRadiationMSvSol ?? 0.68} mSv/d
            </span>
          </div>
          <div className="bg-[#111827] p-1 border border-slate-800">
            <span className="text-slate-400 block">BATTERY</span>
            <span className="font-bold text-cyan-300 tabular-nums">
              {activeRoute?.remainingBatteryPercent ?? 88}%
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT TELEMETRY RIBBON: Target Range & Terrain Hazard */}
      {target && (
        <div className="relative z-10 self-end w-60 bg-[#0b0f17] p-2.5 border border-amber-600 text-amber-300 space-y-1.5 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-amber-900 pb-1 text-[9px]">
            <span className="font-bold tracking-wider text-amber-400 uppercase">TARGET NAVIGATION</span>
            <span className="text-cyan-400 font-bold">[LOCKED]</span>
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-white uppercase truncate">{target.name}</h4>
            <span className="text-[9px] text-slate-400 truncate block">{target.geologicUnit.split("(")[0]}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
            <div className="bg-[#111827] p-1 border border-slate-800">
              <span className="text-slate-400 block">DISTANCE</span>
              <span className="font-bold text-amber-300 tabular-nums">
                {activeRoute?.totalDistanceKm ?? 4.2} km
              </span>
            </div>
            <div className="bg-[#111827] p-1 border border-slate-800">
              <span className="text-slate-400 block">SLOPE</span>
              <span className="font-bold text-emerald-400 tabular-nums">{target.meanSlopeDeg}°</span>
            </div>
          </div>

          <button
            onClick={() => onOpenPovModal(target)}
            className="w-full py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>SURFACE POV</span>
          </button>
        </div>
      )}

      {/* BOTTOM TACTICAL STATUS BAR (Flat Solid, Tabular Nums) */}
      <div className="relative z-10 self-center bg-[#0b0f17] px-4 py-1.5 border border-cyan-600 text-cyan-400 text-[10px] flex items-center gap-4 pointer-events-auto">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-400" />
          <span>SAFETY: [SAFE CORRIDOR]</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-300">
          MODE: {activeRoute?.supportMode === "SOLO_ASTRONAUT" ? "SOLO WALK" : "PAIRED + CARGO MULE"}
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-amber-400 font-bold uppercase">TARGET: {target?.name.split(" ")[0]}</span>
      </div>
    </div>
  );
};

export default VisorHudOverlay;
