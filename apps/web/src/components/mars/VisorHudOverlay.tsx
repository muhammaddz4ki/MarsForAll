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
  theme?: "dark" | "light";
}

export const VisorHudOverlay: React.FC<VisorHudOverlayProps> = ({
  selectedWaypoint,
  activeRoute,
  onOpenPovModal,
  dustStormActive = false,
  currentSol = 4180,
  theme = "dark",
}) => {
  const [heading, setHeading] = useState<number>(142);
  const [heartRate, setHeartRate] = useState<number>(84);
  const [o2Level, setO2Level] = useState<number>(activeRoute?.remainingO2Percent ?? 92);

  const isDark = theme === "dark";

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
        <div className={`flex flex-col items-center ${
          isDark ? "bg-[#0b0f17]" : "bg-white"
        } px-5 py-1.5 border border-amber-600/90 text-amber-500 shadow-sm`}>
          <div className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"} tracking-widest uppercase`}>
            ASTRONAUT BEARING
          </div>
          <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
            <span className={isDark ? "text-slate-600" : "text-slate-400"}>120°</span>
            <span className={isDark ? "text-slate-500" : "text-slate-500"}>130°</span>
            <span className="text-amber-500 text-xs border-b border-amber-400 px-1 font-bold">
              {heading}° SE
            </span>
            <span className={isDark ? "text-slate-500" : "text-slate-500"}>150°</span>
            <span className={isDark ? "text-slate-600" : "text-slate-400"}>160°</span>
          </div>
        </div>
      </div>

      {/* TOP-LEFT (w-80, margin 16px): Card PLSS LIFE SUPPORT */}
      <div className={`absolute top-4 left-4 w-80 ${
        isDark ? "bg-[#0b0f17] border-cyan-600/90 text-cyan-300" : "bg-white border-cyan-600 text-cyan-900 shadow-md"
      } p-3 border space-y-2 pointer-events-auto`}>
        <div className={`flex items-center justify-between border-b ${isDark ? "border-cyan-900/80" : "border-cyan-200"} pb-1.5 text-[10px]`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400" />
            <span className="font-bold tracking-wider text-cyan-500 uppercase">PLSS LIFE SUPPORT</span>
          </div>
          <span className={`font-bold ${dustStormActive ? "text-amber-500" : "text-emerald-500"}`}>
            {dustStormActive ? "[ELEVATED LOAD]" : "[NOMINAL]"}
          </span>
        </div>

        {/* O2 Tank Meter */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className={isDark ? "text-slate-400" : "text-slate-600"}>O2 TANK CAPACITY:</span>
            <span className={`font-bold ${isDark ? "text-cyan-200" : "text-cyan-800"} tabular-nums`}>
              {o2Level}% (3.8h)
            </span>
          </div>
          <div className={`w-full ${isDark ? "bg-[#1e293b] border-cyan-900" : "bg-slate-200 border-cyan-300"} h-1.5 border`}>
            <div className="bg-cyan-500 h-1.5 transition-all" style={{ width: `${o2Level}%` }} />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>SUIT PRESSURE</span>
            <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"} tabular-nums`}>29.6 kPa</span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>HEART RATE</span>
            <span className="font-bold text-emerald-500 tabular-nums">{heartRate} BPM</span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>RAD DOSE (RAD)</span>
            <span className="font-bold text-amber-500 tabular-nums">
              {target?.surfaceRadiationMSvSol ?? 0.68} mSv/d
            </span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>SUIT BATTERY</span>
            <span className={`font-bold tabular-nums ${batteryPct < 40 ? "text-red-500" : "text-cyan-500"}`}>
              {batteryPct}%
            </span>
          </div>
        </div>
      </div>

      {/* TOP-RIGHT (w-80, margin 16px): Card ENVIRONMENTAL & SPACE WEATHER */}
      <div className={`absolute top-4 right-4 w-80 ${
        isDark ? "bg-[#0b0f17] border-amber-600/90 text-amber-300" : "bg-white border-amber-600 text-amber-900 shadow-md"
      } p-3 border space-y-2 pointer-events-auto`}>
        <div className={`flex items-center justify-between border-b ${isDark ? "border-amber-900/80" : "border-amber-200"} pb-1.5 text-[10px]`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${dustStormActive ? "bg-red-500 animate-ping" : "bg-amber-400"}`} />
            <span className="font-bold tracking-wider text-amber-500 uppercase">ENVIRONMENT &amp; WEATHER</span>
          </div>
          <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-700"} tabular-nums`}>SOL {currentSol}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>REMS WIND</span>
            <span className={`font-bold tabular-nums ${dustStormActive ? "text-red-500" : isDark ? "text-white" : "text-slate-900"}`}>
              {windSpeed}
            </span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>DUST OPACITY</span>
            <span className={`font-bold tabular-nums ${dustStormActive ? "text-amber-500" : "text-emerald-500"}`}>
              {dustTau}
            </span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>SOLAR FLUX</span>
            <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"} tabular-nums`}>{solarFlux}</span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>ALERT STATUS</span>
            <span className={`font-bold ${dustStormActive ? "text-red-500" : "text-emerald-500"}`}>
              {dustStormActive ? "[LOW VISIBILITY]" : "[NOMINAL SKY]"}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT (w-80, margin 16px): Card ACTIVE TARGET NAVIGATION */}
      {target && (
        <div className={`absolute bottom-4 right-4 w-80 ${
          isDark ? "bg-[#0b0f17] border-amber-600/90 text-amber-300" : "bg-white border-amber-600 text-amber-900 shadow-md"
        } p-3 border space-y-2 pointer-events-auto`}>
          <div className={`flex items-center justify-between border-b ${isDark ? "border-amber-900/80" : "border-amber-200"} pb-1 text-[10px]`}>
            <span className="font-bold tracking-wider text-amber-500 uppercase">TARGET NAVIGATION</span>
            <span className="text-cyan-500 font-bold">[LOCKED]</span>
          </div>

          <div>
            <h4 className={`text-[11px] font-bold ${isDark ? "text-white" : "text-slate-900"} uppercase leading-snug`}>
              {target.name}
            </h4>
            <span className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-600"} block mt-0.5 leading-tight`}>
              {target.geologicUnit}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[9px]">
            <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
              <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>DISTANCE</span>
              <span className="font-bold text-amber-500 tabular-nums">
                {activeRoute?.totalDistanceKm ?? 4.2} km
              </span>
            </div>
            <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
              <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>MEAN SLOPE</span>
              <span className="font-bold text-emerald-500 tabular-nums">{target.meanSlopeDeg}°</span>
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
      <div className={`absolute bottom-4 left-4 ${
        isDark ? "bg-[#0b0f17] border-cyan-600/90 text-cyan-400" : "bg-white border-cyan-600 text-cyan-700 shadow-sm"
      } px-3.5 py-2 border text-[10px] flex items-center gap-3 pointer-events-auto`}>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 ${dustStormActive ? "bg-amber-400" : "bg-emerald-400"}`} />
          <span className="font-bold">{dustStormActive ? "[TRAVERSE CAUTION: DUST]" : "[SAFE CORRIDOR]"}</span>
        </span>
        <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
        <span className={isDark ? "text-slate-300" : "text-slate-700"}>
          {activeRoute?.supportMode === "SOLO_ASTRONAUT" ? "SOLO WALK" : "PAIRED + CARGO MULE"}
        </span>
        <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
        <span className={`${isDark ? "text-slate-400" : "text-slate-500"} tabular-nums`}>EVA-01 // MRO LOCKED</span>
      </div>
    </div>
  );
};

export default VisorHudOverlay;