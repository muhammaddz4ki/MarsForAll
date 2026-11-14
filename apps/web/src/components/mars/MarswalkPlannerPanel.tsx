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
import {
  planMarswalkRoute,
  MarswalkRouteResult,
  MissionSupportMode,
} from "@/lib/martian/marswalkRouter";

interface MarswalkPlannerPanelProps {
  onRouteCalculated: (route: MarswalkRouteResult) => void;
  selectedWaypoint: MountSharpWaypoint | null;
}

export const MarswalkPlannerPanel: React.FC<MarswalkPlannerPanelProps> = ({
  onRouteCalculated,
  selectedWaypoint,
}) => {
  const [startId, setStartId] = useState<string>("gale_hab_alpha");
  const [targetId, setTargetId] = useState<string>("curiosity_boxwork_2025");
  const [supportMode, setSupportMode] = useState<MissionSupportMode>("PAIRED_CREW_MULE_ROVER");
  const [avoidRadiation, setAvoidRadiation] = useState<boolean>(true);

  // If user clicked a waypoint on the map, update target
  React.useEffect(() => {
    if (selectedWaypoint && selectedWaypoint.id !== startId) {
      setTargetId(selectedWaypoint.id);
    }
  }, [selectedWaypoint, startId]);

  // Compute Route
  const routeResult: MarswalkRouteResult = useMemo(() => {
    const res = planMarswalkRoute({
      startWaypointId: startId,
      targetWaypointId: targetId,
      supportMode,
      avoidHighRadiationRidges: avoidRadiation,
    });
    onRouteCalculated(res);
    return res;
  }, [startId, targetId, supportMode, avoidRadiation]);

  // Chart data from segments
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
    <div className="flex flex-col h-full overflow-y-auto text-slate-200 text-xs p-4 space-y-4">
      {/* Header */}
      <div className="border-b border-slate-800 pb-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400">
            MARSWALK A* ROUTE PLANNER
          </span>
          <span
            className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
              routeResult.overallSafetyIndex >= 75
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : routeResult.overallSafetyIndex >= 50
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-red-500/20 text-red-300 border border-red-500/40"
            }`}
          >
            SAFETY INDEX: {routeResult.overallSafetyIndex}/100
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Terrain-aware least cost trajectory avoiding &gt;25° cliff hazards and ionizing radiation ridges.
        </p>
      </div>

      {/* Origin & Destination Selectors */}
      <div className="grid grid-cols-2 gap-3 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
        <div>
          <label className="font-mono text-[10px] text-slate-400 block mb-1">START HABITAT / BASE</label>
          <select
            value={startId}
            onChange={(e) => setStartId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {MOUNT_SHARP_WAYPOINTS.map((wp) => (
              <option key={wp.id} value={wp.id}>
                {wp.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-mono text-[10px] text-slate-400 block mb-1">SCIENCE TARGET</label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {MOUNT_SHARP_WAYPOINTS.map((wp) => (
              <option key={wp.id} value={wp.id}>
                {wp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mission Support Mode Toggle */}
      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
        <span className="font-mono text-[10px] text-slate-400 uppercase block mb-2">
          Mission Support Configuration
        </span>
        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <button
            onClick={() => setSupportMode("SOLO_ASTRONAUT")}
            className={`p-2.5 rounded-lg border transition-all text-left flex flex-col justify-between ${
              supportMode === "SOLO_ASTRONAUT"
                ? "bg-amber-500/20 border-amber-400 text-white shadow-md ring-1 ring-amber-400/30"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="font-bold flex items-center gap-1.5">
              <span>🚶</span> Solo Astronaut
            </span>
            <span className="text-[10px] text-slate-400 mt-1">25 kg Max Pack • 15° Slope Limit</span>
          </button>

          <button
            onClick={() => setSupportMode("PAIRED_CREW_MULE_ROVER")}
            className={`p-2.5 rounded-lg border transition-all text-left flex flex-col justify-between ${
              supportMode === "PAIRED_CREW_MULE_ROVER"
                ? "bg-cyan-500/20 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/30"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="font-bold flex items-center gap-1.5">
              <span>🚜</span> Paired + Mule Rover
            </span>
            <span className="text-[10px] text-slate-400 mt-1">250 kg Payload • Umbilical Life Support</span>
          </button>
        </div>
      </div>

      {/* Trajectory Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 text-center font-mono">
        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 block">TOTAL DIST</span>
          <span className="text-sm font-black text-amber-400">{routeResult.totalDistanceKm} km</span>
        </div>

        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 block">EST. DURATION</span>
          <span className="text-sm font-black text-cyan-400">{routeResult.estimatedDurationHours} h</span>
          <span className="text-[8px] text-slate-400 block">({routeResult.solFraction} sol)</span>
        </div>

        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 block">O2 RESERVE</span>
          <span
            className={`text-sm font-black ${
              routeResult.remainingO2Percent > 35 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {routeResult.remainingO2Percent}%
          </span>
          <span className="text-[8px] text-slate-400 block">{routeResult.totalO2ConsumedLiters}L drain</span>
        </div>

        <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 block">BATTERY</span>
          <span
            className={`text-sm font-black ${
              routeResult.remainingBatteryPercent > 30 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {routeResult.remainingBatteryPercent}%
          </span>
          <span className="text-[8px] text-slate-400 block">{routeResult.totalBatteryWh}Wh</span>
        </div>
      </div>

      {/* Elevation & Slope Profile Chart (Recharts) */}
      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-slate-400 uppercase">
            Elevation &amp; Slope Cross-Section Profile
          </span>
          <span className="font-mono text-[9px] text-cyan-400">
            Ascent: +{routeResult.cumulativeAscentM}m / Descent: -{routeResult.cumulativeDescentM}m
          </span>
        </div>

        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stop-color="#f59e0b" stop-opacity={0.4} />
                  <stop offset="95%" stop-color="#f59e0b" stop-opacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="distanceKm" unit="km" tick={{ fill: "#64748b", fontSize: 9 }} />
              <YAxis
                domain={[-4600, -3800]}
                unit="m"
                tick={{ fill: "#64748b", fontSize: 9 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#334155", fontSize: 11 }}
                formatter={(value: any, name: string) => [
                  name === "elevationM" ? `${value} m` : `${value}°`,
                  name === "elevationM" ? "Elevation" : "Slope",
                ]}
              />
              <Area
                type="monotone"
                dataKey="elevationM"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#elevGrad)"
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
              <ReferenceLine y={-4000} stroke="#475569" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hazard Warning Banners */}
      {routeResult.hazardAlerts.length > 0 && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-[10px] space-y-1">
          <span className="font-mono text-red-400 font-bold block uppercase flex items-center gap-1.5">
            <span>⚠️</span> Active Hazard Corridors Detected:
          </span>
          {routeResult.hazardAlerts.map((alert, i) => (
            <p key={i} className="text-red-200">
              • {alert}
            </p>
          ))}
        </div>
      )}

      {/* Operational Checklist */}
      <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
        <span className="font-mono text-[10px] text-slate-400 uppercase block mb-1">
          EVA Protocol Checklist
        </span>
        {routeResult.operationalChecklist.map((c, idx) => (
          <p key={idx} className="text-[10px] text-slate-300">
            ✓ {c}
          </p>
        ))}
      </div>
    </div>
  );
};

export default MarswalkPlannerPanel;
