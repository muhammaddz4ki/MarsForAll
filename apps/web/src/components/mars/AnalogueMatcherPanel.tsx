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

  // Recalculate rankings instantaneously as sliders move
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
      <div className="p-5 text-center text-slate-400 font-mono text-xs">
        <p className="mb-2">Select a Mount Sharp target waypoint to match against planetary Earth analogue testbeds.</p>
        <span className="inline-block px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-400">
          Target Required
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto text-slate-200 text-xs p-4 space-y-4">
      {/* Header */}
      <div className="border-b border-slate-800 pb-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400">
            EARTH ANALOGUE TESTBED MATCHER
          </span>
          <span className="font-mono text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
            TARGET: {waypoint.name.split(" ")[0]}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Adjust priority sliders to dynamically match Mount Sharp surface geology against terrestrial mission proving grounds.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] font-mono text-slate-400 self-center mr-1">Presets:</span>
        <button
          onClick={() => applyPreset("balanced")}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] transition-colors"
        >
          Balanced
        </button>
        <button
          onClick={() => applyPreset("mineralogy")}
          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-[10px] transition-colors"
        >
          Mineralogy Focus
        </button>
        <button
          onClick={() => applyPreset("traction")}
          className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] transition-colors"
        >
          Slope / Traction
        </button>
        <button
          onClick={() => applyPreset("ground_ice")}
          className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] transition-colors"
        >
          Subsurface Ice
        </button>
      </div>

      {/* 4 Interactive Priority Sliders */}
      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-3">
        {/* Slider 1: Thermal Inertia / Temp */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Thermal Inertia &amp; Temp:
            </span>
            <span className="font-mono text-cyan-400 font-bold">{weights.thermalInertiaWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weights.thermalInertiaWeight}
            onChange={(e) => handleSliderChange("thermalInertiaWeight", Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Slider 2: Slope / Topography */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Slope &amp; Topography:
            </span>
            <span className="font-mono text-emerald-400 font-bold">{weights.slopeTopographyWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weights.slopeTopographyWeight}
            onChange={(e) => handleSliderChange("slopeTopographyWeight", Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        {/* Slider 3: Regolith / Boxwork Mineralogy */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Regolith &amp; Boxwork Mineralogy:
            </span>
            <span className="font-mono text-amber-400 font-bold">{weights.mineralogyWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weights.mineralogyWeight}
            onChange={(e) => handleSliderChange("mineralogyWeight", Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Slider 4: Aridity / Radiation Proxy */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Aridity &amp; Radiation Proxy:
            </span>
            <span className="font-mono text-rose-400 font-bold">{weights.aridityRadiationWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={weights.aridityRadiationWeight}
            onChange={(e) => handleSliderChange("aridityRadiationWeight", Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
          />
        </div>
      </div>

      {/* Dynamically Re-Ranked Earth Testbed List */}
      <div className="space-y-3">
        <span className="font-mono text-[10px] text-slate-400 uppercase block">
          Ranked Terrestrial Proving Grounds ({rankings.length})
        </span>

        {rankings.map((item) => (
          <div
            key={item.site.id}
            className={`p-3 rounded-lg border transition-all ${
              item.rank === 1
                ? "bg-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/20"
                : "bg-slate-900/60 border-slate-800"
            }`}
          >
            {/* Rank & Score Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-xs ${
                    item.rank === 1
                      ? "bg-amber-400 text-slate-950 font-black"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  #{item.rank}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">{item.site.name}</h4>
                  <span className="text-[10px] text-slate-400">{item.site.region}, {item.site.country}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-base font-black text-amber-400">
                  {item.overallMatchScore}%
                </span>
                <span className="text-[9px] text-slate-400 block -mt-1">SIMILARITY</span>
              </div>
            </div>

            {/* Dimensional Breakdown Chips */}
            <div className="grid grid-cols-4 gap-1.5 mt-2.5 text-center font-mono text-[9px]">
              <div className="bg-slate-950/80 p-1 rounded border border-slate-800/80">
                <span className="text-slate-400 block">THRM</span>
                <span className="text-cyan-300 font-bold">{item.dimensionalScores.thermalScore}%</span>
              </div>
              <div className="bg-slate-950/80 p-1 rounded border border-slate-800/80">
                <span className="text-slate-400 block">SLOPE</span>
                <span className="text-emerald-300 font-bold">{item.dimensionalScores.slopeScore}%</span>
              </div>
              <div className="bg-slate-950/80 p-1 rounded border border-slate-800/80">
                <span className="text-slate-400 block">MINERAL</span>
                <span className="text-amber-300 font-bold">{item.dimensionalScores.mineralogyScore}%</span>
              </div>
              <div className="bg-slate-950/80 p-1 rounded border border-slate-800/80">
                <span className="text-slate-400 block">RAD</span>
                <span className="text-rose-300 font-bold">{item.dimensionalScores.radiationScore}%</span>
              </div>
            </div>

            {/* Scientific Correlations */}
            <p className="text-[10px] text-slate-300 mt-2 bg-slate-950/40 p-2 rounded border border-slate-800/40">
              💡 {item.keyCorrelations[0]}
            </p>

            {/* Protocol */}
            <div className="mt-2 text-[9px] text-slate-400 flex items-center justify-between">
              <span>NASA Analog: {item.site.fieldCampaignReference.split("&")[0]}</span>
              <span className="text-cyan-400 font-mono">GIBS: {item.site.nasaWorldviewLayer.sensor}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalogueMatcherPanel;
