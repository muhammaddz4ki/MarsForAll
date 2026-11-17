"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MarswalkRouteResult, TurnType } from "@/lib/martian/marswalkRouter";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";

export interface MarsNavigationHudProps {
  route: MarswalkRouteResult;
  isLeftDrawerOpen?: boolean;
  onOpenPovModal: (wp: MountSharpWaypoint) => void;
  onOpenMarswalkPlanner?: () => void;
  onToggleProfileDock: () => void;
  isProfileDockOpen: boolean;
  onSwitchToVisorHud?: () => void;
  onReCenterCorridor?: () => void;
  onCloseRoute: () => void;
  onFlyToCoord?: (coord: [number, number]) => void;
  docked?: boolean;
}

function renderTurnIcon(turnType: TurnType) {
  switch (turnType) {
    case "START":
      return (
        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case "STRAIGHT":
      return (
        <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      );
    case "SLIGHT_LEFT":
      return (
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="17" y1="17" x2="7" y2="7" />
          <polyline points="7 14 7 7 14 7" />
        </svg>
      );
    case "LEFT":
    case "SHARP_LEFT":
      return (
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="12 19 5 12 12 5" />
          <path d="M19 12H5" />
        </svg>
      );
    case "SLIGHT_RIGHT":
      return (
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="10 7 17 7 17 14" />
        </svg>
      );
    case "RIGHT":
    case "SHARP_RIGHT":
      return (
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="12 5 19 12 12 19" />
          <path d="M5 12h14" />
        </svg>
      );
    default:
      return (
        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
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
  docked = true,
}) => {
  const tNav = useTranslations("navigationHud");
  const locale = useLocale();
  const [showManeuvers, setShowManeuvers] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const isSafe = route.overallSafetyIndex >= 75;
  const isCaution = route.overallSafetyIndex >= 50 && route.overallSafetyIndex < 75;

  // DOCKED SIDEBAR HUD MODE
  if (docked) {
    return (
      <div className="w-full bg-[#0b0f17] border border-emerald-500/70 p-2.5 font-mono select-none shadow-xl mb-3 shrink-0">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">
              {tNav("activeBadge")}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-[#111827] border border-slate-700 text-slate-300 uppercase tracking-wider">
              {route.supportMode === "PAIRED_CREW_MULE_ROVER" ? tNav("pairedMuleMode") : tNav("soloEvaMode")}
            </span>
            <button
              onClick={onCloseRoute}
              className="px-1.5 py-0.5 bg-[#450a0a] hover:bg-red-900 border border-red-700 text-red-300 hover:text-white text-[9px] font-bold transition-colors"
              title="Clear Route"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Route Corridor Endpoints */}
        <div className="py-2 space-y-0.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-bold truncate">
                {locale === "id" ? "Awal: " : "Start: "}{route.startWaypoint.name.replace("MarsForAll ", "")}
              </span>
            </div>
            <span className="text-[8px] text-slate-500 font-bold">START</span>
          </div>
          <div className="pl-3 text-[9px] text-slate-500 font-mono">
            {locale === "id" ? "↓ Jalur Teraman Hasil Hitungan AI" : "↓ Safest Trail Computed by AI"}
          </div>
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="truncate">
                {locale === "id" ? "Tujuan: " : "Target: "}{route.targetWaypoint.name}
              </span>
            </div>
            <span className="text-[8px] px-1 py-0.2 bg-amber-950/60 border border-amber-600/40 text-amber-300 font-bold">DEST</span>
          </div>
          <div className="text-[8px] text-slate-400 pl-3 tabular-nums font-mono">
            {route.targetWaypoint.coordinates[1].toFixed(4)}°, {route.targetWaypoint.coordinates[0].toFixed(4)}°
          </div>
        </div>

        {/* 4 Telemetry Metrics Grid (Flat Matte Tabular) */}
        <div className="grid grid-cols-2 gap-1.5 py-2 border-y border-slate-800 text-[10px] tabular-nums font-mono">
          <div className="bg-[#07090e] border border-slate-800 p-1.5">
            <div className="text-slate-400 text-[8px] font-bold uppercase">
              {locale === "id" ? "JARAK TOTAL" : "TOTAL DISTANCE"}
            </div>
            <div className="text-white font-bold text-xs">{route.totalDistanceKm} km</div>
          </div>
          <div className="bg-[#07090e] border border-slate-800 p-1.5">
            <div className="text-slate-400 text-[8px] font-bold uppercase">
              {locale === "id" ? "ESTIMASI WAKTU" : "EST. DURATION"}
            </div>
            <div className="text-white font-bold text-xs">
              {route.estimatedDurationHours} {locale === "id" ? "jam" : "h"}
            </div>
          </div>
          <div className="bg-[#07090e] border border-slate-800 p-1.5">
            <div className="text-slate-400 text-[8px] font-bold uppercase">{tNav("o2Remaining")}</div>
            <div className="text-emerald-400 font-bold text-xs">{route.remainingO2Percent}%</div>
          </div>
          <div className="bg-[#07090e] border border-slate-800 p-1.5">
            <div className="text-slate-400 text-[8px] font-bold uppercase">{tNav("battRemaining")}</div>
            <div className="text-cyan-400 font-bold text-xs">{route.remainingBatteryPercent}%</div>
          </div>
        </div>

        {/* MGS Shield & Safety Status Pill */}
        <div className="pt-2 space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[10px] tabular-nums">
            <span className="text-slate-400 text-[9px] uppercase">{tNav("mgsShield")}</span>
            <span className="text-purple-300 font-bold">
              {route.averageCrustalMagNt} nT <span className="text-purple-400/80 text-[8px]">{tNav("shieldSafe")}</span>
            </span>
          </div>
          <div
            className={`px-2 py-1 border text-[9px] font-bold tracking-wider uppercase text-center leading-tight ${
              isSafe
                ? "bg-[#064e3b] border-[#10b981] text-[#34d399]"
                : isCaution
                ? "bg-[#78350f] border-[#d97706] text-[#fde68a]"
                : "bg-[#7f1d1d] border-[#dc2626] text-[#fca5a5]"
            }`}
          >
            {isSafe
              ? tNav("safeVerdict")
              : isCaution
              ? tNav("cautionVerdict")
              : tNav("hazardVerdict")}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-2">
          {/* View 360 POV at Target */}
          <button
            onClick={() => onOpenPovModal(route.targetWaypoint)}
            className="px-2 py-1 bg-[#161e2e] hover:bg-[#1f2937] border border-slate-700 text-amber-300 hover:text-amber-200 text-[9px] font-bold transition-colors flex items-center justify-center gap-1"
            title="Open 360 Panoramic Surface POV at destination"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
            </svg>
            <span>{tNav("viewPovTarget")}</span>
          </button>

          {/* Toggle 5M Transect Profile */}
          <button
            onClick={onToggleProfileDock}
            className={`px-2 py-1 border text-[9px] font-bold transition-colors ${
              isProfileDockOpen
                ? "bg-[#161e2e] border-cyan-500 text-cyan-300"
                : "bg-[#111827] border-slate-700 text-slate-300 hover:text-white"
            }`}
            title="Toggle transect elevation profile dock"
          >
            <span>[ {tNav("toggleTransect")} ]</span>
          </button>

          {/* Maneuver Steps Toggle */}
          <button
            onClick={() => setShowManeuvers((prev) => !prev)}
            className="col-span-2 px-2 py-1 bg-[#111827] hover:bg-[#161e2e] border border-slate-700 text-slate-300 hover:text-white text-[9px] font-bold transition-colors flex items-center justify-between"
            title="Toggle turn-by-turn route steps"
          >
            <span>[ {tNav("turnByTurn")} ({route.segments?.length || 0}) ]</span>
            <span>{showManeuvers ? "▲" : "▼"}</span>
          </button>
        </div>

        {/* Expandable Step-by-Step Waypoint Maneuvers */}
        {showManeuvers && route.segments && route.segments.length > 0 && (
          <div className="mt-2 p-1.5 bg-[#07090e] border border-slate-800 max-h-48 overflow-y-auto space-y-1 text-[9px]">
            <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
              <span>{tNav("turnByTurn")}</span>
              <span className="text-slate-500 font-mono">[{route.segments.length} {locale === "id" ? "SEGMEN" : "STEPS"}]</span>
            </div>
            {route.segments.map((seg, idx) => {
              const segHazard = seg.sandTrapRisk === "HIGH" || seg.slopeDeg > 22;
              const segCaution = seg.slopeDeg > 15 || seg.sandTrapRisk === "MODERATE";
              const instructionText =
                locale === "id"
                  ? seg.maneuverInstructionId || seg.maneuverInstruction
                  : seg.maneuverInstruction;
              const firmnessLabel =
                seg.surfaceFirmness === "BEDROCK FIRM"
                  ? (locale === "id" ? "BATU KOKOH" : "BEDROCK FIRM")
                  : seg.surfaceFirmness === "MODERATE COMPACTION"
                  ? (locale === "id" ? "TANAH SEDANG" : "MODERATE")
                  : (locale === "id" ? "PASIR AMBLAS" : "SAND TRAP");

              return (
                <div
                  key={idx}
                  onClick={() => onFlyToCoord?.(seg.toCoordinate)}
                  className="px-2 py-1 bg-[#111827] border border-slate-800 hover:border-slate-600 cursor-pointer flex flex-col gap-0.5 transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-3.5 h-3.5 bg-[#0b0f17] border border-slate-700 text-slate-300 font-mono text-[8px] flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    {renderTurnIcon(seg.turnType)}
                    <span className="text-slate-200 truncate font-bold text-[9px]">
                      {instructionText}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-5 text-[8px] text-slate-400 tabular-nums">
                    <span>
                      {seg.distanceKm.toFixed(1)} km | {seg.fromElevationM.toFixed(0)}m &rarr; {seg.toElevationM.toFixed(0)}m
                    </span>
                    <span
                      className={`font-bold ${
                        segHazard
                          ? "text-red-400"
                          : segCaution
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {seg.slopeDeg.toFixed(1)}° [{firmnessLabel}]
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Compact Minimized HUD Pill
  if (isMinimized) {
    return (
      <div
        className={`absolute top-12 z-20 transition-all duration-200 select-none font-mono ${
          isLeftDrawerOpen ? "left-4 sm:left-[406px]" : "left-4 sm:left-14"
        }`}
      >
        <div className="flex items-center gap-2.5 bg-[#0b0f17] border border-slate-700 px-3 py-1.5 shadow-2xl text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">[MARSWALK A*]</span>
          <span className="text-amber-400 font-bold truncate max-w-[200px]">
            {route.targetWaypoint.name}
          </span>
          <span className="text-white font-bold tabular-nums">({route.totalDistanceKm} km)</span>
          <button
            onClick={() => setIsMinimized(false)}
            className="px-2 py-0.5 bg-[#161e2e] hover:bg-[#1f2937] border border-slate-700 text-cyan-300 text-[9px] font-bold transition-colors"
            title="Expand Navigation HUD"
          >
            [ ▾ DETAIL ]
          </button>
          <button
            onClick={onCloseRoute}
            className="px-2 py-0.5 bg-[#450a0a] hover:bg-red-900 border border-red-700 text-red-300 text-[9px] font-bold transition-colors"
            title="Clear Route"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute top-12 z-20 transition-all duration-200 select-none font-mono ${
        isLeftDrawerOpen ? "left-4 sm:left-[406px]" : "left-4 sm:left-14"
      } max-w-[calc(100vw-2rem)] sm:max-w-2xl lg:max-w-3xl shadow-[0_12px_40px_rgba(0,0,0,0.95)]`}
    >
      <div className="bg-[#0b0f17] border border-slate-700">
        {/* Top Header Row (Mission Control Header) */}
        <div className="h-8 px-3 bg-[#07090e] border-b border-slate-700 flex items-center justify-between gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-[10px]">
          {/* Left: Badge & Waypoint Route */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#064e3b] border border-[#10b981] text-[#34d399] font-bold text-[9px] tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
              <span>{tNav("activeBadge")}</span>
            </span>

            <span className="text-slate-200 font-bold tracking-tight truncate max-w-[240px] md:max-w-xs">
              <span className="text-emerald-400">
                {route.startWaypoint.name.replace("MarsForAll ", "").replace(" (Bradbury Plains)", "")}
              </span>
              <span className="text-slate-500 mx-1.5">&rarr;</span>
              <span className="text-amber-400 font-bold">{route.targetWaypoint.name}</span>
            </span>

            <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#111827] border border-slate-700 text-slate-300 text-[8px] font-bold uppercase tracking-wider">
              {route.supportMode === "PAIRED_CREW_MULE_ROVER" ? tNav("pairedMuleMode") : tNav("soloEvaMode")}
            </span>
          </div>

          {/* Right: Unified Mission Control Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* View 360 POV at Target */}
            <button
              onClick={() => onOpenPovModal(route.targetWaypoint)}
              className="px-2 py-0.5 bg-[#161e2e] hover:bg-[#1f2937] border border-slate-700 text-amber-300 hover:text-amber-200 text-[9px] font-bold transition-colors flex items-center gap-1"
              title="Open 360 Panoramic Surface POV at destination"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
              </svg>
              <span>{tNav("viewPovTarget")}</span>
            </button>

            {/* Toggle 5M Transect Profile */}
            <button
              onClick={onToggleProfileDock}
              className={`px-2 py-0.5 border text-[9px] font-bold transition-colors ${
                isProfileDockOpen
                  ? "bg-[#161e2e] border-cyan-500 text-cyan-300"
                  : "bg-[#111827] border-slate-700 text-slate-300 hover:text-white"
              }`}
              title="Toggle transect elevation profile dock"
            >
              <span>[ {tNav("toggleTransect")} ]</span>
            </button>

            {/* Maneuver Steps Toggle */}
            <button
              onClick={() => setShowManeuvers((prev) => !prev)}
              className="px-2 py-0.5 bg-[#161e2e] hover:bg-[#1f2937] border border-slate-700 text-slate-300 hover:text-white text-[9px] font-bold transition-colors"
              title="Toggle turn-by-turn maneuver steps"
            >
              <span>[ {tNav("turnByTurn")} {showManeuvers ? "▲" : "▼"} ]</span>
            </button>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              className="px-1.5 py-0.5 bg-[#161e2e] hover:bg-[#1f2937] border border-slate-700 text-slate-400 hover:text-white text-[9px] font-bold transition-colors"
              title="Minimize Navigation HUD"
            >
              —
            </button>

            {/* Close Route */}
            <button
              onClick={onCloseRoute}
              className="px-2 py-0.5 bg-[#450a0a] hover:bg-red-900 border border-red-700 text-red-300 hover:text-white text-[9px] font-bold transition-colors"
              title="Clear active route"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Telemetry Row (Flat Matte Monospace Tabular Bar) */}
        <div className="h-8 px-3 bg-[#0b0f17] flex items-center justify-between gap-3 text-[10px] tabular-nums overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Key Metrics */}
          <div className="flex items-center gap-3 text-[10px] font-mono shrink-0">
            <div>
              <span className="text-slate-400 font-bold mr-1">
                {locale === "id" ? "JARAK:" : "DIST:"}
              </span>
              <span className="text-white font-bold">{route.totalDistanceKm} km</span>
            </div>

            <span className="text-slate-600">|</span>

            <div>
              <span className="text-slate-400 font-bold mr-1">
                {locale === "id" ? "WAKTU:" : "EST:"}
              </span>
              <span className="text-white font-bold">
                {route.estimatedDurationHours} {locale === "id" ? "jam" : "h"}
              </span>
            </div>

            <span className="text-slate-600">|</span>

            <div>
              <span className="text-slate-400 font-bold mr-1">{tNav("o2Remaining")}</span>
              <span className="text-emerald-400 font-bold">{route.remainingO2Percent}%</span>
            </div>

            <span className="text-slate-600">|</span>

            <div>
              <span className="text-slate-400 font-bold mr-1">{tNav("battRemaining")}</span>
              <span className="text-cyan-400 font-bold">{route.remainingBatteryPercent}%</span>
            </div>

            <span className="text-slate-600 hidden sm:inline">|</span>

            <div className="hidden sm:block">
              <span className="text-slate-400 font-bold mr-1">{tNav("mgsShield")}</span>
              <span className="text-purple-300 font-bold">{route.averageCrustalMagNt} nT</span>
            </div>
          </div>

          {/* Safety Status Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 border text-[9px] font-bold tracking-wider uppercase ${
                isSafe
                  ? "bg-[#064e3b] border-[#10b981] text-[#34d399]"
                  : isCaution
                  ? "bg-[#78350f] border-[#d97706] text-[#fde68a]"
                  : "bg-[#7f1d1d] border-[#dc2626] text-[#fca5a5]"
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

        {/* Expandable Step-by-Step Waypoint Maneuvers */}
        {showManeuvers && route.segments && route.segments.length > 0 && (
          <div className="p-2.5 bg-[#07090e] border-t border-slate-700 max-h-52 overflow-y-auto space-y-1.5 text-[10px]">
            <div className="text-[9px] text-slate-300 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
              <span>{tNav("turnByTurn")}</span>
              <span className="text-slate-400 font-mono">[{route.segments.length} SEGMENTS]</span>
            </div>
            {route.segments.map((seg, idx) => {
              const segHazard = seg.sandTrapRisk === "HIGH" || seg.slopeDeg > 22;
              const segCaution = seg.slopeDeg > 15 || seg.sandTrapRisk === "MODERATE";
              const instructionText =
                locale === "id"
                  ? seg.maneuverInstructionId || seg.maneuverInstruction
                  : seg.maneuverInstruction;
              const firmnessLabel =
                seg.surfaceFirmness === "BEDROCK FIRM"
                  ? (locale === "id" ? "BATU KOKOH" : "BEDROCK FIRM")
                  : seg.surfaceFirmness === "MODERATE COMPACTION"
                  ? (locale === "id" ? "TANAH SEDANG" : "MODERATE")
                  : (locale === "id" ? "PASIR AMBLAS" : "SAND TRAP");

              return (
                <div
                  key={idx}
                  onClick={() => onFlyToCoord?.(seg.toCoordinate)}
                  className="px-2.5 py-1.5 bg-[#111827] border border-slate-700 hover:border-slate-500 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 h-4 bg-[#0b0f17] border border-slate-700 text-slate-300 font-mono text-[8px] flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    {renderTurnIcon(seg.turnType)}
                    <div className="truncate flex flex-col">
                      <span className="text-slate-200 truncate font-bold text-[10px]">
                        {instructionText}
                      </span>
                      <span className="text-slate-400 text-[8px]">
                        HDG {seg.bearingDeg}° {seg.cardinalDirection} | {seg.fromElevationM.toFixed(0)}m &rarr; {seg.toElevationM.toFixed(0)}m
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                    <span className="text-white font-bold">{seg.distanceKm.toFixed(1)} km</span>
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
                      className={`text-[8px] font-bold px-1.5 py-0.5 border ${
                        seg.sandTrapRisk === "HIGH"
                          ? "bg-[#7f1d1d] border-[#dc2626] text-[#fca5a5]"
                          : seg.sandTrapRisk === "MODERATE"
                          ? "bg-[#78350f] border-[#d97706] text-[#fde68a]"
                          : "bg-[#064e3b] border-[#10b981] text-[#34d399]"
                      }`}
                    >
                      [{firmnessLabel}]
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

export default MarsNavigationHud;
