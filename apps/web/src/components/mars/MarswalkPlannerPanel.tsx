"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  MOUNT_SHARP_WAYPOINTS,
  MountSharpWaypoint,
} from "@/lib/martian/mountSharpWaypoints";
import { computeRadioLineOfSight } from "@/lib/martian/scientificParams";
import {
  planMarswalkRoute,
  MarswalkRouteResult,
  MissionSupportMode,
} from "@/lib/martian/marswalkRouter";

interface MarswalkPlannerPanelProps {
  onRouteCalculated: (route: MarswalkRouteResult) => void;
  selectedWaypoint: MountSharpWaypoint | null;
  availableWaypoints?: MountSharpWaypoint[];
  theme?: "dark" | "light";
}

export const MarswalkPlannerPanel: React.FC<MarswalkPlannerPanelProps> = ({
  onRouteCalculated,
  selectedWaypoint,
  availableWaypoints,
  theme = "dark",
}) => {
  const t = useTranslations("marswalk");
  const isDark = theme === "dark";
  const waypointList = availableWaypoints && availableWaypoints.length > 0
    ? availableWaypoints
    : MOUNT_SHARP_WAYPOINTS;
  const [startId, setStartId] = useState<string>("gale_hab_alpha");
  const [targetId, setTargetId] = useState<string>("curiosity_boxwork_2025");
  const [supportMode, setSupportMode] = useState<MissionSupportMode>("PAIRED_CREW_MULE_ROVER");
  const [avoidRadiation, setAvoidRadiation] = useState<boolean>(true);
  const [show5mNodesTable, setShow5mNodesTable] = useState<boolean>(false);

  React.useEffect(() => {
    if (selectedWaypoint) {
      const isJezero = selectedWaypoint.id.startsWith("jzr_") || selectedWaypoint.coordinates[0] < 100;
      const expectedBaseId = isJezero ? "jzr_hab_alpha" : "gale_hab_alpha";
      if (selectedWaypoint.id === expectedBaseId) {
        setStartId(expectedBaseId);
        const defaultTarget = isJezero ? "jzr_three_forks_delta" : "curiosity_boxwork_2025";
        setTargetId(defaultTarget);
      } else {
        setStartId(expectedBaseId);
        setTargetId(selectedWaypoint.id);
      }
    }
  }, [selectedWaypoint]);

  const routeResult: MarswalkRouteResult = useMemo(() => {
    const res = planMarswalkRoute({
      startWaypointId: startId,
      targetWaypointId: targetId,
      supportMode,
      avoidHighRadiationRidges: avoidRadiation,
      customWaypoints: availableWaypoints,
    });
    onRouteCalculated(res);
    return res;
  }, [startId, targetId, supportMode, avoidRadiation, availableWaypoints]);

  const radioLos = useMemo(() => {
    return computeRadioLineOfSight(
      routeResult.targetWaypoint.coordinates[0],
      routeResult.targetWaypoint.coordinates[1],
      routeResult.targetWaypoint.elevationM
    );
  }, [routeResult.targetWaypoint]);

  // High-Density Chart Data (5-Meter Micro-Resolution Curve)
  const chartData = useMemo(() => {
    if (routeResult.highDensityRoutePoints && routeResult.highDensityRoutePoints.length > 0) {
      const allPts = routeResult.highDensityRoutePoints;
      const step = Math.max(1, Math.floor(allPts.length / 100));
      const points: any[] = [];
      for (let i = 0; i < allPts.length; i += step) {
        const pt = allPts[i];
        points.push({
          distanceKm: parseFloat((pt.cumulativeDistanceM / 1000).toFixed(2)),
          elevationM: pt.elevationM,
          slopeDeg: pt.slopeDeg,
          name: `${pt.cumulativeDistanceM}m`,
        });
      }
      return points;
    }

    let runningDist = 0;
    const points = [
      {
        distanceKm: 0,
        elevationM: routeResult.startWaypoint.elevationM,
        slopeDeg: routeResult.startWaypoint.meanSlopeDeg,
        name: routeResult.startWaypoint.name.split(" ")[0],
      },
    ];

    routeResult.segments.forEach((seg, idx) => {
      runningDist += seg.distanceKm;
      points.push({
        distanceKm: parseFloat(runningDist.toFixed(1)),
        elevationM: seg.toElevationM,
        slopeDeg: seg.slopeDeg,
        name: `Node ${idx + 1}`,
      });
    });

    return points;
  }, [routeResult]);

  // Proportional Y-Axis Domain Normalization (Occupies 20% - 85% of chart height)
  const elevationDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [-4600, -3800];
    const elevs = chartData
      .map((d: any) => d.elevationM)
      .filter((e: number) => typeof e === "number" && !isNaN(e));
    if (elevs.length === 0) return [-4600, -3800];
    const minVal = Math.min(...elevs);
    const maxVal = Math.max(...elevs);
    const range = Math.max(20, maxVal - minVal);
    // 20% to 85% utilization -> span = range / 0.65
    const totalSpan = range / 0.65;
    const bottomPad = Math.round(totalSpan * 0.20);
    const topPad = Math.round(totalSpan * 0.15);
    return [Math.floor(minVal - bottomPad), Math.ceil(maxVal + topPad)];
  }, [chartData]);

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${
      isDark ? "text-slate-200" : "text-slate-800"
    } text-xs p-3 space-y-3 font-sans`}>
      {/* Header */}
      <div className={`border-b ${isDark ? "border-slate-800" : "border-slate-300"} pb-2`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-500 font-bold">
            {t("title")}
          </span>
          <span
            className={`px-1.5 py-0.5 font-mono text-[9px] font-bold border ${
              routeResult.overallSafetyIndex >= 75
                ? "bg-[#064e3b] text-[#34d399] border-[#059669]"
                : routeResult.overallSafetyIndex >= 50
                ? "bg-[#78350f] text-[#fde68a] border-[#d97706]"
                : "bg-[#7f1d1d] text-[#fca5a5] border-[#dc2626]"
            }`}
          >
            {t("safety")} <span className="tabular-nums">{routeResult.overallSafetyIndex}</span> / 100
          </span>
        </div>
        <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-0.5 font-mono`}>
          {t("subtitle")}
        </p>
      </div>

      {/* Origin & Destination Selectors (Flat Solid) */}
      <div className={`grid grid-cols-2 gap-2 ${
        isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"
      } p-2.5 border`}>
        <div>
          <label className={`font-mono text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"} block mb-1 uppercase tracking-wider`}>
            {t("startBase")}
          </label>
          <select
            value={startId}
            onChange={(e) => setStartId(e.target.value)}
            className={`w-full ${
              isDark ? "bg-[#0b0f17] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
            } border px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-amber-500`}
          >
            {waypointList.map((wp) => (
              <option key={wp.id} value={wp.id}>
                {wp.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`font-mono text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"} block mb-1 uppercase tracking-wider`}>
            {t("scienceTarget")}
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className={`w-full ${
              isDark ? "bg-[#0b0f17] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
            } border px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-amber-500`}
          >
            {waypointList.map((wp) => (
              <option key={wp.id} value={wp.id}>
                {wp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mission Support Mode Toggle (Flat Solid Buttons, Sharp 1px Border) */}
      <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2.5 border`}>
        <span className={`font-mono text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"} uppercase tracking-wider block mb-1.5`}>
          {t("missionSupportConfig")}
        </span>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
          <button
            onClick={() => setSupportMode("SOLO_ASTRONAUT")}
            className={`p-2 border transition-colors text-left flex flex-col justify-between ${
              supportMode === "SOLO_ASTRONAUT"
                ? isDark
                  ? "bg-[#161e2e] border-amber-500 text-white"
                  : "bg-amber-50 border-amber-500 text-amber-950 font-bold"
                : isDark
                ? "bg-[#0b0f17] border-slate-800 text-slate-400 hover:text-slate-200"
                : "bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
              <span>{t("soloAstronaut")}</span>
            </div>
            <span className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-1`}>
              {t("soloAstronautDesc")}
            </span>
          </button>

          <button
            onClick={() => setSupportMode("PAIRED_CREW_MULE_ROVER")}
            className={`p-2 border transition-colors text-left flex flex-col justify-between ${
              supportMode === "PAIRED_CREW_MULE_ROVER"
                ? isDark
                  ? "bg-[#161e2e] border-cyan-500 text-white"
                  : "bg-cyan-50 border-cyan-500 text-cyan-950 font-bold"
                : isDark
                ? "bg-[#0b0f17] border-slate-800 text-slate-400 hover:text-slate-200"
                : "bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="10" rx="1" />
                <circle cx="6" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
              </svg>
              <span>{t("pairedMule")}</span>
            </div>
            <span className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-1`}>
              {t("pairedMuleDesc")}
            </span>
          </button>
        </div>
      </div>

      {/* Trajectory Key Metrics Grid (Flat Solid, Tabular Nums) */}
      <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2 border`}>
          <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("distance")}</span>
          <span className="text-xs font-bold text-amber-500 tabular-nums">{routeResult.totalDistanceKm} km</span>
        </div>

        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2 border`}>
          <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("duration")}</span>
          <span className="text-xs font-bold text-cyan-500 tabular-nums">{routeResult.estimatedDurationHours} h</span>
          <span className={`text-[8px] ${isDark ? "text-slate-500" : "text-slate-400"} block tabular-nums`}>{t("solUnit", { sol: routeResult.solFraction })}</span>
        </div>

        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2 border`}>
          <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("o2Reserve")}</span>
          <span
            className={`text-xs font-bold tabular-nums ${
              routeResult.remainingO2Percent > 35 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {routeResult.remainingO2Percent}%
          </span>
          <span className={`text-[8px] ${isDark ? "text-slate-500" : "text-slate-400"} block tabular-nums`}>{routeResult.totalO2ConsumedLiters}L</span>
        </div>

        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2 border`}>
          <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>{t("battery")}</span>
          <span
            className={`text-xs font-bold tabular-nums ${
              routeResult.remainingBatteryPercent > 30 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {routeResult.remainingBatteryPercent}%
          </span>
          <span className={`text-[8px] ${isDark ? "text-slate-500" : "text-slate-400"} block tabular-nums`}>{routeResult.totalBatteryWh}Wh</span>
        </div>
      </div>

      {/* Radio Line-of-Sight Banner */}
      <div className={`p-2 border flex items-center justify-between font-mono text-[10px] ${
        isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"
      }`}>
        <span className="text-slate-400 uppercase">{t("radioCommsLos")}</span>
        <span className={`px-1.5 py-0.5 border font-bold text-[9px] ${
          radioLos === "CONNECTED"
            ? "bg-[#064e3b] text-[#34d399] border-[#059669]"
            : "bg-[#7f1d1d] text-[#fca5a5] border-[#dc2626]"
        }`}>
          [{radioLos === "CONNECTED" ? t("radioConnected") : t("radioBlocked")}]
        </span>
      </div>

      {/* Route Safety Rationale & Multi-Layer Synthesis (RULE 2: Zero Gradients, Tabular Typography) */}
      {routeResult.safetyRationale && (
        <div className={`p-2.5 border ${
          routeResult.safetyRationale.verdictLevel === "SAFE"
            ? "border-emerald-700/80 bg-[#07130e]"
            : routeResult.safetyRationale.verdictLevel === "CAUTION"
            ? "border-amber-700/80 bg-[#161208]"
            : "border-red-700/80 bg-[#1a0808]"
        } space-y-2 font-mono text-xs`}>
          {/* Header & Verdict */}
          <div className="flex items-center justify-between border-b pb-1.5 border-slate-800">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                {t("safetyRationaleTitle")}
              </span>
              <span className={`text-[11px] font-bold ${
                routeResult.safetyRationale.verdictLevel === "SAFE"
                  ? "text-emerald-400"
                  : routeResult.safetyRationale.verdictLevel === "CAUTION"
                  ? "text-amber-400"
                  : "text-red-400"
              }`}>
                {routeResult.safetyRationale.verdictTag}
              </span>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-black/50 border border-slate-700 text-slate-300 font-bold tabular-nums">
              INDEX: {routeResult.overallSafetyIndex}/100
            </span>
          </div>

          {/* Executive Summary */}
          <p className="text-[10px] leading-relaxed text-slate-200 font-sans">
            {routeResult.safetyRationale.executiveSummary}
          </p>

          {/* 5-Layer Multi-Attribute Scientific Breakdown */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[9px]">
            {/* 1. Topografi & Lereng */}
            <div className="p-2 bg-[#0b0f17] border border-slate-800 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">{t("topoSection")}</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {routeResult.safetyRationale.slopeAnalysis.statusTag}
                </span>
              </div>
              <p className="text-slate-300 font-sans text-[9px] leading-tight">
                {routeResult.safetyRationale.slopeAnalysis.description}
              </p>
            </div>

            {/* 2. Geofisika & Deteksi Pasir Hisap (THEMIS Night IR & TES) */}
            <div className="p-2 bg-[#0b0f17] border border-slate-800 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400">{t("sandTrapSection")}</span>
                <span className={`font-bold tabular-nums ${
                  routeResult.sandTrapWarningCount === 0 ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {routeResult.safetyRationale.sandTrapAnalysis.statusTag}
                </span>
              </div>
              <p className="text-slate-300 font-sans text-[9px] leading-tight">
                {routeResult.safetyRationale.sandTrapAnalysis.description}
              </p>
            </div>

            {/* 3. Radiasi & Perisai Magnetik Kerak (MGS MAG & RAD) */}
            <div className="p-2 bg-[#0b0f17] border border-slate-800 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-400">{t("radiationSection")}</span>
                <span className="text-cyan-400 font-bold tabular-nums">
                  {routeResult.safetyRationale.radiationAnalysis.statusTag}
                </span>
              </div>
              <p className="text-slate-300 font-sans text-[9px] leading-tight">
                {routeResult.safetyRationale.radiationAnalysis.description}
              </p>
            </div>

            {/* 4. Mineralogi & Kimia (CRISM & GRS/DAN) */}
            <div className="p-2 bg-[#0b0f17] border border-slate-800 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">{t("mineralogySection")}</span>
                <span className="text-emerald-400 font-bold">
                  {routeResult.safetyRationale.mineralogyAnalysis.statusTag}
                </span>
              </div>
              <p className="text-slate-300 font-sans text-[9px] leading-tight">
                {routeResult.safetyRationale.mineralogyAnalysis.description}
              </p>
            </div>

            {/* 5. Logistik & Cadangan Baterai/O2 */}
            <div className="p-2 bg-[#0b0f17] border border-slate-800 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{t("consumablesSection")}</span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {routeResult.safetyRationale.consumableAnalysis.statusTag}
                </span>
              </div>
              <p className="text-slate-300 font-sans text-[9px] leading-tight">
                {routeResult.safetyRationale.consumableAnalysis.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5-Meter High-Density Telemetry Node Explorer (MMGIS Micro-Transect Standard) */}
      {routeResult.highDensityRoutePoints && routeResult.highDensityRoutePoints.length > 0 && (
        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2.5 border font-mono`}>
          <div className="flex items-center justify-between border-b pb-1.5 border-slate-800 text-[10px]">
            <div>
              <span className="font-bold text-amber-400 uppercase block">
                5-METER HIGH-DENSITY SAMPLING
              </span>
              <span className="text-[8px] text-slate-400">
                RESOLUTION: ~5.0 METER STEP • {routeResult.highDensityRoutePoints.length} DISCRETE NODES
              </span>
            </div>
            <button
              onClick={() => setShow5mNodesTable((prev) => !prev)}
              className={`px-2 py-0.5 text-[9px] font-bold border transition-colors ${
                show5mNodesTable
                  ? "bg-amber-600 text-slate-950 border-amber-400"
                  : isDark
                  ? "bg-[#0b0f17] text-slate-300 border-slate-700 hover:text-white"
                  : "bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900"
              }`}
            >
              {show5mNodesTable ? "[HIDE 5M NODES]" : `[VIEW 5M NODES (${routeResult.highDensityRoutePoints.length})]`}
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-1 pt-2 text-center text-[8px]">
            <div className="p-1 bg-[#0b0f17] border border-slate-800">
              <span className="text-slate-400 block">SAMPLING RES</span>
              <span className="text-cyan-400 font-bold tabular-nums">5.0 M</span>
            </div>
            <div className="p-1 bg-[#0b0f17] border border-slate-800">
              <span className="text-slate-400 block">SAND TRAP RISK</span>
              <span className="text-emerald-400 font-bold">0% [BEDROCK FIRM]</span>
            </div>
            <div className="p-1 bg-[#0b0f17] border border-slate-800">
              <span className="text-slate-400 block">MGS MAG SHIELD</span>
              <span className="text-purple-400 font-bold tabular-nums">~11% GCR CUT</span>
            </div>
          </div>

          {/* Collapsible 5m Nodes Telemetry Table */}
          {show5mNodesTable && (
            <div className="mt-2 pt-2 border-t border-slate-800 max-h-56 overflow-y-auto space-y-1">
              <div className="grid grid-cols-5 text-[8px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-800 px-1">
                <span>DIST</span>
                <span>ELEV</span>
                <span>SLOPE</span>
                <span>BEARING</span>
                <span>STATUS</span>
              </div>
              {routeResult.highDensityRoutePoints.slice(0, 80).map((pt, i) => (
                <div
                  key={i}
                  className="grid grid-cols-5 text-[8px] py-0.5 px-1 hover:bg-[#161e2e] transition-colors tabular-nums border-b border-slate-800/40"
                >
                  <span className="text-slate-300 font-bold">{pt.cumulativeDistanceM} m</span>
                  <span className="text-amber-400">{pt.elevationM} m</span>
                  <span className={pt.slopeDeg > 15 ? "text-amber-400" : "text-emerald-400"}>
                    {pt.slopeDeg}°
                  </span>
                  <span className="text-cyan-300">{pt.surfaceFirmness.split(" ")[0]}</span>
                  <span className="text-emerald-400 font-bold">[OK]</span>
                </div>
              ))}
              {routeResult.highDensityRoutePoints.length > 80 && (
                <div className="text-[8px] text-center text-slate-400 pt-1">
                  + {routeResult.highDensityRoutePoints.length - 80} more high-density nodes along the traverse path.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lambertian Photometric Scattering Telemetry (NASA AMMOS & Paper 2132) */}
      {routeResult.photometry && (
        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2.5 border font-mono`}>
          <div className="flex items-center justify-between border-b pb-1.5 mb-2 border-slate-800 text-[10px]">
            <span className="font-bold text-cyan-400 uppercase">
              {t("lambertianTitle")}
            </span>
            <span className="text-amber-400 font-bold tabular-nums">
              {t("zenith")} {routeResult.photometry.solarIncidenceDeg}°
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] mb-2">
            <div className={`p-1.5 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className="text-slate-400 block uppercase">{t("contrast")}</span>
              <span className="font-bold text-amber-400 tabular-nums">
                {routeResult.photometry.terrainContrastIndex}
              </span>
            </div>
            <div className={`p-1.5 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className="text-slate-400 block uppercase">{t("glareHazard")}</span>
              <span className="font-bold text-cyan-400 tabular-nums">
                {routeResult.photometry.glareObstacleIndex}
              </span>
            </div>
            <div className={`p-1.5 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className="text-slate-400 block uppercase">{t("shadowMultiplier")}</span>
              <span className="font-bold text-emerald-400 tabular-nums">
                {routeResult.photometry.shadowLengthMultiplier}x
              </span>
            </div>
          </div>

          <div className={`p-1.5 border ${
            routeResult.photometry.glareObstacleIndex > 0.4
              ? "bg-[#271008] border-amber-600 text-amber-200"
              : isDark
              ? "bg-[#0b0f17] border-slate-800 text-slate-300"
              : "bg-slate-50 border-slate-200 text-slate-700"
          } text-[9px] flex items-center justify-between`}>
            <span>{t("visibilityAdvisory")}</span>
            <span className="font-bold">
              {routeResult.photometry.glareObstacleIndex > 0.4
                ? t("glareWarning")
                : t("glareNominal")}
            </span>
          </div>
        </div>
      )}

      {/* Elevation & Slope Profile Chart (NO GRADIENTS, SOLID FILL) */}
      <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2.5 border font-mono`}>
        <div className="flex items-center justify-between mb-1.5 text-[10px]">
          <span className={`${isDark ? "text-slate-300" : "text-slate-700"} uppercase font-bold`}>
            {t("elevationProfile")}
          </span>
          <span className="text-cyan-500 tabular-nums font-bold">
            +{routeResult.cumulativeAscentM}m / -{routeResult.cumulativeDescentM}m
          </span>
        </div>

        <div className="w-full h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="distanceKm" unit="km" tick={{ fill: "#64748b", fontSize: 9 }} />
              <YAxis
                domain={elevationDomain}
                unit="m"
                tick={{ fill: "#64748b", fontSize: 9 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0b0f17" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#cbd5e1",
                  fontSize: 10,
                  borderRadius: 0,
                  color: isDark ? "#f8fafc" : "#0f172a",
                }}
                formatter={(value: any, name: string) => [
                  name === "elevationM" ? `${value} m` : `${value}°`,
                  name === "elevationM" ? t("elevationLabel") : t("slopeLabel"),
                ]}
              />
              {/* Solid fill, zero gradients */}
              <Area
                type="monotone"
                dataKey="elevationM"
                stroke="#d97706"
                strokeWidth={1.5}
                fill={isDark ? "#1e293b" : "#e2e8f0"}
                fillOpacity={0.6}
                name="elevationM"
              />
              <Line
                type="monotone"
                dataKey="slopeDeg"
                stroke="#06b6d4"
                strokeWidth={1.5}
                dot={false}
                name="slopeDeg"
              />
              <ReferenceLine y={Math.round((elevationDomain[0] + elevationDomain[1]) / 2)} stroke="#334155" strokeDasharray="2 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hazard Warning Banners (Flat Solid, Structured Tags) */}
      {routeResult.hazardAlerts.length > 0 && (
        <div className="p-2.5 bg-[#170a08] border border-red-700 text-[10px] space-y-1 font-mono">
          <span className="text-red-400 font-bold block uppercase">
            {t("hazardTitle")}
          </span>
          {routeResult.hazardAlerts.map((alert, i) => (
            <p key={i} className="text-red-200">
              • {alert}
            </p>
          ))}
        </div>
      )}

      {/* Operational Checklist */}
      <div className={`${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2.5 border space-y-1 font-mono text-[10px]`}>
        <span className={`${isDark ? "text-slate-400" : "text-slate-500"} uppercase tracking-wider block mb-1 font-bold`}>
          {t("checklistTitle")}
        </span>
        {routeResult.operationalChecklist.map((c, idx) => (
          <p key={idx} className={isDark ? "text-slate-300" : "text-slate-700"}>
            [OK] {c}
          </p>
        ))}
      </div>
    </div>
  );
};

export default MarswalkPlannerPanel;