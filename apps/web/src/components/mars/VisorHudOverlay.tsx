"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";
import { MarswalkRouteResult } from "@/lib/martian/marswalkRouter";
import { computeRadioLineOfSight } from "@/lib/martian/scientificParams";
import type { SpaceWeatherTelemetry } from "@/app/api/space-weather/route";
import type { MartianWeatherFeed } from "@/app/api/mars-weather/route";

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
  const t = useTranslations("hud");
  const isDark = theme === "dark";
  const target = selectedWaypoint ?? activeRoute?.targetWaypoint;

  // Real NASA DONKI + MSL RAD Telemetry State
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeatherTelemetry | null>(null);
  const [martianWeather, setMartianWeather] = useState<MartianWeatherFeed | null>(null);

  const isJezero = target?.id?.startsWith("jzr_") ?? false;

  // Fetch real NASA DONKI / MSL RAD and REMS/MEDA weather telemetry
  useEffect(() => {
    let isMounted = true;
    async function loadTelemetry() {
      try {
        const [swRes, wxRes] = await Promise.all([
          fetch("/api/space-weather"),
          fetch(`/api/mars-weather?mission=${isJezero ? "m2020" : "msl"}`),
        ]);
        if (swRes.ok && isMounted) {
          const swData: SpaceWeatherTelemetry = await swRes.json();
          setSpaceWeather(swData);
        }
        if (wxRes.ok && isMounted) {
          const wxData: MartianWeatherFeed = await wxRes.json();
          setMartianWeather(wxData);
        }
      } catch (err) {
        console.warn("[VisorHud] Live telemetry fetch fallback to calibrated baseline", err);
      }
    }
    loadTelemetry();
    const refreshTimer = setInterval(loadTelemetry, 60000);
    return () => {
      isMounted = false;
      clearInterval(refreshTimer);
    };
  }, [isJezero]);

  // Deterministic physiological heart rate based on terrain slope and EVA metabolic rate (NO random jitter)
  // Base resting EVA: ~74 BPM + 2.2 BPM per degree slope grade + 16 BPM elevated under dust storm conditions
  const meanSlope = target?.meanSlopeDeg ?? 8.2;
  const calculatedHeartRate = Math.min(
    138,
    Math.max(72, Math.round(74 + meanSlope * 2.2 + (dustStormActive ? 16 : 0)))
  );

  // Deterministic astronaut compass bearing towards active waypoint (or Gale Crater central peak datum: 137.4°E, -4.6°S)
  const calculatedHeading = target
    ? Math.round(
        ((Math.atan2(target.coordinates[0] - 137.38, target.coordinates[1] - (-4.67)) * 180) / Math.PI + 360) % 360
      )
    : 142;

  const o2Level = activeRoute?.remainingO2Percent ?? 92;

  const radioLos = target
    ? computeRadioLineOfSight(target.coordinates[0], target.coordinates[1], target.elevationM)
    : "CONNECTED";

  // Telemetry values derived from real planetary environment models & live REMS/MEDA feed
  const windSpeed = dustStormActive
    ? "24.8 m/s GUSTS"
    : martianWeather
    ? `${martianWeather.windSpeedMs.toFixed(1)} m/s ${martianWeather.windDirection}`
    : "5.4 m/s ESE";
  const dustTau = dustStormActive
    ? "TAU 2.4 (EXTREME)"
    : martianWeather
    ? `TAU ${martianWeather.dustOpacityTau.toFixed(2)} (${martianWeather.atmoOpacity.toUpperCase()})`
    : "TAU 0.32 (CLEAR)";
  const solarFlux = dustStormActive ? "112 W/m²" : "590 W/m²";
  const batteryPct = dustStormActive
    ? Math.max(30, (activeRoute?.remainingBatteryPercent ?? 88) - 22)
    : (activeRoute?.remainingBatteryPercent ?? 88);

  const speAlert = spaceWeather?.speAlertLevel ?? "NOMINAL";
  const radRateText = spaceWeather
    ? `${spaceWeather.doseRateMSvHr.toFixed(3)} mSv/h`
    : `${(target?.surfaceRadiationMSvSol ?? 0.68).toFixed(2)} mSv/d`;

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
            {t("astronautBearing")}
          </div>
          <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
            <span className={isDark ? "text-slate-600" : "text-slate-400"}>120°</span>
            <span className={isDark ? "text-slate-500" : "text-slate-500"}>130°</span>
            <span className="text-amber-500 text-xs border-b border-amber-400 px-1 font-bold">
              {calculatedHeading}° SE
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
            <span className="font-bold tracking-wider text-cyan-500 uppercase">{t("plssLifeSupport")}</span>
          </div>
          <span className={`font-bold ${dustStormActive ? "text-amber-500" : "text-emerald-500"}`}>
            {dustStormActive ? t("elevatedLoad") : t("nominal")}
          </span>
        </div>

        {/* O2 Tank Meter */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className={isDark ? "text-slate-400" : "text-slate-600"}>{t("o2Capacity")}</span>
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
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("suitPressure")}</span>
            <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"} tabular-nums`}>29.6 kPa</span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("heartRate")}</span>
            <span className="font-bold text-emerald-500 tabular-nums">{calculatedHeartRate} BPM</span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("radDose")}</span>
            <span className="font-bold text-amber-500 tabular-nums">
              {radRateText}
            </span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("suitBattery")}</span>
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
            <span className="font-bold tracking-wider text-amber-500 uppercase">{t("envWeather")}</span>
          </div>
          <span className={`font-bold ${isDark ? "text-slate-300" : "text-slate-700"} tabular-nums`}>SOL {currentSol}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[9px]">
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("remsWind")}</span>
            <span className={`font-bold tabular-nums ${dustStormActive ? "text-red-500" : isDark ? "text-white" : "text-slate-900"}`}>
              {windSpeed}
            </span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("dustOpacity")}</span>
            <span className={`font-bold tabular-nums ${dustStormActive ? "text-amber-500" : "text-emerald-500"}`}>
              {dustTau}
            </span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("atmTemp")}</span>
            <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"} tabular-nums`}>
              {martianWeather ? `${martianWeather.maxTempC}°C | ${Math.round(martianWeather.atmosphericPressurePa)} Pa` : "-18°C | 745 Pa"}
            </span>
          </div>
          <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
            <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("donkiSpaceWx")}</span>
            <span className={`font-bold tabular-nums ${speAlert === "WARNING" ? "text-rose-500 animate-pulse" : speAlert === "WATCH" ? "text-amber-500" : "text-emerald-500"}`}>
              [{speAlert}]
            </span>
          </div>
        </div>

        {/* Radio Line-of-Sight Telemetry */}
        <div className={`flex items-center justify-between text-[9px] pt-1 border-t ${isDark ? "border-amber-900/60" : "border-amber-200"}`}>
          <span className={isDark ? "text-slate-400" : "text-slate-600"}>{t("radioComms")}</span>
          <span className={`font-bold ${radioLos === "CONNECTED" ? "text-emerald-400" : "text-rose-400"}`}>
            [{radioLos === "CONNECTED" ? t("losConnected") : t("blockedMro")}]
          </span>
        </div>
      </div>

      {/* BOTTOM-RIGHT (w-80, bottom-16 with clearance above unified bottom bar): Card ACTIVE TARGET NAVIGATION */}
      {target && (
        <div className={`absolute bottom-16 right-4 w-80 ${
          isDark ? "bg-[#0b0f17] border-amber-600/90 text-amber-300" : "bg-white border-amber-600 text-amber-900 shadow-md"
        } p-3 border space-y-2 pointer-events-auto`}>
          <div className={`flex items-center justify-between border-b ${isDark ? "border-amber-900/80" : "border-amber-200"} pb-1 text-[10px]`}>
            <span className="font-bold tracking-wider text-amber-500 uppercase">{t("targetNav")}</span>
            <div className="flex items-center gap-1.5">
              <span className={`px-1 py-0.2 border text-[8px] font-bold ${
                target.id.startsWith("jzr_")
                  ? "bg-[#4c1d95]/40 text-[#d8b4fe] border-[#a855f7]/60"
                  : "bg-[#78350f]/40 text-[#fde68a] border-[#f59e0b]/60"
              }`}>
                {target.id.startsWith("jzr_") ? "JEZERO // M2020" : "GALE // MSL"}
              </span>
              <span className="text-cyan-500 font-bold">{t("locked")}</span>
            </div>
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
              <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("distance")}</span>
              <span className="font-bold text-amber-500 tabular-nums">
                {activeRoute?.totalDistanceKm ?? 4.2} km
              </span>
            </div>
            <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"} p-1.5 border`}>
              <span className={`${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("meanSlope")}</span>
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
            <span>{t("inspectPov")}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(VisorHudOverlay);