"use client";

import React, { useState, useMemo } from "react";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";
import {
  matchMartianTargetToEarthAnalogues,
  AnalogueWeightSliders,
  DEFAULT_ANALOGUE_WEIGHTS,
  AnalogueMatchRanking,
} from "@/lib/martian/earthAnalogueMatcher";
import { getGibsTileUrlTemplate, RECOMMENDED_ANALOGUE_GIBS_LAYERS } from "@/lib/services/worldviewAdapter";

interface AnalogueMatcherPanelProps {
  waypoint: MountSharpWaypoint | null;
  theme?: "dark" | "light";
}

export const AnalogueMatcherPanel: React.FC<AnalogueMatcherPanelProps> = ({
  waypoint,
  theme = "dark",
}) => {
  const isDark = theme === "dark";
  const [weights, setWeights] = useState<AnalogueWeightSliders>(DEFAULT_ANALOGUE_WEIGHTS);

  const rankings: AnalogueMatchRanking[] = useMemo(() => {
    if (!waypoint) return [];
    return matchMartianTargetToEarthAnalogues(waypoint, weights);
  }, [waypoint, weights]);

  const handleSliderChange = (field: keyof AnalogueWeightSliders, value: number) => {
    setWeights((prev) => ({ ...prev, [field]: value }));
  };

  const applyPreset = (preset: "balanced" | "mineralogy" | "traction" | "ground_ice") => {
    if (preset === "balanced") {
      setWeights({ thermalInertiaWeight: 25, slopeTopographyWeight: 25, mineralogyWeight: 25, aridityRadiationWeight: 25 });
    } else if (preset === "mineralogy") {
      setWeights({ thermalInertiaWeight: 10, slopeTopographyWeight: 10, mineralogyWeight: 65, aridityRadiationWeight: 15 });
    } else if (preset === "traction") {
      setWeights({ thermalInertiaWeight: 15, slopeTopographyWeight: 60, mineralogyWeight: 15, aridityRadiationWeight: 10 });
    } else if (preset === "ground_ice") {
      setWeights({ thermalInertiaWeight: 50, slopeTopographyWeight: 15, mineralogyWeight: 20, aridityRadiationWeight: 15 });
    }
  };

  if (!waypoint) {
    return (
      <div className={`p-4 text-center font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
        <p className="mb-2">Select a Mount Sharp target waypoint to match against planetary Earth analogue testbeds.</p>
        <span className={`inline-block px-2 py-0.5 border text-[11px] font-bold ${
          isDark ? "bg-[#111827] border-slate-700 text-amber-400" : "bg-slate-100 border-slate-300 text-amber-700"
        }`}>
          [STATUS: TARGET REQUIRED]
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full overflow-y-auto text-xs font-sans p-3 space-y-3 ${
      isDark ? "text-slate-200" : "text-slate-800"
    }`}>
      {/* Target Benchmark Header */}
      <div className={`border-b pb-2 ${isDark ? "border-slate-800" : "border-slate-300"}`}>
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[10px] tracking-widest uppercase ${isDark ? "text-cyan-400" : "text-cyan-800 font-bold"}`}>
            WEIGHTED ANALOGUE ENGINE
          </span>
          <span className={`px-1.5 py-0.5 font-mono text-[9px] font-bold border ${
            isDark ? "bg-[#161e2e] text-cyan-300 border-cyan-800" : "bg-cyan-50 text-cyan-800 border-cyan-300"
          }`}>
            EUCLIDEAN DISTANCE
          </span>
        </div>
        <h3 className={`text-xs font-bold mt-1 uppercase font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
          BENCHMARK: {waypoint.name}
        </h3>
        <p className={`text-[10px] mt-0.5 font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          ATI: {waypoint.apparentThermalInertiaTiu} tiu | Slope: {waypoint.meanSlopeDeg}° | Sulfate: {waypoint.mineralogy.sulfatePercent}%
        </p>
      </div>

      {/* Preset Strategy Buttons */}
      <div className="space-y-1">
        <span className={`font-mono text-[9px] uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          MISSION SCENARIO PRESETS
        </span>
        <div className="grid grid-cols-4 gap-1 font-mono text-[9px]">
          <button
            onClick={() => applyPreset("balanced")}
            className={`py-1 px-1 border transition-colors ${
              isDark ? "bg-[#111827] hover:bg-[#1e293b] text-slate-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
            }`}
          >
            BALANCED
          </button>
          <button
            onClick={() => applyPreset("mineralogy")}
            className={`py-1 px-1 border transition-colors ${
              isDark ? "bg-[#111827] hover:bg-[#1e293b] text-amber-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-amber-800 border-slate-300"
            }`}
          >
            MINERALS
          </button>
          <button
            onClick={() => applyPreset("traction")}
            className={`py-1 px-1 border transition-colors ${
              isDark ? "bg-[#111827] hover:bg-[#1e293b] text-emerald-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-emerald-800 border-slate-300"
            }`}
          >
            TRACTION
          </button>
          <button
            onClick={() => applyPreset("ground_ice")}
            className={`py-1 px-1 border transition-colors ${
              isDark ? "bg-[#111827] hover:bg-[#1e293b] text-cyan-300 border-slate-700" : "bg-slate-100 hover:bg-slate-200 text-cyan-800 border-slate-300"
            }`}
          >
            GROUND ICE
          </button>
        </div>
      </div>

      {/* 4 Multi-Parameter Weight Sliders */}
      <div className={`p-2.5 border space-y-2.5 font-mono text-[10px] ${
        isDark ? "bg-[#0b0f17] border-slate-800" : "bg-white border-slate-300"
      }`}>
        <span className={`text-[9px] uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          MULTI-ATTRIBUTE FEATURE WEIGHTS
        </span>

        {/* Slider 1: Thermal Inertia Weight */}
        <div>
          <div className="flex justify-between mb-1">
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>THERMAL INERTIA (ATI):</span>
            <span className="text-cyan-500 font-bold tabular-nums">{weights.thermalInertiaWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weights.thermalInertiaWeight}
            onChange={(e) => handleSliderChange("thermalInertiaWeight", Number(e.target.value))}
            className="w-full h-1 bg-[#1e293b] appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Slider 2: Slope / Topography Weight */}
        <div>
          <div className="flex justify-between mb-1">
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>SLOPE &amp; MICRO-ROUGHNESS:</span>
            <span className="text-emerald-500 font-bold tabular-nums">{weights.slopeTopographyWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weights.slopeTopographyWeight}
            onChange={(e) => handleSliderChange("slopeTopographyWeight", Number(e.target.value))}
            className="w-full h-1 bg-[#1e293b] appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        {/* Slider 3: Mineralogy Signature Weight */}
        <div>
          <div className="flex justify-between mb-1">
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>MINERAL COMPOSITION:</span>
            <span className="text-amber-500 font-bold tabular-nums">{weights.mineralogyWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weights.mineralogyWeight}
            onChange={(e) => handleSliderChange("mineralogyWeight", Number(e.target.value))}
            className="w-full h-1 bg-[#1e293b] appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Slider 4: Aridity / Radiation Proxy */}
        <div>
          <div className="flex justify-between mb-1">
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>ARIDITY &amp; UV RADIATION:</span>
            <span className="text-rose-500 font-bold tabular-nums">{weights.aridityRadiationWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weights.aridityRadiationWeight}
            onChange={(e) => handleSliderChange("aridityRadiationWeight", Number(e.target.value))}
            className="w-full h-1 bg-[#1e293b] appearance-none cursor-pointer accent-rose-400"
          />
        </div>
      </div>

      {/* Dynamically Re-Ranked Earth Testbed List */}
      <div className="space-y-2">
        <span className={`font-mono text-[9px] uppercase tracking-wider block ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          RANKED TERRESTRIAL PROVING GROUNDS ({rankings.length})
        </span>

        {rankings.map((item) => (
          <div
            key={item.site.id}
            className={`p-2.5 border transition-colors ${
              item.rank === 1
                ? isDark ? "bg-[#161e2e] border-amber-500" : "bg-amber-50 border-amber-400"
                : isDark ? "bg-[#0b0f17] border-slate-800" : "bg-white border-slate-300"
            }`}
          >
            {/* Rank & Score Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 flex items-center justify-center font-mono font-bold text-[10px] border ${
                    item.rank === 1
                      ? "bg-amber-600 text-slate-950 border-amber-400"
                      : isDark ? "bg-[#1e293b] text-slate-300 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {item.rank}
                </span>
                <div>
                  <h4 className={`text-xs font-bold font-mono uppercase ${isDark ? "text-white" : "text-slate-900"}`}>
                    {item.site.name}
                  </h4>
                  <span className={`text-[10px] font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {item.site.region}, {item.site.country}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-bold text-amber-500 tabular-nums">
                  {item.overallMatchScore}%
                </span>
                <span className="text-[8px] font-mono text-slate-500 block -mt-0.5">MATCH</span>
              </div>
            </div>

            {/* Dimensional Breakdown Chips */}
            <div className="grid grid-cols-4 gap-1 mt-2 text-center font-mono text-[8px]">
              <div className={`p-1 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-slate-500 block">THRM</span>
                <span className="text-cyan-500 font-bold tabular-nums">{item.dimensionalScores.thermalScore}%</span>
              </div>
              <div className={`p-1 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-slate-500 block">SLOPE</span>
                <span className="text-emerald-500 font-bold tabular-nums">{item.dimensionalScores.slopeScore}%</span>
              </div>
              <div className={`p-1 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-slate-500 block">MINERAL</span>
                <span className="text-amber-500 font-bold tabular-nums">{item.dimensionalScores.mineralogyScore}%</span>
              </div>
              <div className={`p-1 border ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-slate-500 block">RAD</span>
                <span className="text-rose-500 font-bold tabular-nums">{item.dimensionalScores.radiationScore}%</span>
              </div>
            </div>

            {/* Scientific Correlations */}
            <p className={`text-[10px] mt-2 p-1.5 border font-mono ${
              isDark ? "text-slate-300 bg-[#080c14] border-slate-800/80" : "text-slate-700 bg-slate-50 border-slate-200"
            }`}>
              [CORRELATION] {item.keyCorrelations[0]}
            </p>

            {/* NASA Worldview GIBS Satellite Inspection Link */}
            <div className={`mt-2 pt-1.5 border-t space-y-1 ${
              isDark ? "border-slate-800/80" : "border-slate-200"
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-slate-500 truncate max-w-[150px]">
                  GIBS: {item.site.nasaWorldviewLayer.productTitle}
                </span>
                <a
                  href={`https://worldview.earthdata.nasa.gov/?v=${item.site.coordinates[0] - 1.5},${item.site.coordinates[1] - 1.0},${item.site.coordinates[0] + 1.5},${item.site.coordinates[1] + 1.0}&l=${item.site.nasaWorldviewLayer.layerId}&t=${item.site.nasaWorldviewLayer.recommendedDate}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 bg-[#161e2e] hover:bg-[#1f2937] border border-cyan-700 text-cyan-300 font-mono text-[9px] font-bold flex items-center gap-1 transition-colors"
                >
                  <span>OPEN NASA WORLDVIEW GIBS</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
              <div className="text-[8px] font-mono text-slate-500 truncate select-all">
                WMTS: {getGibsTileUrlTemplate({ layer: item.site.nasaWorldviewLayer.layerId || RECOMMENDED_ANALOGUE_GIBS_LAYERS.MODIS_TRUE_COLOR, date: item.site.nasaWorldviewLayer.recommendedDate })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalogueMatcherPanel;
