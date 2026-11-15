"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  MountSharpWaypoint,
  getFull35Parameters,
  Martian35Parameters,
} from "@/lib/martian/mountSharpWaypoints";
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
  const t = useTranslations("prospector");
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"ml_fusion" | "params_35" | "sharad_radar">("ml_fusion");
  const [sharadProduct, setSharadProduct] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSharad() {
      if (!waypoint) return;
      try {
        const res = await fetch(`/api/mars-ode?type=sharad&lon=${waypoint.coordinates[0]}&lat=${waypoint.coordinates[1]}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.products && json.products.length > 0) {
            setSharadProduct(json.products[0]);
          }
        }
      } catch (err) {
        console.warn("[Prospector] Live ODE SHARAD fetch fallback", err);
      }
    }
    loadSharad();
    return () => {
      isMounted = false;
    };
  }, [waypoint]);

  const evaluation: ProspectorEvaluationResult = useMemo(() => {
    if (!waypoint) {
      return evaluateProspectorTarget({
        coordinates: [137.8414, -5.4453],
        elevationM: -4120,
        slopeDeg: 7.8,
        apparentThermalInertiaTiu: 485,
        consistencyIndexCT: 1,
        mineralProfile: {
          sulfatePercent: 48,
          hematitePercent: 18,
          phyllosilicateClayPercent: 24,
          silicaPercent: 8,
          perchloratePercent: 2,
        },
        surfaceRadiationMSvSol: 0.64,
      });
    }
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

  const p35: Martian35Parameters = useMemo(() => {
    if (!waypoint) return getFull35Parameters({
      id: "fallback_target",
      name: "Mount Sharp Boxwork Outcrop",
      category: "boxwork_formation",
      coordinates: [137.8414, -5.4453],
      elevationM: -4120,
      geologicUnit: "Upper Sulfate Boxwork Lattice",
      stratigraphicAge: "Hesperian",
      apparentThermalInertiaTiu: 485,
      consistencyIndexCT: 1,
      meanSlopeDeg: 7.8,
      maxSlopeDeg: 14.5,
      roughnessHapkeThetaDeg: 16.2,
      craterDensityBeta: 0.08,
      surfaceRadiationMSvSol: 0.64,
      windExposureRisk: "moderate",
      crustalMagneticFieldNt: 72,
      themisNightTempK: 196,
      sandTrapRisk: "LOW",
      surfaceFirmness: "BEDROCK FIRM",
      waterEquivalentHydrogenPercent: 5.4,
      dominantHydratedMineral: "Polyhydrated Ca-Sulfate",
      mineralogy: {
        sulfatePercent: 48,
        hematitePercent: 18,
        phyllosilicateClayPercent: 24,
        silicaPercent: 8,
        perchloratePercent: 2,
      },
      evaSuitTraversable: true,
      muleRoverTraversable: true,
      scientificPriority: 5,
      briefDescription: "Polygonal boxwork vein lattice in Gale Crater.",
    });
    return getFull35Parameters(waypoint);
  }, [waypoint]);

  if (!waypoint) {
    return (
      <div className={`p-4 text-center font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
        <p className="mb-2">{t("awaitingTarget")}</p>
        <span className={`inline-block px-2 py-0.5 border text-[11px] font-bold ${
          isDark
            ? "bg-[#111827] border-slate-700 text-amber-400"
            : "bg-slate-100 border-slate-300 text-amber-700"
        }`}>
          {t("statusAwaitingLock")}
        </span>
      </div>
    );
  }

  const oxides = waypoint.chemCamOxides || {
    sio2: 44.5,
    feot: 18.2,
    mgo: 6.4,
    cao: 8.0,
    al2o3: 8.7,
    so3: 14.2,
  };

  const swim = evaluation.swimModel;

  return (
    <div className={`flex flex-col h-full overflow-y-auto text-xs font-sans p-3 space-y-3 ${
      isDark ? "text-slate-200" : "text-slate-800"
    }`}>
      {/* Target Header */}
      <div className={`border-b pb-2 ${isDark ? "border-slate-800" : "border-slate-300"}`}>
        <div className="flex items-center justify-between">
          <span className={`font-mono text-[10px] tracking-widest uppercase ${
            isDark ? "text-cyan-400" : "text-cyan-700 font-bold"
          }`}>
            {t("title")}
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
            {evaluation.operationalRecommendation === "PRIORITY_SAMPLING_SITE"
              ? `[${t("prioritySampling")}]`
              : evaluation.operationalRecommendation === "HAZARD_BYPASS_REQUIRED"
              ? `[${t("hazardBypass")}]`
              : `[${t("nominalSurvey")}]`}
          </span>
        </div>
        <h3 className={`text-xs font-bold mt-1 uppercase font-mono ${isDark ? "text-white" : "text-slate-900"}`}>
          {waypoint.name}
        </h3>
        <p className={`text-[10px] mt-0.5 font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {waypoint.geologicUnit}
        </p>

        {/* 3-Way Sub-Navigation Tabs */}
        <div className="flex border border-slate-800 bg-[#07090e] p-0.5 mt-2 font-mono text-[10px]">
          <button
            onClick={() => setActiveTab("ml_fusion")}
            className={`flex-1 py-1 text-center font-bold transition-colors ${
              activeTab === "ml_fusion"
                ? "bg-[#161e2e] text-amber-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("tabMlFusion")}
          </button>
          <button
            onClick={() => setActiveTab("params_35")}
            className={`flex-1 py-1 text-center font-bold transition-colors ${
              activeTab === "params_35"
                ? "bg-[#161e2e] text-cyan-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("tabParams35")}
          </button>
          <button
            onClick={() => setActiveTab("sharad_radar")}
            className={`flex-1 py-1 text-center font-bold transition-colors ${
              activeTab === "sharad_radar"
                ? "bg-[#161e2e] text-indigo-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("tabSharad")}
          </button>
        </div>
      </div>

      {/* TAB 1: PROSPECTOR ML FUSION */}
      {activeTab === "ml_fusion" && (
        <div className="space-y-3">
          {/* Primary Dual Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-2.5 border flex flex-col items-center justify-center text-center ${
              isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
            }`}>
              <span className={`text-[9px] font-mono uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {t("resourcePromise")}
              </span>
              <div className="text-2xl font-bold font-mono text-amber-500 tabular-nums my-0.5">
                {evaluation.promiseScore}%
              </div>
              <span className={`text-[9px] font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {t("intactVeins")}
              </span>
            </div>

            <div className={`p-2.5 border flex flex-col items-center justify-center text-center ${
              isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
            }`}>
              <span className={`text-[9px] font-mono uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {t("uncertaintyIndex")}
              </span>
              <div className="text-2xl font-bold font-mono text-cyan-500 tabular-nums my-0.5">
                ±{dustStormActive ? (Number(evaluation.uncertaintyPercent) + 14.7).toFixed(1) : evaluation.uncertaintyPercent}%
              </div>
              <span className={`text-[9px] font-mono font-semibold ${
                dustStormActive
                  ? "text-amber-500 font-bold"
                  : evaluation.confidenceLevel === "HIGH"
                  ? "text-emerald-500 font-bold"
                  : "text-yellow-500 font-bold"
              }`}>
                {dustStormActive
                  ? t("dustInterference")
                  : evaluation.confidenceLevel === "HIGH"
                  ? t("highConfidence")
                  : evaluation.confidenceLevel === "MODERATE"
                  ? t("moderateConfidence")
                  : t("lowConfidence")}
              </span>
            </div>
          </div>

          {/* SWIM 5-Term Model */}
          <div className={`p-2.5 border space-y-2 ${
            isDark ? "bg-[#0d131f] border-slate-800" : "bg-white border-slate-300"
          }`}>
            <div className="flex items-center justify-between border-b pb-1 text-[9px] font-mono">
              <span className={`font-bold uppercase tracking-wider ${isDark ? "text-cyan-400" : "text-cyan-800"}`}>
                {t("swimTitle")}
              </span>
              <span className="text-amber-500 font-bold tabular-nums">
                SWIM: {swim.compositeSwimScore > 0 ? "+" : ""}{swim.compositeSwimScore}
              </span>
            </div>

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

            <div className="pt-1">
              <div className="flex justify-between text-[9px] font-mono mb-1">
                <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                  {t("sharadPermittivity")}
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
            </div>
          </div>

          {/* ChemCam Rock Chemistry */}
          <div className={`p-2.5 border space-y-2 ${
            isDark ? "bg-[#0d131f] border-slate-800" : "bg-white border-slate-300"
          }`}>
            <div className="flex items-center justify-between border-b pb-1 text-[9px] font-mono">
              <span className={`font-bold uppercase tracking-wider ${isDark ? "text-amber-400" : "text-amber-800"}`}>
                {t("chemcamTitle")}
              </span>
              <span className="text-slate-500 font-mono">{t("libsAbundance")}</span>
            </div>

            <div className="w-full h-3 border border-slate-700 flex overflow-hidden">
              <div style={{ width: `${oxides.sio2}%` }} className="bg-slate-500 h-full" title={`SiO2: ${oxides.sio2}%`} />
              <div style={{ width: `${oxides.feot}%` }} className="bg-red-600 h-full" title={`FeOT: ${oxides.feot}%`} />
              <div style={{ width: `${oxides.so3}%` }} className="bg-amber-500 h-full" title={`SO3: ${oxides.so3}%`} />
              <div style={{ width: `${oxides.mgo}%` }} className="bg-emerald-600 h-full" title={`MgO: ${oxides.mgo}%`} />
              <div style={{ width: `${oxides.cao}%` }} className="bg-cyan-500 h-full" title={`CaO: ${oxides.cao}%`} />
              <div style={{ width: `${oxides.al2o3}%` }} className="bg-indigo-500 h-full" title={`Al2O3: ${oxides.al2o3}%`} />
            </div>

            <div className="grid grid-cols-3 gap-1 text-[8px] font-mono">
              <div><span className="text-slate-400">SiO₂:</span> <span className="text-white font-bold tabular-nums">{oxides.sio2}%</span></div>
              <div><span className="text-slate-400">FeOT:</span> <span className="text-white font-bold tabular-nums">{oxides.feot}%</span></div>
              <div><span className="text-slate-400">SO₃:</span> <span className="text-amber-400 font-bold tabular-nums">{oxides.so3}%</span></div>
              <div><span className="text-slate-400">MgO:</span> <span className="text-white font-bold tabular-nums">{oxides.mgo}%</span></div>
              <div><span className="text-slate-400">CaO:</span> <span className="text-white font-bold tabular-nums">{oxides.cao}%</span></div>
              <div><span className="text-slate-400">Al₂O₃:</span> <span className="text-white font-bold tabular-nums">{oxides.al2o3}%</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 35-PARAMETER FULL MARTIAN TELEMETRY MATRIX */}
      {activeTab === "params_35" && (
        <div className="space-y-2.5 font-mono text-[10px]">
          {/* Domain 1: Topography */}
          <div className="border border-slate-800 bg-[#07090e] p-2 space-y-1">
            <div className="flex justify-between text-cyan-400 font-bold border-b border-slate-800 pb-1 text-[9px]">
              <span>{t("domainTopography")}</span>
              <span className="text-slate-500">MOLA / HIRISE DTM</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] pt-1">
              <div><span className="text-slate-500">{t("elevation")}</span> <span className="text-white font-bold tabular-nums">{p35.elevationM} m</span></div>
              <div><span className="text-slate-500">{t("slope")}</span> <span className="text-white font-bold tabular-nums">{p35.slopeDeg}°</span></div>
              <div><span className="text-slate-500">{t("roughness")}</span> <span className="text-white font-bold tabular-nums">{p35.roughnessM} m</span></div>
              <div><span className="text-slate-500">{t("aspect")}</span> <span className="text-white font-bold tabular-nums">{p35.aspectDeg}° ({p35.aspectCardinal})</span></div>
              <div className="col-span-2 text-slate-400">
                <span className="text-slate-500">{t("solarIllum")}</span> Az {p35.sunIllumination.azimuthDeg}°, Zen {p35.sunIllumination.zenithDeg}°, Shadow {p35.sunIllumination.shadowRatioPct}%
              </div>
            </div>
          </div>

          {/* Domain 2: Thermal & Surface Physics */}
          <div className="border border-slate-800 bg-[#07090e] p-2 space-y-1">
            <div className="flex justify-between text-amber-400 font-bold border-b border-slate-800 pb-1 text-[9px]">
              <span>{t("domainThermal")}</span>
              <span className="text-slate-500">THEMIS / TES</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] pt-1">
              <div><span className="text-slate-500">{t("dayTemp")}</span> <span className="text-amber-400 font-bold tabular-nums">{p35.daySurfaceTempC}°C</span></div>
              <div><span className="text-slate-500">{t("nightTemp")}</span> <span className="text-cyan-400 font-bold tabular-nums">{p35.nightSurfaceTempC}°C</span></div>
              <div><span className="text-slate-500">{t("thermalInertia")}</span> <span className="text-white font-bold tabular-nums">{p35.thermalInertiaTiu} tiu</span></div>
              <div><span className="text-slate-500">{t("dustCover")}</span> <span className="text-white font-bold tabular-nums">{p35.dustCoverIndex}</span></div>
              <div className="col-span-2"><span className="text-slate-500">{t("bolometricAlbedo")}</span> <span className="text-white font-bold tabular-nums">{p35.bolometricAlbedo}</span></div>
            </div>
          </div>

          {/* Domain 3: Weather & Atmosphere */}
          <div className="border border-slate-800 bg-[#07090e] p-2 space-y-1">
            <div className="flex justify-between text-emerald-400 font-bold border-b border-slate-800 pb-1 text-[9px]">
              <span>{t("domainWeather")}</span>
              <span className="text-slate-500">MSL REMS / MEDA</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] pt-1">
              <div><span className="text-slate-500">{t("airTemp")}</span> <span className="text-white font-bold tabular-nums">{p35.ambientAirTempC}°C</span></div>
              <div><span className="text-slate-500">{t("pressure")}</span> <span className="text-white font-bold tabular-nums">{p35.atmosphericPressurePa} Pa</span></div>
              <div><span className="text-slate-500">{t("wind")}</span> <span className="text-white font-bold tabular-nums">{p35.windSpeedMs} m/s @ {p35.windDirectionDeg}°</span></div>
              <div><span className="text-slate-500">{t("dustTau")}</span> <span className={`font-bold tabular-nums ${dustStormActive ? "text-rose-400" : "text-emerald-400"}`}>{dustStormActive ? "2.40" : p35.dustOpacityTau}</span></div>
              <div className="col-span-2"><span className="text-slate-500">{t("humidity")}</span> <span className="text-white font-bold tabular-nums">{p35.relativeHumidityPct}%</span></div>
            </div>
          </div>

          {/* Domain 4: Radiation & Space Hazards */}
          <div className="border border-slate-800 bg-[#07090e] p-2 space-y-1">
            <div className="flex justify-between text-rose-400 font-bold border-b border-slate-800 pb-1 text-[9px]">
              <span>{t("domainRadiation")}</span>
              <span className="text-slate-500">MSL RAD / DONKI / MGS</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] pt-1">
              <div><span className="text-slate-500">{t("gcrDose")}</span> <span className="text-white font-bold tabular-nums">{p35.gcrDoseRateUGyDay} µGy/day</span></div>
              <div><span className="text-slate-500">{t("equivRate")}</span> <span className="text-white font-bold tabular-nums">{p35.doseRateMSvHr} mSv/hr</span></div>
              <div><span className="text-slate-500">{t("speAlert")}</span> <span className="text-emerald-400 font-bold">[{p35.speAlertLevel}]</span></div>
              <div><span className="text-slate-500">{t("uvIndex")}</span> <span className="text-amber-400 font-bold">[{p35.uvIndexLevel}]</span></div>
              <div className="col-span-2"><span className="text-slate-500">{t("crustalShielding")}</span> <span className="text-cyan-400 font-bold tabular-nums">{p35.crustalMagneticFieldNt} nT</span></div>
            </div>
          </div>

          {/* Domain 5: Mineralogy & Water */}
          <div className="border border-slate-800 bg-[#07090e] p-2 space-y-1">
            <div className="flex justify-between text-indigo-400 font-bold border-b border-slate-800 pb-1 text-[9px]">
              <span>{t("domainMineralogy")}</span>
              <span className="text-slate-500">CRISM / GRS</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] pt-1">
              <div><span className="text-slate-500">{t("sulfates")}</span> <span className="text-amber-400 font-bold tabular-nums">{(p35.crismSpectralIndices.sulfatesGypsumJarosite * 100).toFixed(0)}%</span></div>
              <div><span className="text-slate-500">{t("smectiteClay")}</span> <span className="text-cyan-400 font-bold tabular-nums">{(p35.crismSpectralIndices.phyllosilicatesClays * 100).toFixed(0)}%</span></div>
              <div><span className="text-slate-500">{t("hematite")}</span> <span className="text-white font-bold tabular-nums">{p35.crismSpectralIndices.hematiteFerricOxidePct}%</span></div>
              <div><span className="text-slate-500">{t("wehIce")}</span> <span className="text-cyan-300 font-bold tabular-nums">{p35.waterEquivalentHydrogenWtPct} wt%</span></div>
              <div className="col-span-2 text-slate-400">
                <span className="text-slate-500">{t("elemental")}</span> Si {p35.elementalChemistry.siPct}%, Fe {p35.elementalChemistry.fePct}%, Mg {p35.elementalChemistry.mgPct}%, Cl {p35.elementalChemistry.clPct}%
              </div>
            </div>
          </div>

          {/* Domain 6 & 7: Subsurface & Nav */}
          <div className="border border-slate-800 bg-[#07090e] p-2 space-y-1">
            <div className="flex justify-between text-yellow-400 font-bold border-b border-slate-800 pb-1 text-[9px]">
              <span>{t("domainSubsurface")}</span>
              <span className="text-slate-500">SHARAD / USGS / RF</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] pt-1">
              <div><span className="text-slate-500">{t("geologicEpoch")}</span> <span className="text-white font-bold">{p35.geologicEpoch}</span></div>
              <div><span className="text-slate-500">{t("gravity")}</span> <span className="text-white font-bold tabular-nums">{p35.gravityAnomalyMgal} mGal</span></div>
              <div><span className="text-slate-500">{t("missionSol")}</span> <span className="text-white font-bold tabular-nums">Sol {p35.sol}</span></div>
              <div><span className="text-slate-500">{t("habDistance")}</span> <span className="text-white font-bold tabular-nums">{p35.routeMetrics.routeDistanceKm} km</span></div>
              <div className="col-span-2">
                <span className="text-slate-500">{t("radioComms")}</span>{" "}
                <span className={`font-bold ${p35.radioLineOfSight === "CONNECTED" ? "text-emerald-400" : "text-rose-400"}`}>
                  [{p35.radioLineOfSight}]
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHARAD 500M SUB-SURFACE RADARGRAM */}
      {activeTab === "sharad_radar" && (
        <div className="space-y-3 font-mono text-xs">
          <div className="border border-slate-800 bg-[#07090e] p-2.5">
            <div className="flex justify-between text-[10px] text-cyan-400 font-bold border-b border-slate-800 pb-1 mb-2">
              <span>{t("sharadStratigraphy")}</span>
              <span className="text-slate-500">MRO SHARAD SOUNDER</span>
            </div>

            {/* Vertical Stratigraphic Column */}
            <div className="space-y-1.5">
              {p35.sharadSubsurfaceProfile.map((layer, idx) => (
                <div
                  key={idx}
                  className={`p-2 border border-slate-700 ${
                    idx === 0
                      ? "bg-[#1e1b18] border-amber-600/60"
                      : idx === 1
                      ? "bg-[#142328] border-cyan-500/60"
                      : "bg-[#131722] border-slate-600"
                  }`}
                >
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className={idx === 1 ? "text-cyan-300" : "text-amber-400"}>
                      {t("depth")} {layer.depthStartM}m - {layer.depthEndM}m (Δ {layer.depthEndM - layer.depthStartM}m)
                    </span>
                    <span className="text-white tabular-nums">
                      ε&apos; = {layer.dielectricPermittivity} | {layer.densityGPerCm3} g/cm³
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 mt-0.5">
                    {layer.layerName}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {layer.materialComposition}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 p-2 bg-[#111827] border border-slate-800 text-[9px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>{t("soundingFreq")}</span>
                <span className="text-slate-200 font-bold">15 - 25 MHz (Center 20 MHz)</span>
              </div>
              <div className="flex justify-between">
                <span>{t("verticalRes")}</span>
                <span className="text-slate-200 font-bold">~15 m in free-space (ε&apos; scaled)</span>
              </div>
              <div className="flex justify-between">
                <span>{t("radarAttenuation")}</span>
                <span className="text-emerald-400 font-bold">{t("radarAttenuationLow")}</span>
              </div>
            </div>

            {/* Live MRO SHARAD Radargram Preview from Mars ODE REST */}
            {sharadProduct?.browseImageUrl && (
              <div className="mt-3 p-2 bg-[#0b0f17] border border-slate-700 space-y-1">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider">
                    CITRA RADARGRAM SHARAD AKTIF
                  </span>
                  <span className="text-slate-400 text-[8px] font-mono">
                    {sharadProduct.productId}
                  </span>
                </div>
                <div className="relative aspect-[16/7] w-full overflow-hidden border border-slate-800 bg-black">
                  <img
                    src={sharadProduct.browseImageUrl}
                    alt="SHARAD Radargram Penampang Bawah Tanah"
                    className="w-full h-full object-cover filter contrast-125"
                  />
                </div>
                <p className="text-[8px] text-slate-400 leading-tight">
                  {t("sharadDescription")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
          <span>{t("inspect3d")}</span>
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
          <span>{t("planRoute")}</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(ProspectorPanel);
