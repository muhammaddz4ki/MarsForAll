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
}

export const ProspectorPanel: React.FC<ProspectorPanelProps> = ({
  waypoint,
  onOpenPovModal,
  onPlanRouteToWaypoint,
  dustStormActive = false,
}) => {
  if (!waypoint) {
    return (
      <div className="p-4 text-center text-slate-400 font-mono text-xs">
        <p className="mb-2">Select any waypoint or sector on Mount Sharp to execute the Prospector ML Multi-Layer Fusion assessment.</p>
        <span className="inline-block px-2 py-0.5 bg-[#111827] border border-slate-700 text-amber-400 text-[11px]">
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
    });
  }, [waypoint]);

  return (
    <div className="flex flex-col h-full overflow-y-auto text-slate-200 text-xs font-sans p-3 space-y-3">
      {/* Target Header */}
      <div className="border-b border-slate-800 pb-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400">
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
        <h3 className="text-xs font-bold text-white mt-1 uppercase font-mono">{waypoint.name}</h3>
        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{waypoint.geologicUnit}</p>
      </div>

      {/* Primary Dual Metrics: Promise Score vs Uncertainty (Flat Solid Cards) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Promise Score */}
        <div className="bg-[#111827] p-2.5 border border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">RESOURCE PROMISE</span>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums my-0.5">
            {evaluation.promiseScore}%
          </div>
          <span className="text-[9px] text-slate-400 font-mono">INTACT VEINS &amp; VOLATILES</span>
        </div>

        {/* Model Uncertainty */}
        <div className="bg-[#111827] p-2.5 border border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">UNCERTAINTY INDEX</span>
          <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums my-0.5">
            ±{dustStormActive ? (Number(evaluation.uncertaintyPercent) + 14.7).toFixed(1) : evaluation.uncertaintyPercent}%
          </div>
          <span
            className={`text-[9px] font-mono font-semibold ${
              dustStormActive
                ? "text-amber-400"
                : evaluation.confidenceLevel === "HIGH"
                ? "text-emerald-400"
                : evaluation.confidenceLevel === "MODERATE"
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {dustStormActive ? "[DUST INTERFERENCE]" : `[${evaluation.confidenceLevel} CONFIDENCE]`}
          </span>
        </div>
      </div>

      {/* Sub-Scores (Flat Rectangular Meters, Tabular Nums) */}
      <div className="space-y-2 bg-[#0d131f] p-2.5 border border-slate-800">
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block mb-1">
          SUBSURFACE INVERSION COMPONENTS
        </span>

        <div>
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-slate-300">HYDRATION POTENTIAL:</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              {evaluation.subScores.hydrationResourcePotential} / 100
            </span>
          </div>
          <div className="w-full bg-[#1e293b] h-1 border border-slate-700">
            <div
              className="bg-cyan-500 h-1 transition-all"
              style={{ width: `${evaluation.subScores.hydrationResourcePotential}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-slate-300">FRACTURE VEIN TRAPPING:</span>
            <span className="text-amber-400 font-bold tabular-nums">
              {evaluation.subScores.geologicFractureTrapping} / 100
            </span>
          </div>
          <div className="w-full bg-[#1e293b] h-1 border border-slate-700">
            <div
              className="bg-amber-500 h-1 transition-all"
              style={{ width: `${evaluation.subScores.geologicFractureTrapping}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-slate-300">EVA ACCESSIBILITY:</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {evaluation.subScores.evaTerrainAccessibility} / 100
            </span>
          </div>
          <div className="w-full bg-[#1e293b] h-1 border border-slate-700">
            <div
              className="bg-emerald-500 h-1 transition-all"
              style={{ width: `${evaluation.subScores.evaTerrainAccessibility}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-slate-300">GROUND TRUTH CALIBRATION:</span>
            <span className="text-indigo-400 font-bold tabular-nums">
              {evaluation.subScores.inSituCalibrationScore} / 100
            </span>
          </div>
          <div className="w-full bg-[#1e293b] h-1 border border-slate-700">
            <div
              className="bg-indigo-500 h-1 transition-all"
              style={{ width: `${evaluation.subScores.inSituCalibrationScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rover In-Situ Ground Truth Correlation */}
      <div className="p-2.5 bg-[#111827] border border-slate-800">
        <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
          <span className="text-amber-400 font-bold uppercase">
            MSL GROUND TRUTH ANCHOR
          </span>
          <span className="text-slate-400 tabular-nums">
            OFFSET: {evaluation.nearestRoverGroundTruth.distanceKm} km
          </span>
        </div>
        <p className="text-[11px] text-slate-200 font-mono font-semibold">
          {evaluation.nearestRoverGroundTruth.instrument}: {evaluation.nearestRoverGroundTruth.targetName}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
          "{evaluation.nearestRoverGroundTruth.keyFinding}"
        </p>
      </div>

      {/* Scientific Rationale Notes */}
      <div className="space-y-1">
        <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">RATIONALE CITATIONS</span>
        {evaluation.scientificRationale.slice(0, 2).map((item, idx) => (
          <div key={idx} className="p-1.5 bg-[#0b0f17] border border-slate-800 text-[10px] text-slate-300 font-mono">
            [REF {idx + 1}] {item}
          </div>
        ))}
      </div>

      {/* Action CTA Buttons (Flat Solid Buttons, Crisp 1px Border) */}
      <div className="pt-1 flex flex-col gap-1.5">
        <button
          onClick={() => onOpenPovModal(waypoint)}
          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-[11px] font-bold border border-amber-400 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>INSPECT SURFACE POV (EYE-LEVEL)</span>
        </button>

        <button
          onClick={() => onPlanRouteToWaypoint(waypoint)}
          className="w-full py-1.5 px-3 bg-[#161e2e] hover:bg-[#1e293b] border border-slate-700 text-cyan-300 font-mono text-[11px] font-semibold transition-colors flex items-center justify-center gap-2"
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
