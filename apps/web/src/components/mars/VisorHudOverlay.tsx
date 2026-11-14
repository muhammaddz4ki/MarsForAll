"use client";

import React, { useState, useEffect } from "react";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";
import { MarswalkRouteResult } from "@/lib/martian/marswalkRouter";

interface VisorHudOverlayProps {
  selectedWaypoint: MountSharpWaypoint | null;
  activeRoute: MarswalkRouteResult | null;
  onOpenPovModal: (wp: MountSharpWaypoint) => void;
  dustStormActive?: boolean;
  currentSol?: number;
}

export const VisorHudOverlay: React.FC<VisorHudOverlayProps> = ({
  selectedWaypoint,
  activeRoute,
  onOpenPovModal,
  dustStormActive = false,
  currentSol = 4180,
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

  // React to dust storm in telemetry
  const windSpeed = dustStormActive ? "24.8 m/s GUSTS" : "6.4 m/s ESE";
  const dustTau = dustStormActive ? "TAU 2.4 (EXTREME)" : "TAU 0.3 (CLEAR)";
  const solarFlux = dustStormActive ? "112 W/m²" : "590 W/m²";
  const batteryPct = dustStormActive
    ? Math.max(30, (activeRoute?.remainingBatteryPercent ?? 88) - 22)
    : (activeRoute?.remainingBatteryPercent ?? 88);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden font-mono select-none">
      {/* 4 Outer Corner Tactical Crosshair Reticles (16px from edges) */}
      <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-cyan-500/80 pointer-events-none" />
      <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-cyan-500/80 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-cyan-500/80 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-cyan-500/80 pointer-events-none" />

      {/* TOP-CENTER: Precision Dynamic Compass Bearing Tape */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex flex-col items-center bg-[#0b0f17] px-5 py-1.5 border border-amber-600/90 text-amber-400">
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
      </div>

      {/* TOP-LEFT (w-80, margin 16px): Card PLSS LIFE SUPPORT */}
      <div className="absolute top-4 left-4 w-80 bg-[#0b0f17] p-3 border border-cyan-600/90 text-cyan-300 space-y-2 pointer-events-auto">
        <div className="flex items-center justify-between border-b border-cyan-900/80 pb-1.5 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400" />
            <span className="font-bold tracking-wider text-cyan-400 uppercase">PLSS LIFE SUPPORT</span>
          </div>
          <span className={`font-bold ${dustStormActive ? "text-amber-400" : "text-emerald-400"}`}>
            {dustStormActive ? "[ELEVATED LOAD]" : "[NOMINAL]"}
          </span>
        </div>

        {/* O2 Tank Meter */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-400">O2 TANK CAPACITY:</span>
            <span className="font-bold text-cyan-200 tabular-nums">{o2Level}% (3.8h)</span>
          </div>
          <div className="w-full bg-[#1e293b] h-1.5 border border-cyan-900">
            <div className="bg-cyan-400 h-1.5 transition-all" style={{ width: `${o2Level}%` }} />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className="bg-[#111827] p-1.5 border border-slate-800">
            <span className="text-slate-400 block uppercase">SUIT PRESSURE</span>
            <span className="font-bold text-white tabular-nums">29.6 kPa</span>
          </div>
          <div className="bg-[#111827] p-1.5 border border-slate-800">
            <span className="text-slate-400 block uppercase">HEART RATE</span>
            <span className="font-bold text-emerald-400 tabular-nums">{heartRate} BPM</span>
          </div>
          <div className="bg-[#111827] p-1.5 border border-slate-800">
            <span className="text-slate-400 block uppercase">RAD DOSE (RAD)</span>
            <span className="font-bold text-amber-300 tabular-nums">
              {target?.surfaceRadiationMSvSol ?? 0.68} mSv/d
            </span>
          </div>
          <div className="bg-[#111827] p-1.5 border border-slate-800">
            <span className="text-slate-400 block uppercase">SUIT BATTERY</span>
            <span className={`font-bold tabular-nums ${batteryPct < 40 ? "text-red-400" : "text-cyan-300"}`}>
              {batteryPct}%
            </span>
          </div>
        </div>
      </div>

      {/* TOP-RIGHT (w-80, margin 16px): Card ENVIRONMENTAL & SPACE WEATHER */}
      <div className="absolute top-4 right-4 w-80 bg-[#0b0f17] p-3 border border-amber-600/90 text-amber-300 space-y-2 pointer-events-auto">
        <div className="flex items-center justify-between border-b border-amber-900/80 pb-1.5 text-[10px]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${dustStormActive ? "bg-red-500 animate-ping" : "bg-amber-400"}`} />
            <span className="font-bold tracking-wider text-amber-400 uppercase">ENVIRONMENT &amp; WEATHER</span>
          </div>
          <span className="font-bold text-slate-300 tabular-nums">SOL {currentSol}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className="bg-[#111827] p-1.5 border border-slate-800">
            <span className="text-slate-400 block uppercase">REMS WIND</span>
            <span className={`font-bold tabular-nums ${dustStormActive ? "text-red-400" : "text-white"}`}>
              {windSpeed}
            </span>
          </div>
          <div className="bg-[#111827] p-1.5 border border-slate-800">
            <span className="text-slate-400 block uppercase">DUST OPACITY</span>
            <span className={`font-bold tabular-nums ${dustStormActive ? "text-amber-400" : "text-emerald-400"}`}>
              {dustTau}
            </span>
          </div>
          <div className="bg-[#111827] p-1.5 border border-slate-800">
            <span className="text-slate-400 block uppercase">SOLAR FLUX</span>
            <span className="font-bold text-white tabular-nums">{solarFlux}</span>
          </div>
          <div className="bg-[#111827] p-1.5 border border-slate-800">
            <span className="text-slate-400 block uppercase">ALERT STATUS</span>
            <span className={`font-bold ${dustStormActive ? "text-red-400" : "text-emerald-400"}`}>
              {dustStormActive ? "[LOW VISIBILITY]" : "[NOMINAL SKY]"}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT (w-80, margin 16px): Card ACTIVE TARGET NAVIGATION */}
      {target && (
        <div className="absolute bottom-4 right-4 w-80 bg-[#0b0f17] p-3 border border-amber-600/90 text-amber-300 space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-amber-900/80 pb-1 text-[10px]">
            <span className="font-bold tracking-wider text-amber-400 uppercase">TARGET NAVIGATION</span>
            <span className="text-cyan-400 font-bold">[LOCKED]</span>
          </div>

          <div>
            {/* Full title without truncate, wrap cleanly */}
            <h4 className="text-[11px] font-bold text-white uppercase leading-snug">
              {target.name}
            </h4>
            <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
              {target.geologicUnit}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
            <div className="bg-[#111827] p-1.5 border border-slate-800">
              <span className="text-slate-400 block uppercase">DISTANCE</span>
              <span className="font-bold text-amber-300 tabular-nums">
                {activeRoute?.totalDistanceKm ?? 4.2} km
              </span>
            </div>
            <div className="bg-[#111827] p-1.5 border border-slate-800">
              <span className="text-slate-400 block uppercase">MEAN SLOPE</span>
              <span className="font-bold text-emerald-400 tabular-nums">{target.meanSlopeDeg}°</span>
            </div>
          </div>

          {/* Full-width action button */}
          <button
            onClick={() => onOpenPovModal(target)}
            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>INSPECT SURFACE POV</span>
          </button>
        </div>
      )}

      {/* BOTTOM-LEFT (margin 16px): Tactical Traverse Status Ribbon */}
      <div className="absolute bottom-4 left-4 bg-[#0b0f17] px-3.5 py-2 border border-cyan-600/90 text-cyan-400 text-[10px] flex items-center gap-3 pointer-events-auto">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 ${dustStormActive ? "bg-amber-400" : "bg-emerald-400"}`} />
          <span className="font-bold">{dustStormActive ? "[TRAVERSE CAUTION: DUST]" : "[SAFE CORRIDOR]"}</span>
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-300">
          {activeRoute?.supportMode === "SOLO_ASTRONAUT" ? "SOLO WALK" : "PAIRED + CARGO MULE"}
        </span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400 tabular-nums">EVA-01 // MRO LOCKED</span>
      </div>
    </div>
  );
};

export default VisorHudOverlay;
