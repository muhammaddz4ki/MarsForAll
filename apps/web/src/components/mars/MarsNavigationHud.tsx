"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { MarswalkRouteResult } from "@/lib/martian/marswalkRouter";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";

export interface MarsNavigationHudProps {
  route: MarswalkRouteResult;
  isLeftDrawerOpen: boolean;
  onOpenPovModal: (wp: MountSharpWaypoint) => void;
  onOpenMarswalkPlanner: () => void;
  onToggleProfileDock: () => void;
  isProfileDockOpen: boolean;
  onSwitchToVisorHud: () => void;
  onReCenterCorridor: () => void;
  onCloseRoute: () => void;
  onFlyToCoord?: (coord: [number, number]) => void;
}

export const MarsNavigationHud: React.FC<MarsNavigationHudProps> = ({
  route,
  isLeftDrawerOpen,
  onOpenPovModal,
  onOpenMarswalkPlanner,
  onToggleProfileDock,
  isProfileDockOpen,
  onSwitchToVisorHud,
  onReCenterCorridor,
  onCloseRoute,
  onFlyToCoord,
}) => {
  const tNav = useTranslations("navigationHud");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showManeuvers, setShowManeuvers] = useState<boolean>(false);

  const isSafe = route.overallSafetyIndex >= 75;
  const isCaution = route.overallSafetyIndex >= 50 && route.overallSafetyIndex < 75;

  return (
    <div
      className={`absolute top-12 z-20 transition-all duration-200 select-none font-mono ${
        isLeftDrawerOpen ? "left-[416px]" : "left-3"
      } right-3 max-w-4xl`}
    >
      <div className="bg-[#07090e]/95 border border-slate-700 shadow-[0_8px_30px_rgba(0,0,0,0.85)]">
        {/* Top Header Row (Google Maps Navigation Bar on Mars) */}
        <div className="h-9 px-3 bg-[#0b0f17] border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-[10px]">
          {/* Left: Nav Badge & Waypoints */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#064e3b] border border-[#10b981] text-[#34d399] font-bold text-[9px] tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
              <span>{tNav("activeBadge")}</span>
            </span>

            <span className="text-slate-200 font-bold tracking-tight truncate max-w-[280px] md:max-w-md">
              <span className="text-emerald-400">{route.startWaypoint.name.split(" ")[0]}</span>
              <span className="text-slate-500 mx-1.5">&rarr;</span>
              <span className="text-amber-400 font-bold">{route.targetWaypoint.name}</span>
            </span>

            <span className="hidden sm:inline-block px-1.5 py-0.2 bg-[#161e2e] border border-slate-800 text-slate-400 text-[8px] font-bold uppercase">
              {route.supportMode === "PAIRED_CREW_MULE_ROVER" ? "PAIRED + MULE" : "SOLO EVA"}
            </span>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View 360 POV at Target */}
            <button
              onClick={() => onOpenPovModal(route.targetWaypoint)}
              className="px-2 py-1 bg-[#451a03] border border-[#ea580c] text-[#fed7aa] hover:bg-[#7c2d12] text-[9px] font-bold transition-colors flex items-center gap-1"
              title="Open 360 Panoramic Surface POV at destination"
            >
              <svg className="w-3 h-3 text-[#ea580c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{tNav("viewPovTarget")}</span>
            </button>

            {/* Re-center 3D corridor */}
            <button
              onClick={onReCenterCorridor}
              className="px-2 py-1 bg-[#083344] border border-[#06b6d4] text-[#a5f3fc] hover:bg-[#0e7490] text-[9px] font-bold transition-colors hidden md:flex items-center gap-1"
              title="Re-center camera perspective along 3D route"
            >
              <span>{tNav("recenter3d")}</span>
            </button>

            {/* Toggle 5M Transect Profile */}
            <button
              onClick={onToggleProfileDock}
              className={`px-2 py-1 border text-[9px] font-bold transition-colors ${
                isProfileDockOpen
                  ? "bg-[#1e1b4b] border-indigo-500 text-indigo-300 hover:bg-[#312e81]"
                  : "bg-[#161e2e] border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Toggle 5-meter transect elevation dock"
            >
              <span>{tNav("toggleTransect")}</span>
            </button>

            {/* Switch to Visor HUD */}
            <button
              onClick={onSwitchToVisorHud}
              className="px-2 py-1 bg-[#064e3b] border border-[#10b981] text-[#34d399] hover:bg-[#065f46] text-[9px] font-bold transition-colors hidden lg:flex items-center gap-1"
              title="Launch astronaut helmet visor HUD"
            >
              <span>{tNav("visorHud")}</span>
            </button>

            {/* Open Marswalk Drawer Planner */}
            <button
              onClick={onOpenMarswalkPlanner}
              className="px-2 py-1 bg-[#161e2e] border border-slate-700 text-slate-300 hover:text-white text-[9px] font-bold transition-colors"
              title="Open route options and waypoint selector"
            >
              <span>{tNav("planner")}</span>
            </button>

            {/* Toggle details / Maneuvers */}
            <button
              onClick={() => setShowManeuvers((prev) => !prev)}
              className="px-1.5 py-1 bg-[#161e2e] border border-slate-700 text-slate-300 hover:text-white text-[9px] font-bold"
              title="Toggle maneuver step list"
            >
              {showManeuvers ? "▲" : "▼"}
            </button>

            {/* Dismiss */}
            <button
              onClick={onCloseRoute}
              className="px-1.5 py-1 bg-red-950/60 border border-red-800 text-red-300 hover:text-white text-[9px] font-bold"
              title="Clear active route"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Middle Telemetry Banner (High-Visibility Google Maps Stats) */}
        <div className="px-3 py-1.5 bg-[#07090e] border-b border-slate-800 flex items-center justify-between gap-3 text-[10px] overflow-x-auto">
          {/* Key Metrics */}
          <div className="flex items-center gap-4 text-xs font-bold tabular-nums">
            <div className="flex items-baseline gap-1">
              <span className="text-white text-sm font-black">{route.totalDistanceKm}</span>
              <span className="text-slate-400 text-[10px]">KM</span>
            </div>

            <div className="text-slate-600">|</div>

            <div className="flex items-baseline gap-1">
              <span className="text-white text-sm font-black">{route.estimatedDurationHours}</span>
              <span className="text-slate-400 text-[10px]">H EVA</span>
            </div>

            <div className="text-slate-600">|</div>

            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">{tNav("o2Remaining")}</span>
              <span className="text-emerald-400 font-bold">{route.remainingO2Percent}%</span>
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">{tNav("battRemaining")}</span>
              <span className="text-emerald-400 font-bold">{route.remainingBatteryPercent}%</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">{tNav("mgsShield")}</span>
              <span className="text-purple-400 font-bold">{route.averageCrustalMagNt} nT</span>
            </div>
          </div>

          {/* Safety Status Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 border text-[9px] font-bold ${
                isSafe
                  ? "bg-[#064e3b]/80 border-[#10b981] text-[#34d399]"
                  : isCaution
                  ? "bg-[#78350f]/80 border-[#f59e0b] text-[#fde68a]"
                  : "bg-[#7f1d1d]/80 border-[#ef4444] text-[#fca5a5]"
              }`}
            >
              {isSafe
                ? tNav("safeVerdict")
                : isCaution
                ? tNav("cautionVerdict")
                : tNav("hazardVerdict")}
            </span>
          </div>
        </div>

        {/* Expandable Step-by-Step Waypoint Maneuvers (Google Maps Turn-by-Turn Experience) */}
        {showManeuvers && route.segments && route.segments.length > 0 && (
          <div className="p-2.5 bg-[#0b0f17] max-h-48 overflow-y-auto space-y-1 text-[10px]">
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
              <span>{tNav("turnByTurn")}</span>
              <span className="text-slate-500 font-mono">{route.segments.length} SEGMENTS</span>
            </div>
            {route.segments.map((seg, idx) => {
              const segHazard = seg.sandTrapRisk === "HIGH" || seg.slopeDeg > 22;
              const segCaution = seg.slopeDeg > 15 || seg.sandTrapRisk === "MODERATE";
              return (
                <div
                  key={idx}
                  onClick={() => onFlyToCoord?.(seg.toCoordinate)}
                  className="px-2 py-1 bg-[#07090e] border border-slate-800 hover:border-slate-600 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 h-4 bg-[#161e2e] border border-slate-700 text-slate-300 font-mono text-[8px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 truncate">
                      {seg.hazardDescription || `Corridor Segment #${idx + 1} (${seg.fromElevationM.toFixed(0)}m → ${seg.toElevationM.toFixed(0)}m)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 tabular-nums">
                    <span className="text-slate-400">{seg.distanceKm.toFixed(1)} km</span>
                    <span
                      className={`font-bold ${
                        segHazard
                          ? "text-red-400"
                          : segCaution
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {seg.slopeDeg.toFixed(1)}°
                    </span>
                    <span
                      className={`text-[8px] font-bold ${
                        seg.sandTrapRisk === "HIGH"
                          ? "text-red-400"
                          : seg.sandTrapRisk === "MODERATE"
                          ? "text-amber-400"
                          : "text-cyan-400"
                      }`}
                    >
                      {seg.surfaceFirmness}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MarsNavigationHud);
