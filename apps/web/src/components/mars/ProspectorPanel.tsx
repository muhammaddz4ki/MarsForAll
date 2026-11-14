"use client";

import React, { useMemo } from "react";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";
import {
  evaluateProspectorTarget,
  ProspectorEvaluationResult,
} from "@/lib/martian/prospectorScorer";

interface ProspectorPanelProps {
  waypoint: MountSharpWaypoint | null;
  onOpenPovModal: (wp: MountSharpWaypoint) => void;
  onPlanRouteToWaypoint: (wp: MountSharpWaypoint) => void;
  dustStormActive?: boolean;
  theme?: "dark" | "light";
}

export const ProspectorPanel: React.FC<ProspectorPanelProps> = ({
  waypoint,
  onOpenPovModal,
  onPlanRouteToWaypoint,
  dustStormActive = false,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  if (!waypoint) {
    return (
      <div className={`p-4 text-center font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
        <p className="mb-2">Select any waypoint or sector on Mount Sharp to execute the Prospector ML Multi-Layer Fusion assessment.</p>
        <span className={`inline-block px-2 py-0.5 border text-[11px] font-bold ${
          isDark
            ? "bg-[#111827] border-slate-700 text-amber-400"
            : "bg-slate-100 border-slate-300 text-amber-700"
        }`}>
          [STATUS: AWAITING TARGET LOCK]
        </span>
      </div>
    );
  }

  const evaluation: ProspectorEvaluationResult = useMemo(() => {
    return evaluateProspectorTarget({
      coordinates: waypoint.coordinates,
      elevationM: waypoint.elevationM,
      slopeDeg: waypoint.meanSlopeDeg,
      apparentThermalInertiaTiu: waypoint.apparentThermalInertiaTiu,
      consistencyIndexCT: waypoint.consistencyIndexCT,
      mineralProfile: waypoint.mineralogy,
      surfaceRadiationMSvSol: waypoint.surfaceRadiationMSvSol,
      swimOverride: waypoint.swimIndicators,
    });
  }, [waypoint]);

  // ChemCam oxides fallback if not explicitly declared on custom pin
  const oxides = waypoint.chemCamOxides || {
    sio2: 42.0,
    feot: 20.0,
    mgo: 8.5,
    cao: 8.0,
    al2o3: 7.5,
    so3: 14.0,
  };

  const swim = evaluation.swimModel;

  return (
    <div className={`flex flex-col h-full overflow-y-auto text-xs font-sans p-3 space-y-3 ${
      isDark ? "text-slate-200" : "text-slate-800"
    }`}>
      {/* Target Header */}
      <div className={`border-b pb-2.5 ${isDark ? "border-slate-800" : "border-slate-300"}`}>
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[10px] tracking-widest uppercase ${
            isDark ? "text-cyan-400" : "text-cyan-700 font-bold"
          }`}>
            PROSPECTOR // ML DATA FUSION
          </span>
          <span
            className={`px-1.5 py-0.5 font-mono text-[9px] font-bold border ${
              evaluation.operationalRecommendation === "PRIORITY_SAMPLING_SITE"
                ? "bg-[#064e3b] text-[#34d399] border-[#059669]"
                : evaluation.operationalRecommendation === "HAZARD_BYPASS_REQUIRED"
                ? "bg-[#7f1d1d] text-[#fca5a5] border-[#dc2626]"
                : "bg-[#78350f] text-[#fde68a] border-[#d97706]"
            }`}
          >
            [{evaluation.operationalRecommendation.replace(/_/g, " ")}]
          </span>
        </div>
        <h3 className={`text-xs font-bold mt-1 uppercase font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
          {waypoint.name}
        </h3>
        <p className={`text-[10px] mt-0.5 font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {waypoint.geologicUnit}
        </p>
      </div>

      {/* Primary Dual Metrics: Promise Score vs Uncertainty */}
      <div className="grid grid-cols-2 gap-2">
        {/* Promise Score */}
        <div className={`p-2.5 border flex flex-col items-center justify-center text-center ${
          isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
        }`}>
          <span className={`text-[9px] font-mono uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            RESOURCE PROMISE
          </span>
          <div className="text-2xl font-bold font-mono text-amber-500 tabular-nums my-0.5">
            {evaluation.promiseScore}%
          </div>
          <span className={`text-[9px] font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            INTACT VEINS &amp; VOLATILES
          </span>
        </div>

        {/* Model Uncertainty */}
        <div className={`p-2.5 border flex flex-col items-center justify-center text-center ${
          isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
        }`}>
          <span className={`text-[9px] font-mono uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            UNCERTAINTY INDEX
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-500 tabular-nums my-0.5">
            ±{dustStormActive ? (Number(evaluation.uncertaintyPercent) + 14.7).toFixed(1) : evaluation.uncertaintyPercent}%
          </div>
          <span
            className={`text-[9px] font-mono font-semibold ${
              dustStormActive
                ? "text-amber-500 font-bold"
                : evaluation.confidenceLevel === "HIGH"
                ? "text-emerald-500 font-bold"
                : evaluation.confidenceLevel === "MODERATE"
                ? "text-yellow-500 font-bold"
                : "text-red-500 font-bold"
            }`}
          >
            {dustStormActive ? "[DUST INTERFERENCE]" : `[${evaluation.confidenceLevel} CONFIDENCE]`}
          </span>
        </div>
      </div>

      {/* 1. SWIM 5-TERM SUBSURFACE WATER ICE MAPPING MODEL (Morgan et al. 2020) */}
      <div className={`p-2.5 border space-y-2 ${
        isDark ? "bg-[#0d131f] border-slate-800" : "bg-white border-slate-300"
      }`}>
        <div className="flex items-center justify-between border-b pb-1 text-[9px] font-mono">
          <span className={`font-bold uppercase tracking-wider ${isDark ? "text-cyan-400" : "text-cyan-800"}`}>
            SWIM 5-TERM WATER-ICE INDEX (MORGAN ET AL. 2020)
          </span>
          <span className="text-amber-500 font-bold tabular-nums">
            SWIM: {swim.compositeSwimScore > 0 ? "+" : ""}{swim.compositeSwimScore}
          </span>
        </div>

        {/* 5 Consistency Indicators Grid */}
        <div className="grid grid-cols-5 gap-1 text-center font-mono text-[8px]">
          <div className={`p-1 border ${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <span className="text-slate-500 block font-bold">CN</span>
            <span className="text-cyan-400 font-bold tabular-nums">{swim.cn > 0 ? `+${swim.cn}` : swim.cn}</span>
            <span className="text-[7px] text-slate-500 block">MONS</span>
          </div>
          <div className={`p-1 border ${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <span className="text-slate-500 block font-bold">CT</span>
            <span className="text-amber-400 font-bold tabular-nums">{swim.ct > 0 ? `+${swim.ct}` : swim.ct}</span>
            <span className="text-[7px] text-slate-500 block">THEMIS</span>
          </div>
          <div className={`p-1 border ${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <span className="text-slate-500 block font-bold">CG</span>
            <span className="text-emerald-400 font-bold tabular-nums">{swim.cg > 0 ? `+${swim.cg}` : swim.cg}</span>
            <span className="text-[7px] text-slate-500 block">CTX</span>
          </div>
          <div className={`p-1 border ${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <span className="text-slate-500 block font-bold">CRS</span>
            <span className="text-indigo-400 font-bold tabular-nums">{swim.crs > 0 ? `+${swim.crs}` : swim.crs}</span>
            <span className="text-[7px] text-slate-500 block">SHARAD</span>
          </div>
          <div className={`p-1 border ${isDark ? "bg-[#111827] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <span className="text-slate-500 block font-bold">CRD</span>
            <span className="text-rose-400 font-bold tabular-nums">{swim.crd > 0 ? `+${swim.crd}` : swim.crd}</span>
            <span className="text-[7px] text-slate-500 block">PERMIT</span>
          </div>
        </div>

        {/* Dielectric Permittivity Epsilon Meter */}
        <div className="pt-1">
          <div className="flex justify-between text-[9px] font-mono mb-1">
            <span className={isDark ? "text-slate-400" : "text-slate-600"}>
              SHARAD DIELECTRIC PERMITTIVITY (ε&apos;):
            </span>
            <span className="font-bold text-cyan-400 tabular-nums">
              ε&apos; = {swim.epsilonPrime} [{swim.materialClassification.split("(")[0].trim()}]
            </span>
          </div>
          <div className={`w-full h-1.5 border relative ${isDark ? "bg-[#1e293b] border-slate-700" : "bg-slate-200 border-slate-300"}`}>
            <div
              className="bg-cyan-500 h-1.5 transition-all"
              style={{ width: `${Math.min(100, Math.max(5, ((8.0 - swim.epsilonPrime) / (8.0 - 3.0)) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[7px] font-mono text-slate-500 mt-0.5">
            <span>ICE PURE (ε&apos; ≤ 3.15)</span>
            <span>MIXTURE (ε&apos; ~ 5.0)</span>
            <span>BASALT (ε&apos; ≥ 7.0)</span>
          </div>
        </div>
      </div>

      {/* 2. CHEMCAM MAJOR OXIDE COMPOSITION BAR (NASA AMMOS MMGIS Paper 2541, Fig. 2) */}
      <div className={`p-2.5 border space-y-2 ${
        isDark ? "bg-[#0d131f] border-slate-800" : "bg-white border-slate-300"
      }`}>
        <div className="flex items-center justify-between border-b pb-1 text-[9px] font-mono">
          <span className={`font-bold uppercase tracking-wider ${isDark ? "text-amber-400" : "text-amber-800"}`}>
            CHEMCAM ROCK CHEMISTRY (JPL MMGIS FIG. 2)
          </span>
          <span className="text-slate-500 font-mono">LIBS SPECTROMETRY</span>
        </div>

        {/* Stacked Horizontal Composition Bar */}
        <div className="w-full h-4 border border-slate-700 flex overflow-hidden">
          <div style={{ width: `${oxides.sio2}%` }} className="bg-slate-500 h-full" title={`SiO2: ${oxides.sio2}%`} />
          <div style={{ width: `${oxides.feot}%` }} className="bg-red-600 h-full" title={`FeOT: ${oxides.feot}%`} />
          <div style={{ width: `${oxides.so3}%` }} className="bg-amber-500 h-full" title={`SO3: ${oxides.so3}%`} />
          <div style={{ width: `${oxides.mgo}%` }} className="bg-emerald-600 h-full" title={`MgO: ${oxides.mgo}%`} />
          <div style={{ width: `${oxides.cao}%` }} className="bg-cyan-500 h-full" title={`CaO: ${oxides.cao}%`} />
          <div style={{ width: `${oxides.al2o3}%` }} className="bg-indigo-500 h-full" title={`Al2O3: ${oxides.al2o3}%`} />
        </div>

        {/* Legend Grid with Tabular Nums */}
        <div className="grid grid-cols-3 gap-1.5 text-[8px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-slate-500 inline-block" />
            <span className="text-slate-400">SiO₂:</span>
            <span className="font-bold text-white tabular-nums">{oxides.sio2}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-600 inline-block" />
            <span className="text-slate-400">FeOT:</span>
            <span className="font-bold text-white tabular-nums">{oxides.feot}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-amber-500 inline-block" />
            <span className="text-slate-400">SO₃:</span>
            <span className="font-bold text-white tabular-nums">{oxides.so3}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-600 inline-block" />
            <span className="text-slate-400">MgO:</span>
            <span className="font-bold text-white tabular-nums">{oxides.mgo}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-cyan-500 inline-block" />
            <span className="text-slate-400">CaO:</span>
            <span className="font-bold text-white tabular-nums">{oxides.cao}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-indigo-500 inline-block" />
            <span className="text-slate-400">Al₂O₃:</span>
            <span className="font-bold text-white tabular-nums">{oxides.al2o3}%</span>
          </div>
        </div>
      </div>

      {/* Sub-Scores (Flat Rectangular Meters, Tabular Nums) */}
      <div className={`space-y-2 p-2.5 border ${
        isDark ? "bg-[#0d131f] border-slate-800" : "bg-white border-slate-300"
      }`}>
        <span className={`font-mono text-[9px] uppercase tracking-wider block mb-1 ${
          isDark ? "text-slate-400" : "text-slate-600"
        }`}>
          SUBSURFACE INVERSION ATTRIBUTES
        </span>

        <div>
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>HYDRATION POTENTIAL:</span>
            <span className="text-cyan-500 font-bold tabular-nums">
              {evaluation.subScores.hydrationResourcePotential} / 100
            </span>
          </div>
          <div className={`w-full h-1 border ${isDark ? "bg-[#1e293b] border-slate-700" : "bg-slate-200 border-slate-300"}`}>
            <div
              className="bg-cyan-500 h-1 transition-all"
              style={{ width: `${evaluation.subScores.hydrationResourcePotential}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>FRACTURE VEIN TRAPPING:</span>
            <span className="text-amber-500 font-bold tabular-nums">
              {evaluation.subScores.geologicFractureTrapping} / 100
            </span>
          </div>
          <div className={`w-full h-1 border ${isDark ? "bg-[#1e293b] border-slate-700" : "bg-slate-200 border-slate-300"}`}>
            <div
              className="bg-amber-500 h-1 transition-all"
              style={{ width: `${evaluation.subScores.geologicFractureTrapping}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className={isDark ? "text-slate-300" : "text-slate-700"}>EVA ACCESSIBILITY:</span>
            <span className="text-emerald-500 font-bold tabular-nums">
              {evaluation.subScores.evaTerrainAccessibility} / 100
            </span>
          </div>
          <div className={`w-full h-1 border ${isDark ? "bg-[#1e293b] border-slate-700" : "bg-slate-200 border-slate-300"}`}>
            <div
              className="bg-emerald-500 h-1 transition-all"
              style={{ width: `${evaluation.subScores.evaTerrainAccessibility}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rover In-Situ Ground Truth Correlation */}
      <div className={`p-2.5 border ${
        isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
      }`}>
        <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
          <span className="text-amber-500 font-bold uppercase">
            MSL GROUND TRUTH ANCHOR
          </span>
          <span className={`tabular-nums ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            OFFSET: {evaluation.nearestRoverGroundTruth.distanceKm} km
          </span>
        </div>
        <p className={`text-[11px] font-mono font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}>
          {evaluation.nearestRoverGroundTruth.instrument}: {evaluation.nearestRoverGroundTruth.targetName}
        </p>
        <p className={`text-[10px] mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          &quot;{evaluation.nearestRoverGroundTruth.keyFinding}&quot;
        </p>
      </div>

      {/* Action CTA Buttons */}
      <div className="pt-1 flex flex-col gap-1.5">
        <button
          onClick={() => onOpenPovModal(waypoint)}
          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-[11px] font-bold border border-amber-400 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>INSPECT SURFACE POV (ROVER CAMERA)</span>
        </button>

        <button
          onClick={() => onPlanRouteToWaypoint(waypoint)}
          className={`w-full py-1.5 px-3 border font-mono text-[11px] font-semibold transition-colors flex items-center justify-center gap-2 ${
            isDark
              ? "bg-[#161e2e] hover:bg-[#1f2937] border-slate-700 text-cyan-300"
              : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-cyan-800"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          <span>PLAN MARSWALK ROUTE TO TARGET</span>
        </button>
      </div>
    </div>
  );
};

export default ProspectorPanel;
