"use client";

import React, { useState, memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { MissionSiteId } from "@/lib/martian/mountSharpWaypoints";

export interface AerialScoutTarget {
  lat: number;
  lon: number;
  altitudeM: number;
  label: string;
}

interface MarsAerialScoutDockProps {
  currentSite: MissionSiteId;
  onLaunchFlight: (target: AerialScoutTarget) => void;
  onClose: () => void;
  isFlying: boolean;
  flightTelemetry?: {
    currentCoord: [number, number];
    altitudeM: number;
    speedMs: number;
    distanceRemainingKm: number;
    headingDeg: number;
  } | null;
  theme?: "dark" | "light";
  embedded?: boolean;
}

export const MarsAerialScoutDock: React.FC<MarsAerialScoutDockProps> = memo(({
  currentSite,
  onLaunchFlight,
  onClose,
  isFlying,
  flightTelemetry,
  theme = "dark",
  embedded = false,
}) => {
  const t = useTranslations("scout");
  const isDark = theme === "dark";
  const defaultCoords = currentSite === "gale_crater"
    ? { lat: -5.4453, lon: 137.8414, label: "Mount Sharp Boxwork 2025" }
    : { lat: 18.4120, lon: 77.4220, label: "Three Forks Delta Front" };

  const [targetLat, setTargetLat] = useState<string>(defaultCoords.lat.toString());
  const [targetLon, setTargetLon] = useState<string>(defaultCoords.lon.toString());
  const [altitudeM, setAltitudeM] = useState<number>(350);
  const [flightLabel, setFlightLabel] = useState<string>(defaultCoords.label);

  // Automatically synchronize drone inputs when active mission site changes
  React.useEffect(() => {
    const coords = currentSite === "gale_crater"
      ? { lat: -5.4453, lon: 137.8414, label: "Mount Sharp Boxwork" }
      : { lat: 18.4120, lon: 77.4220, label: "Three Forks Delta Front" };
    setTargetLat(coords.lat.toString());
    setTargetLon(coords.lon.toString());
    setFlightLabel(coords.label);
  }, [currentSite]);

  const presets = currentSite === "gale_crater"
    ? [
        { label: "Mount Sharp Boxwork", lat: -5.4453, lon: 137.8414 },
        { label: "Gediz Vallis Ridge", lat: -5.2150, lon: 137.7120 },
        { label: "Vera Rubin Ridge", lat: -4.9281, lon: 137.5684 },
        { label: "Bradbury Landing", lat: -4.5895, lon: 137.4417 },
      ]
    : [
        { label: "Three Forks Delta Front", lat: 18.4120, lon: 77.4220 },
        { label: "Cheyava Falls", lat: 18.4800, lon: 77.3750 },
        { label: "Neretva Vallis", lat: 18.4480, lon: 77.4300 },
        { label: "Belva Crater", lat: 18.4600, lon: 77.4050 },
      ];

  const handleApplyPreset = (p: { label: string; lat: number; lon: number }) => {
    setTargetLat(p.lat.toString());
    setTargetLon(p.lon.toString());
    setFlightLabel(p.label);
  };

  const handleExecuteLaunch = () => {
    const lat = parseFloat(targetLat);
    const lon = parseFloat(targetLon);
    if (isNaN(lat) || isNaN(lon)) return;
    onLaunchFlight({
      lat,
      lon,
      altitudeM,
      label: flightLabel || `Recon Target [${lat.toFixed(4)}°, ${lon.toFixed(4)}°]`,
    });
  };

  if (embedded) {
    return (
      <div
        className={`h-full flex flex-col font-mono text-[11px] select-none ${
          isDark ? "bg-[#0b0f17] text-slate-200" : "bg-white text-slate-800"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Subtitle / Description */}
          <div className="p-2.5 bg-[#07090e] border border-slate-800 text-slate-300 text-[10px] space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[9px]">
              <span className="w-1.5 h-1.5 bg-cyan-400 shrink-0" />
              <span>INGENUITY ANALOGUE AUTONOMOUS SCOUT</span>
            </div>
            <p className="text-slate-400 text-[9px] leading-relaxed">
              {t("subtitle") || "Reconnaissance drone for autonomous terrain hazard clearance ahead of astronaut traverses."}
            </p>
          </div>

          {/* Real-time In-Flight Telemetry HUD */}
          {isFlying && flightTelemetry && (
            <div className="p-2.5 bg-[#064e3b]/40 border border-[#10b981] space-y-1.5">
              <div className="flex items-center justify-between text-[#34d399] font-bold text-[9px] uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                  <span>{t("inFlight")}</span>
                </span>
                <span>{t("heading")} {flightTelemetry.headingDeg.toFixed(0)}°</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px] pt-1.5 border-t border-[#10b981]/40 tabular-nums">
                <div>
                  <span className="text-slate-400 block text-[8px]">{t("altitude")}</span>
                  <span className="text-white font-bold">{flightTelemetry.altitudeM.toFixed(0)} m</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px]">{t("airspeed")}</span>
                  <span className="text-white font-bold">{flightTelemetry.speedMs.toFixed(0)} m/s</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px]">{t("remaining")}</span>
                  <span className="text-amber-400 font-bold">{flightTelemetry.distanceRemainingKm.toFixed(2)} km</span>
                </div>
              </div>
            </div>
          )}

          {/* Coordinate Inputs */}
          <div className="space-y-2 p-2.5 bg-[#07090e] border border-slate-800">
            <span className="text-[8.5px] text-cyan-400 uppercase font-bold tracking-wider block">
              {t("targetCoords")}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] text-slate-400 block mb-0.5">{t("latitude")}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={targetLat}
                  onChange={(e) => setTargetLat(e.target.value)}
                  placeholder="-5.4453"
                  className="w-full px-2 py-1 bg-[#111827] border border-slate-700 text-slate-100 font-mono text-[10px] focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[8px] text-slate-400 block mb-0.5">{t("longitude")}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={targetLon}
                  onChange={(e) => setTargetLon(e.target.value)}
                  placeholder="137.8414"
                  className="w-full px-2 py-1 bg-[#111827] border border-slate-700 text-slate-100 font-mono text-[10px] focus:outline-none focus:border-cyan-500 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-[8px] text-slate-400 block mb-0.5">{t("designation")}</label>
              <input
                type="text"
                value={flightLabel}
                onChange={(e) => setFlightLabel(e.target.value)}
                placeholder="Recon Station Alpha"
                className="w-full px-2 py-1 bg-[#111827] border border-slate-700 text-slate-100 font-mono text-[10px] focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[8px] text-slate-400 mb-0.5">
                <span>{t("cruiseAltitude")}</span>
                <span className="text-cyan-400 font-bold tabular-nums">{altitudeM} m AGL</span>
              </div>
              <input
                type="range"
                min={100}
                max={1200}
                step={50}
                value={altitudeM}
                onChange={(e) => setAltitudeM(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="p-2.5 bg-[#07090e] border border-slate-800 space-y-1.5">
            <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-wider block">
              {t("presets")}
            </span>
            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-0.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleApplyPreset(p)}
                  className="px-2 py-1.5 bg-[#111827]/80 hover:bg-[#1f2937] border border-slate-800 text-left text-[9.5px] flex items-center justify-between text-slate-300 transition-colors"
                >
                  <span className="truncate">{p.label}</span>
                  <span className="text-[8px] text-cyan-400 tabular-nums ml-2 shrink-0">
                    {p.lat.toFixed(3)}°, {p.lon.toFixed(3)}°
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Flight Execution Button */}
          <div className="pt-1">
            <button
              onClick={handleExecuteLaunch}
              disabled={isFlying}
              className={`w-full py-2.5 px-3 border font-bold text-[10px] tracking-wider transition-colors flex items-center justify-center gap-2 ${
                isFlying
                  ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-[#064e3b] hover:bg-[#047857] text-[#34d399] border-[#10b981] shadow-lg cursor-pointer"
              }`}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <span>{isFlying ? t("scoutInFlight") : t("launchFlight")}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed top-14 right-4 z-40 w-84 border font-mono select-none shadow-2xl transition-all duration-200 ${
        isDark ? "bg-[#07090e]/98 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"
      }`}
    >
      {/* Header */}
      <div className="h-8 px-3 bg-[#0b0f17] flex items-center justify-between border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider">
        <span className="flex items-center gap-2 text-cyan-400">
          {/* Aircraft SVG Vector Icon */}
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
          <span>{t("title")}</span>
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white px-1.5 text-[11px] font-bold"
          title="Close Aerial Dock"
        >
          ✕
        </button>
      </div>

      <div className="p-3 space-y-3 text-[10px]">
        {/* Real-time In-Flight Telemetry HUD */}
        {isFlying && flightTelemetry && (
          <div className="p-2 bg-[#064e3b]/40 border border-[#10b981] space-y-1">
            <div className="flex items-center justify-between text-[#34d399] font-bold text-[9px] uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                <span>{t("inFlight")}</span>
              </span>
              <span>{t("heading")} {flightTelemetry.headingDeg.toFixed(0)}°</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[9px] pt-1 border-t border-[#10b981]/40 tabular-nums">
              <div>
                <span className="text-slate-400 block text-[8px]">{t("altitude")}</span>
                <span className="text-white font-bold">{flightTelemetry.altitudeM.toFixed(0)} m</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px]">{t("airspeed")}</span>
                <span className="text-white font-bold">{flightTelemetry.speedMs.toFixed(0)} m/s</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[8px]">{t("remaining")}</span>
                <span className="text-amber-400 font-bold">{flightTelemetry.distanceRemainingKm.toFixed(2)} km</span>
              </div>
            </div>
          </div>
        )}

        {/* Coordinate Inputs */}
        <div className="space-y-2">
          <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">
            {t("targetCoords")}
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] text-slate-400 block mb-0.5">{t("latitude")}</label>
              <input
                type="number"
                step="0.0001"
                value={targetLat}
                onChange={(e) => setTargetLat(e.target.value)}
                placeholder="-5.4453"
                className="w-full px-2 py-1 bg-[#111827] border border-slate-700 text-slate-100 font-mono text-[10px] focus:outline-none focus:border-cyan-500 tabular-nums"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-0.5">{t("longitude")}</label>
              <input
                type="number"
                step="0.0001"
                value={targetLon}
                onChange={(e) => setTargetLon(e.target.value)}
                placeholder="137.8414"
                className="w-full px-2 py-1 bg-[#111827] border border-slate-700 text-slate-100 font-mono text-[10px] focus:outline-none focus:border-cyan-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-[8px] text-slate-400 block mb-0.5">{t("designation")}</label>
            <input
              type="text"
              value={flightLabel}
              onChange={(e) => setFlightLabel(e.target.value)}
              placeholder="Recon Station Alpha"
              className="w-full px-2 py-1 bg-[#111827] border border-slate-700 text-slate-100 font-mono text-[10px] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-[8px] text-slate-400 mb-0.5">
              <span>{t("cruiseAltitude")}</span>
              <span className="text-cyan-400 font-bold tabular-nums">{altitudeM} m AGL</span>
            </div>
            <input
              type="range"
              min={100}
              max={1200}
              step={50}
              value={altitudeM}
              onChange={(e) => setAltitudeM(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-2 border-t border-slate-800">
          <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
            {t("presets")}
          </span>
          <div className="grid grid-cols-1 gap-1 max-h-28 overflow-y-auto pr-1">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => handleApplyPreset(p)}
                className="px-2 py-1 bg-[#111827]/80 hover:bg-[#1f2937] border border-slate-800 text-left text-[9px] flex items-center justify-between text-slate-300 transition-colors"
              >
                <span className="truncate">{p.label}</span>
                <span className="text-[8px] text-slate-500 tabular-nums ml-2 shrink-0">
                  {p.lat.toFixed(3)}°, {p.lon.toFixed(3)}°
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Flight Execution Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={handleExecuteLaunch}
            disabled={isFlying}
            className={`w-full py-2 px-3 border font-bold text-[10px] tracking-wider transition-colors flex items-center justify-center gap-2 ${
              isFlying
                ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-[#064e3b] hover:bg-[#047857] text-[#34d399] border-[#10b981] shadow-lg cursor-pointer"
            }`}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
            <span>{isFlying ? t("scoutInFlight") : t("launchFlight")}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

MarsAerialScoutDock.displayName = "MarsAerialScoutDock";

export default MarsAerialScoutDock;
