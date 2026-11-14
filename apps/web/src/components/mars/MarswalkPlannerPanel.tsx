"use client";

import React, { useState, useMemo } from "react";
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
  const isDark = theme === "dark";
  const waypointList = availableWaypoints && availableWaypoints.length > 0
    ? availableWaypoints
    : MOUNT_SHARP_WAYPOINTS;
  const [startId, setStartId] = useState<string>("gale_hab_alpha");
  const [targetId, setTargetId] = useState<string>("curiosity_boxwork_2025");
  const [supportMode, setSupportMode] = useState<MissionSupportMode>("PAIRED_CREW_MULE_ROVER");
  const [avoidRadiation, setAvoidRadiation] = useState<boolean>(true);

  React.useEffect(() => {
    if (selectedWaypoint && selectedWaypoint.id !== startId) {
      setTargetId(selectedWaypoint.id);
    }
  }, [selectedWaypoint, startId]);

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

  const chartData = useMemo(() => {
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

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${
      isDark ? "text-slate-200" : "text-slate-800"
    } text-xs p-3 space-y-3 font-sans`}>
      {/* Header */}
      <div className={`border-b ${isDark ? "border-slate-800" : "border-slate-300"} pb-2`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-500 font-bold">
            MARSWALK A* ROUTE PLANNER
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
            SAFETY: <span className="tabular-nums">{routeResult.overallSafetyIndex}</span> / 100
          </span>
        </div>
        <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-0.5 font-mono`}>
          Terrain-aware least cost trajectory avoiding &gt;25° cliff hazards and ionizing radiation ridges.
        </p>
      </div>

      {/* Origin & Destination Selectors (Flat Solid) */}
      <div className={`grid grid-cols-2 gap-2 ${
        isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"
      } p-2.5 border`}>
        <div>
          <label className={`font-mono text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"} block mb-1 uppercase tracking-wider`}>
            START BASE
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
            SCIENCE TARGET
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
          MISSION SUPPORT CONFIGURATION
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
              <span>SOLO ASTRONAUT</span>
            </div>
            <span className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-1`}>
              25 kg Max Pack • 15° Slope Limit
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
              <span>PAIRED + MULE</span>
            </div>
            <span className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-1`}>
              250 kg Payload • Umbilical Life Support
            </span>
          </button>
        </div>
      </div>

      {/* Trajectory Key Metrics Grid (Flat Solid, Tabular Nums) */}
      <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2 border`}>
          <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>DISTANCE</span>
          <span className="text-xs font-bold text-amber-500 tabular-nums">{routeResult.totalDistanceKm} km</span>
        </div>

        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2 border`}>
          <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>DURATION</span>
          <span className="text-xs font-bold text-cyan-500 tabular-nums">{routeResult.estimatedDurationHours} h</span>
          <span className={`text-[8px] ${isDark ? "text-slate-500" : "text-slate-400"} block tabular-nums`}>({routeResult.solFraction} sol)</span>
        </div>

        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2 border`}>
          <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>O2 RESERVE</span>
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
          <span className={`text-[8px] ${isDark ? "text-slate-400" : "text-slate-500"} block uppercase`}>BATTERY</span>
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
        <span className="text-slate-400 uppercase">RADIO COMMS LINE-OF-SIGHT:</span>
        <span className={`px-1.5 py-0.5 border font-bold text-[9px] ${
          radioLos === "CONNECTED"
            ? "bg-[#064e3b] text-[#34d399] border-[#059669]"
            : "bg-[#7f1d1d] text-[#fca5a5] border-[#dc2626]"
        }`}>
          [{radioLos === "CONNECTED" ? "COMM: LINE-OF-SIGHT CONNECTED" : "COMM: TERRAIN BLOCKED - MRO RELAY"}]
        </span>
      </div>

      {/* Lambertian Photometric Scattering Telemetry (NASA AMMOS & Paper 2132) */}
      {routeResult.photometry && (
        <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2.5 border font-mono`}>
          <div className="flex items-center justify-between border-b pb-1.5 mb-2 border-slate-800 text-[10px]">
            <span className="font-bold text-cyan-400 uppercase">
              LAMBERTIAN PHOTOMETRY &amp; SUN ANGLE (PAPER 2132)
            </span>
            <span className="text-amber-400 font-bold tabular-nums">
              ZENITH {routeResult.photometry.solarIncidenceDeg}°
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] mb-2">
            <div className={`p-1.5 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className="text-slate-400 block uppercase">CONTRAST (C)</span>
              <span className="font-bold text-amber-400 tabular-nums">
                {routeResult.photometry.terrainContrastIndex}
              </span>
            </div>
            <div className={`p-1.5 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className="text-slate-400 block uppercase">GLARE HAZARD</span>
              <span className="font-bold text-cyan-400 tabular-nums">
                {routeResult.photometry.glareObstacleIndex}
              </span>
            </div>
            <div className={`p-1.5 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className="text-slate-400 block uppercase">SHADOW MULTIPLIER</span>
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
            <span>VISIBILITY ADVISORY:</span>
            <span className="font-bold">
              {routeResult.photometry.glareObstacleIndex > 0.4
                ? "[MODERATE FORWARD SCATTERING - USE SUN VISOR]"
                : "[NOMINAL LAMBERTIAN CONTRAST]"}
            </span>
          </div>
        </div>
      )}

      {/* Elevation & Slope Profile Chart (NO GRADIENTS, SOLID FILL) */}
      <div className={`${isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300 shadow-sm"} p-2.5 border font-mono`}>
        <div className="flex items-center justify-between mb-1.5 text-[10px]">
          <span className={`${isDark ? "text-slate-300" : "text-slate-700"} uppercase font-bold`}>
            ELEVATION &amp; SLOPE PROFILE
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
                domain={[-4600, -3800]}
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
                  name === "elevationM" ? "Elevation" : "Slope",
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
              <ReferenceLine y={-4000} stroke="#334155" strokeDasharray="2 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hazard Warning Banners (Flat Solid, Structured Tags) */}
      {routeResult.hazardAlerts.length > 0 && (
        <div className="p-2.5 bg-[#170a08] border border-red-700 text-[10px] space-y-1 font-mono">
          <span className="text-red-400 font-bold block uppercase">
            [HAZARD DETECTED: EXCEEDING NOMINAL SLOPE ENVELOPE]
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
          EVA PROTOCOL CHECKLIST
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