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
}

export const ProspectorPanel: React.FC<ProspectorPanelProps> = ({
  waypoint,
  onOpenPovModal,
  onPlanRouteToWaypoint,
}) => {
  if (!waypoint) {
    return (
      <div className="p-5 text-center text-slate-400 font-mono text-xs">
        <p className="mb-2">Click any waypoint or sector on Mount Sharp to execute the Prospector ML Multi-Layer Fusion assessment.</p>
        <span className="inline-block px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-400">
          Awaiting Target Lock
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
    <div className="flex flex-col h-full overflow-y-auto text-slate-200 text-xs font-sans p-4 space-y-4">
      {/* Target Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400">
            PROSPECTOR // ML DATA FUSION
          </span>
          <span
            className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
              evaluation.operationalRecommendation === "PRIORITY_SAMPLING_SITE"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : evaluation.operationalRecommendation === "HAZARD_BYPASS_REQUIRED"
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
            }`}
          >
            {evaluation.operationalRecommendation.replace(/_/g, " ")}
          </span>
        </div>
        <h3 className="text-sm font-bold text-white mt-1">{waypoint.name}</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">{waypoint.geologicUnit}</p>
      </div>

      {/* Primary Dual Metrics: Promise Score vs Uncertainty */}
      <div className="grid grid-cols-2 gap-3">
        {/* Promise Score */}
        <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Resource Promise</span>
          <div className="text-3xl font-black font-mono text-amber-400 my-1">
            {evaluation.promiseScore}%
          </div>
          <span className="text-[9px] text-slate-400">Intact Veins &amp; Hydration</span>
        </div>

        {/* Model Uncertainty */}
        <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Uncertainty Index</span>
          <div className="text-3xl font-black font-mono text-cyan-400 my-1">
            ±{evaluation.uncertaintyPercent}%
          </div>
          <span
            className={`text-[9px] font-semibold ${
              evaluation.confidenceLevel === "HIGH"
                ? "text-emerald-400"
                : evaluation.confidenceLevel === "MODERATE"
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {evaluation.confidenceLevel} CONFIDENCE
          </span>
        </div>
      </div>

      {/* Sub-Scores Progress Bars */}
      <div className="space-y-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
        <span className="font-mono text-[10px] uppercase text-slate-400 block mb-1">
          Multi-Layer Subsurface Inversion
        </span>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">Hydration Potential:</span>
            <span className="font-mono text-cyan-300 font-bold">
              {evaluation.subScores.hydrationResourcePotential}/100
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${evaluation.subScores.hydrationResourcePotential}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">Fracture Vein Trapping:</span>
            <span className="font-mono text-amber-300 font-bold">
              {evaluation.subScores.geologicFractureTrapping}/100
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${evaluation.subScores.geologicFractureTrapping}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">EVA Terrain Accessibility:</span>
            <span className="font-mono text-emerald-300 font-bold">
              {evaluation.subScores.evaTerrainAccessibility}/100
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${evaluation.subScores.evaTerrainAccessibility}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-slate-300">In-Situ Ground Truth Match:</span>
            <span className="font-mono text-indigo-300 font-bold">
              {evaluation.subScores.inSituCalibrationScore}/100
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${evaluation.subScores.inSituCalibrationScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rover In-Situ Ground Truth Correlation */}
      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] text-amber-400 uppercase">
            Curiosity In-Situ Calibration
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {evaluation.nearestRoverGroundTruth.distanceKm} km offset
          </span>
        </div>
        <p className="text-[11px] text-slate-300 font-semibold">
          {evaluation.nearestRoverGroundTruth.instrument}: {evaluation.nearestRoverGroundTruth.targetName}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 italic">
          "{evaluation.nearestRoverGroundTruth.keyFinding}"
        </p>
      </div>

      {/* Scientific Rationale Notes */}
      <div className="space-y-1.5">
        <span className="font-mono text-[10px] uppercase text-slate-400">Scientific Rationale</span>
        {evaluation.scientificRationale.slice(0, 2).map((item, idx) => (
          <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800/60 text-[10px] text-slate-300">
            • {item}
          </div>
        ))}
      </div>

      {/* Action CTA Buttons */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          onClick={() => onOpenPovModal(waypoint)}
          className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-mono text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>👁️</span> Inspect Surface POV (Eye-Level)
        </button>

        <button
          onClick={() => onPlanRouteToWaypoint(waypoint)}
          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2"
        >
          <span>🧭</span> Plan Marswalk Route to Target
        </button>
      </div>
    </div>
  );
};

export default ProspectorPanel;
