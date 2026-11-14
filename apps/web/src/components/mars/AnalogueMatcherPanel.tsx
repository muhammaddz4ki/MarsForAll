"use client";

import React, { useState, useMemo } from "react";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";
import {
  matchMartianTargetToEarthAnalogues,
  AnalogueWeightSliders,
  DEFAULT_ANALOGUE_WEIGHTS,
  AnalogueMatchRanking,
} from "@/lib/martian/earthAnalogueMatcher";

interface AnalogueMatcherPanelProps {
  waypoint: MountSharpWaypoint | null;
}

export const AnalogueMatcherPanel: React.FC<AnalogueMatcherPanelProps> = ({ waypoint }) => {
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
      <div className="p-4 text-center text-slate-400 font-mono text-xs">
        <p className="mb-2">Select a Mount Sharp target waypoint to match against planetary Earth analogue testbeds.</p>
        <span className="inline-block px-2 py-0.5 bg-[#111827] border border-slate-700 text-amber-400 text-[11px]">
          [STATUS: TARGET REQUIRED]
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto text-slate-200 text-xs p-3 space-y-3 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400">
            EARTH ANALOGUE TESTBED MATCHER
          </span>
          <span className="font-mono text-[9px] bg-[#111827] border border-slate-700 text-slate-300 px-1.5 py-0.2">
            TARGET: {waypoint.name.split(" ")[0].toUpperCase()}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
          Real-time multi-criteria decision analysis matching Martian surface units against terrestrial test sites.
        </p>
      </div>

      {/* Preset Buttons (Flat Solid Buttons, Sharp 1px Border) */}
      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
        <span className="text-slate-500 self-center mr-1 uppercase">Presets:</span>
        <button
          onClick={() => applyPreset("balanced")}
          className="px-2 py-0.5 bg-[#111827] hover:bg-[#1f2937] border border-slate-700 text-slate-300 transition-colors"
        >
          BALANCED
        </button>
        <button
          onClick={() => applyPreset("mineralogy")}
          className="px-2 py-0.5 bg-[#111827] hover:bg-[#1f2937] border border-amber-600 text-amber-400 transition-colors"
        >
          MINERALOGY
        </button>
        <button
          onClick={() => applyPreset("traction")}
          className="px-2 py-0.5 bg-[#111827] hover:bg-[#1f2937] border border-emerald-600 text-emerald-400 transition-colors"
        >
          SLOPE TRACTION
        </button>
        <button
          onClick={() => applyPreset("ground_ice")}
          className="px-2 py-0.5 bg-[#111827] hover:bg-[#1f2937] border border-cyan-600 text-cyan-400 transition-colors"
        >
          GROUND ICE
        </button>
      </div>

      {/* 4 Interactive Priority Sliders (Flat Solid) */}
      <div className="bg-[#111827] p-2.5 border border-slate-800 space-y-2.5 font-mono text-[10px]">
        {/* Slider 1: Thermal Inertia / Temp */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-300">THERMAL INERTIA &amp; TEMP:</span>
            <span className="text-cyan-400 font-bold tabular-nums">{weights.thermalInertiaWeight}%</span>
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

        {/* Slider 2: Slope / Topography */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-300">SLOPE &amp; TOPOGRAPHY:</span>
            <span className="text-emerald-400 font-bold tabular-nums">{weights.slopeTopographyWeight}%</span>
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

        {/* Slider 3: Regolith / Boxwork Mineralogy */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-300">REGOLITH &amp; MINERALOGY:</span>
            <span className="text-amber-400 font-bold tabular-nums">{weights.mineralogyWeight}%</span>
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
            <span className="text-slate-300">ARIDITY &amp; UV RADIATION:</span>
            <span className="text-rose-400 font-bold tabular-nums">{weights.aridityRadiationWeight}%</span>
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

      {/* Dynamically Re-Ranked Earth Testbed List (Flat Solid Cards, 1px Border) */}
      <div className="space-y-2">
        <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block">
          RANKED TERRESTRIAL PROVING GROUNDS ({rankings.length})
        </span>

        {rankings.map((item) => (
          <div
            key={item.site.id}
            className={`p-2.5 border transition-colors ${
              item.rank === 1
                ? "bg-[#161e2e] border-amber-500"
                : "bg-[#0b0f17] border-slate-800"
            }`}
          >
            {/* Rank & Score Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 flex items-center justify-center font-mono font-bold text-[10px] border ${
                    item.rank === 1
                      ? "bg-amber-600 text-slate-950 border-amber-400"
                      : "bg-[#1e293b] text-slate-300 border-slate-700"
                  }`}
                >
                  {item.rank}
                </span>
                <div>
                  <h4 className="text-xs font-bold font-mono text-white uppercase">{item.site.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{item.site.region}, {item.site.country}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                  {item.overallMatchScore}%
                </span>
                <span className="text-[8px] font-mono text-slate-400 block -mt-0.5">MATCH</span>
              </div>
            </div>

            {/* Dimensional Breakdown Chips (Flat Solid) */}
            <div className="grid grid-cols-4 gap-1 mt-2 text-center font-mono text-[8px]">
              <div className="bg-[#0b0f17] p-1 border border-slate-800">
                <span className="text-slate-400 block">THRM</span>
                <span className="text-cyan-300 font-bold tabular-nums">{item.dimensionalScores.thermalScore}%</span>
              </div>
              <div className="bg-[#0b0f17] p-1 border border-slate-800">
                <span className="text-slate-400 block">SLOPE</span>
                <span className="text-emerald-300 font-bold tabular-nums">{item.dimensionalScores.slopeScore}%</span>
              </div>
              <div className="bg-[#0b0f17] p-1 border border-slate-800">
                <span className="text-slate-400 block">MINERAL</span>
                <span className="text-amber-300 font-bold tabular-nums">{item.dimensionalScores.mineralogyScore}%</span>
              </div>
              <div className="bg-[#0b0f17] p-1 border border-slate-800">
                <span className="text-slate-400 block">RAD</span>
                <span className="text-rose-300 font-bold tabular-nums">{item.dimensionalScores.radiationScore}%</span>
              </div>
            </div>

            {/* Scientific Correlations */}
            <p className="text-[10px] text-slate-300 mt-2 bg-[#080c14] p-1.5 border border-slate-800/80 font-mono">
              [CORRELATION] {item.keyCorrelations[0]}
            </p>

            {/* Protocol */}
            <div className="mt-1.5 text-[9px] text-slate-400 font-mono flex items-center justify-between">
              <span className="truncate">CAMPAIGN: {item.site.fieldCampaignReference.split("&")[0]}</span>
              <span className="text-cyan-400 shrink-0 ml-2">GIBS: {item.site.nasaWorldviewLayer.sensor}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalogueMatcherPanel;
