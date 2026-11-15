"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import MarsForAllBadge from "../MarsForAllBadge";
import AresMapViewer from "./AresMapViewer";
import MmgisProfileDrawer from "./MmgisProfileDrawer";
import ProspectorPanel from "./ProspectorPanel";
import AnalogueMatcherPanel from "./AnalogueMatcherPanel";
import ScientificLayersPanel from "./ScientificLayersPanel";
import VisorHudOverlay from "./VisorHudOverlay";
import {
  MOUNT_SHARP_WAYPOINTS,
  MountSharpWaypoint,
  MissionSiteId,
  getWaypointsForSite,
} from "@/lib/martian/mountSharpWaypoints";
import { MarswalkRouteResult } from "@/lib/martian/marswalkRouter";
import {
  OrbitalImagerySource,
  WmtsStreamStatus,
} from "@/lib/martian/scientificParams";
import {
  ElevationProfileResult,
  ZoiFeature,
  exportGisGeoJson,
} from "@/lib/martian/mmgisSpatialAnalysis";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

export type SupportedLocale = "en" | "id" | "es" | "fr" | "zh";

// Lazy-loaded heavy modules with zero-SSR to optimize initial bundle size & load speed
const SurfacePovModal = dynamic(() => import("./SurfacePovModal"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-[#06090e]/95 flex items-center justify-center font-mono text-xs select-none">
      <div className="px-5 py-3 border border-amber-500/80 bg-[#0b0f17] text-amber-400 flex items-center gap-3">
        <span className="w-2.5 h-2.5 bg-amber-400 animate-pulse" />
        <span className="tracking-wider uppercase font-bold">[ INITIALIZING 3D SURFACE MODULE... ]</span>
      </div>
    </div>
  ),
});

const MarswalkPlannerPanel = dynamic(() => import("./MarswalkPlannerPanel"), {
  ssr: false,
  loading: () => (
    <div className="p-4 text-center font-mono text-xs text-slate-400 select-none">
      <div className="p-3 border border-slate-800 bg-[#0b0f17] flex items-center justify-center gap-2">
        <span className="w-2 h-2 bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 font-bold uppercase tracking-wider">[ LOADING MARSWALK ENGINE... ]</span>
      </div>
    </div>
  ),
});

const AresInfoModal = dynamic(() => import("./AresInfoModal"), {
  ssr: false,
  loading: () => null,
});

const MarsGlobeViewer = dynamic(() => import("./MarsGlobeViewer"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-[#06090e]/95 flex items-center justify-center font-mono text-xs select-none">
      <div className="px-5 py-3 border border-purple-500/80 bg-[#0b0f17] text-purple-400 flex items-center gap-3">
        <span className="w-2.5 h-2.5 bg-purple-400 animate-pulse" />
        <span className="tracking-wider uppercase font-bold">[ INITIALIZING 3D PLANET GLOBE ENGINE... ]</span>
      </div>
    </div>
  ),
});

export type ViewMode = "mission_control" | "visor_hud" | "planet_globe";
export type ActiveDrawerTool = "layers" | "marswalk" | "prospector" | "analogue" | null;

export const AresMartianApp: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const tNav = useTranslations("nav");
  const tDocks = useTranslations("docks");
  const tScrubber = useTranslations("scrubber");

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currentSite, setCurrentSite] = useState<MissionSiteId>("gale_crater");
  const [viewMode, setViewMode] = useState<ViewMode>("mission_control");
  const [selectedWaypoint, setSelectedWaypoint] = useState<MountSharpWaypoint>(
    MOUNT_SHARP_WAYPOINTS[1] // Default: Curiosity Boxwork 2025 Site
  );
  const [customPin, setCustomPin] = useState<MountSharpWaypoint | null>(null);

  // MMGIS Left Tool Rail Active Drawer State (null = full-canvas map/globe)
  const [activeTool, setActiveTool] = useState<ActiveDrawerTool>("layers");

  // Sol & Atmospheric Simulation State
  const [currentSol, setCurrentSol] = useState<number>(4180);
  const [dustStormActive, setDustStormActive] = useState<boolean>(false);
  const [tileMode, setTileMode] = useState<"live_trek" | "offline_procedural">("live_trek");
  const [orbitalSource, setOrbitalSource] = useState<OrbitalImagerySource>("jpl_hirise");
  const [wmtsStatus, setWmtsStatus] = useState<WmtsStreamStatus>("streaming");

  // Camera & Map Controls
  const [pitch3D, setPitch3D] = useState<boolean>(true);
  const [resetNorthTrigger, setResetNorthTrigger] = useState<number>(0);

  // 5 Operational Scientific Layers State (NASA Mars Trek Catalog)
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    layer_optical_geologic: true,
    layer_topographic_hazard: true,
    layer_thermal_subsurface: false,
    layer_science_mineral: false,
    layer_safety_magnetic: false,
  });

  // Layer Opacities State (0% - 100%)
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({
    layer_optical_geologic: 0.8,
    layer_topographic_hazard: 0.8,
    layer_thermal_subsurface: 0.8,
    layer_science_mineral: 0.8,
    layer_safety_magnetic: 0.8,
  });

  const handleChangeLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayerOpacities((prev) => ({ ...prev, [layerId]: opacity }));
  }, []);

  // MMGIS Spatial Analysis States
  const [activeMmgisTool, setActiveMmgisTool] = useState<"none" | "measure" | "viewshed" | "zoi">("none");
  const [swipeCurtainActive, setSwipeCurtainActive] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [elevationProfile, setElevationProfile] = useState<ElevationProfileResult | null>(null);
  const [zoiList, setZoiList] = useState<ZoiFeature[]>([]);

  const handleAddZoi = useCallback((newZoi: ZoiFeature) => {
    setZoiList((prev) => [...prev, newZoi]);
    setExportNotification(`ZONE ADDED: ${newZoi.name}`);
    setTimeout(() => setExportNotification(null), 2500);
  }, []);

  const [activeRoute, setActiveRoute] = useState<MarswalkRouteResult | null>(null);
  const [isPovOpen, setIsPovOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Theme Sync on Mount & Toggle
  useEffect(() => {
    const savedTheme = localStorage.getItem("ares_theme") as "dark" | "light" | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      applyThemeToDom(savedTheme);
    } else {
      applyThemeToDom("dark");
    }
  }, []);

  const applyThemeToDom = (newTheme: "dark" | "light") => {
    const root = document.documentElement;
    root.dataset.theme = newTheme;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ares_theme", next);
    applyThemeToDom(next);
  };

  const handleChangeLanguage = (newLocale: SupportedLocale) => {
    if (newLocale !== currentLocale) {
      router.replace(pathname, { locale: newLocale });
    }
  };

  // Switch active NASA mission site (Site 01 Gale vs Site 02 Jezero)
  const handleSwitchSite = useCallback((site: MissionSiteId) => {
    setCurrentSite(site);
    const siteWaypoints = getWaypointsForSite(site);
    setSelectedWaypoint(siteWaypoints[1] || siteWaypoints[0]);
  }, []);

  // Pool of waypoints including any user-dropped custom pin
  const allWaypoints = useMemo(() => {
    const siteBase = getWaypointsForSite(currentSite);
    return customPin
      ? [...siteBase, customPin]
      : siteBase;
  }, [currentSite, customPin]);

  const handleExportGeoJson = useCallback(() => {
    const geojsonStr = exportGisGeoJson({
      site: currentSite,
      waypoints: allWaypoints,
      route: activeRoute,
      zoiFeatures: zoiList,
      measurePath: measurePoints.length > 1 ? measurePoints : undefined,
    });
    const blob = new Blob([geojsonStr], { type: "application/geo+json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `marsforall-gis-${currentSite}-sol${currentSol}.geojson`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportNotification("GEOJSON EXPORT GENERATED");
    setTimeout(() => setExportNotification(null), 3000);
  }, [currentSite, allWaypoints, activeRoute, zoiList, measurePoints, currentSol]);

  const handleToggleLayer = useCallback((layerId: string) => {
    setActiveLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  }, []);

  const handleSelectWaypoint = useCallback((wp: MountSharpWaypoint) => {
    setSelectedWaypoint(wp);
  }, []);

  const handleOpenPovModal = useCallback((wp: MountSharpWaypoint) => {
    setSelectedWaypoint(wp);
    setIsPovOpen(true);
  }, []);

  const handleAnalyzeProspector = useCallback((wp: MountSharpWaypoint) => {
    setSelectedWaypoint(wp);
    setActiveTool("prospector");
  }, []);

  const handleToggleTool = useCallback((tool: "layers" | "marswalk" | "prospector" | "analogue") => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  }, []);

  const handlePlanRouteToWaypoint = useCallback((wp: MountSharpWaypoint) => {
    setSelectedWaypoint(wp);
    setActiveTool("marswalk");
  }, []);

  // Click-anywhere custom coordinate pin
  const handleMapClickCoordinate = useCallback((coords: [number, number], elevation: number) => {
    const customWp: MountSharpWaypoint = {
      id: "custom_target_pin",
      name: `Custom Tactical Pin (Lat ${coords[1]}°, Lon ${coords[0]}°)`,
      category: "mineral_vein",
      coordinates: coords,
      elevationM: elevation,
      geologicUnit: "Flank Interpolation Unit (Gale / Aeolis Mons)",
      stratigraphicAge: "Hesperian",
      apparentThermalInertiaTiu: 395,
      consistencyIndexCT: 0,
      meanSlopeDeg: 9.4,
      maxSlopeDeg: 16.2,
      roughnessHapkeThetaDeg: 22.0,
      craterDensityBeta: 0.26,
      surfaceRadiationMSvSol: 0.69,
      windExposureRisk: "moderate",
      crustalMagneticFieldNt: 46,
      themisNightTempK: 186,
      sandTrapRisk: "LOW",
      surfaceFirmness: "BEDROCK FIRM",
      waterEquivalentHydrogenPercent: 4.8,
      dominantHydratedMineral: "Mixed Sulfate / Clay Interpolated Flank Deposit",
      mineralogy: {
        sulfatePercent: 34,
        hematitePercent: 18,
        phyllosilicateClayPercent: 22,
        silicaPercent: 41,
        perchloratePercent: 0.5,
      },
      evaSuitTraversable: true,
      muleRoverTraversable: true,
      scientificPriority: 3,
      briefDescription: "User-designated tactical excursion target on Mount Sharp flank. Evaluated dynamically via Prospector ML inversion.",
    };
    setCustomPin(customWp);
    setSelectedWaypoint(customWp);
  }, []);

  // 1-Click Export EVA Mission Manifest
  const handleExportEvaManifest = () => {
    const manifest = {
      mission: "MARSFORALL",
      challenge: "NASA Space Apps Challenge 2026",
      theme: "Interplanetary Survival Guide: Martian Map",
      generatedAtSol: currentSol,
      generatedTimestampUtc: new Date().toISOString(),
      environmentalConditions: {
        sol: currentSol,
        atmosphericCondition: dustStormActive ? "DUST STORM (HIGH SCATTERING)" : "CLEAR SKY (NOMINAL)",
        dustOpacityTau: dustStormActive ? 2.4 : 0.3,
        remsWindSpeedMps: dustStormActive ? 24.8 : 6.4,
        solarFluxWm2: dustStormActive ? 112 : 590,
        surfaceRadiationMSvSol: selectedWaypoint.surfaceRadiationMSvSol,
      },
      activeTarget: {
        id: selectedWaypoint.id,
        name: selectedWaypoint.name,
        coordinates: selectedWaypoint.coordinates,
        elevationM: selectedWaypoint.elevationM,
        geologicUnit: selectedWaypoint.geologicUnit,
        apparentThermalInertiaTiu: selectedWaypoint.apparentThermalInertiaTiu,
        consistencyIndexCT: selectedWaypoint.consistencyIndexCT,
        crustalMagneticFieldNt: selectedWaypoint.crustalMagneticFieldNt,
        themisNightTempK: selectedWaypoint.themisNightTempK,
        sandTrapRisk: selectedWaypoint.sandTrapRisk,
        surfaceFirmness: selectedWaypoint.surfaceFirmness,
        waterEquivalentHydrogenPercent: selectedWaypoint.waterEquivalentHydrogenPercent,
        dominantHydratedMineral: selectedWaypoint.dominantHydratedMineral,
        swimIndicators: selectedWaypoint.swimIndicators,
        chemCamOxides: selectedWaypoint.chemCamOxides,
        mineralogy: selectedWaypoint.mineralogy,
      },
      marswalkPlan: activeRoute
        ? {
            origin: activeRoute.startWaypoint.name,
            destination: activeRoute.targetWaypoint.name,
            supportMode: activeRoute.supportMode,
            distanceKm: activeRoute.totalDistanceKm,
            estimatedDurationHours: activeRoute.estimatedDurationHours,
            o2ConsumedLiters: activeRoute.totalO2ConsumedLiters,
            remainingO2Percent: activeRoute.remainingO2Percent,
            batteryConsumedWh: activeRoute.totalBatteryWh,
            remainingBatteryPercent: activeRoute.remainingBatteryPercent,
            averageCrustalMagNt: activeRoute.averageCrustalMagNt,
            magneticShieldingReductionPercent: activeRoute.magneticShieldingReductionPercent,
            sandTrapWarningCount: activeRoute.sandTrapWarningCount,
            safetyScore: activeRoute.overallSafetyIndex,
            hazardAlerts: activeRoute.hazardAlerts,
            photometry: activeRoute.photometry,
          }
        : "Direct Surface Excursion Mode (No Calculated Corridor)",
      topEarthAnalogueTestbed: {
        siteName: "Haughton Impact Crater, Devon Island (Canada)",
        matchScore: "76%",
        fieldProtocol: "Astronaut EVA mobility suits over polygon permafrost & shatter cone terrain.",
        gibsInspectionUrl: "https://worldview.earthdata.nasa.gov/?v=-90.5,75.0,-89.0,75.6&l=MODIS_Terra_CorrectedReflectance_TrueColor",
      },
      scientificAttributions: [
        "Morgan et al. (2020) 5-Term Subsurface Water Ice Mapping (SWIM)",
        "NASA AMMOS MMGIS Architecture (Paper 2541)",
        "NASA JPL Mars Trek (Gale Crater DEM & Basemap Orthomosaics)",
        "USGS Planetary Geologic Mapping Program (Mount Sharp Structural Units)",
        "NASA PDS MSL Curiosity Science Team (ChemCam LIBS, APXS, RAD, REMS, Mastcam)",
        "NASA MGS Magnetometer / Electron Reflectometer (Crustal Field Anomalies)",
        "NASA 2001 Mars Odyssey THEMIS & GRS / MONS",
      ],
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marsforall-eva-manifest-sol${currentSol}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setExportNotification(`[EVA MANIFEST EXPORTED: marsforall-eva-manifest-sol${currentSol}.json]`);
    setTimeout(() => setExportNotification(null), 4000);
  };

  const isDark = theme === "dark";

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${
      isDark ? "bg-[#07090e] text-slate-100" : "bg-[#f8fafc] text-slate-900"
    } flex flex-col font-sans select-none`}>
      {/* 1. TOP NAVIGATION BAR (h-11, px-3, MMGIS Compact Single-Row Layout) */}
      <header className={`h-11 ${
        isDark ? "bg-[#0b0f17] border-slate-800" : "bg-white border-slate-300 shadow-sm"
      } border-b px-3 flex items-center justify-between z-20 shrink-0 overflow-x-auto gap-2`}>
        {/* SLOT KIRI: Badge + Segmented Mission Site Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <MarsForAllBadge size={26} showSubtext={false} />
          <div className={`flex items-center ${
            isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-100 border-slate-300"
          } border p-0.5 font-mono text-[10px]`}>
            <button
              onClick={() => handleSwitchSite("gale_crater")}
              className={`px-2 py-0.5 font-bold transition-colors ${
                currentSite === "gale_crater"
                  ? "bg-amber-600 text-slate-950"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tNav("siteGale")}
            </button>
            <button
              onClick={() => handleSwitchSite("jezero_crater")}
              className={`px-2 py-0.5 font-bold transition-colors ${
                currentSite === "jezero_crater"
                  ? "bg-amber-600 text-slate-950"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tNav("siteJezero")}
            </button>
          </div>
        </div>

        {/* SLOT TENGAH: Symmetrical Segmented Mode Control [ 2D MAP | 3D GLOBE | VISOR HUD ] */}
        <div className="flex-1 flex justify-center">
          <div className={`flex items-center ${
            isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-100 border-slate-300"
          } border p-0.5 font-mono text-[11px] shrink-0`}>
            <button
              onClick={() => setViewMode("mission_control")}
              className={`flex items-center gap-1 px-2.5 py-0.5 transition-colors ${
                viewMode === "mission_control"
                  ? "bg-amber-600 text-slate-950 font-bold"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{tNav("missionControl")}</span>
            </button>

            <button
              onClick={() => setViewMode("planet_globe")}
              className={`flex items-center gap-1 px-2.5 py-0.5 transition-colors ${
                viewMode === "planet_globe"
                  ? "bg-purple-700 text-slate-100 font-bold"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>{tNav("planetGlobe")}</span>
            </button>

            <button
              onClick={() => setViewMode("visor_hud")}
              className={`flex items-center gap-1 px-2.5 py-0.5 transition-colors ${
                viewMode === "visor_hud"
                  ? "bg-cyan-600 text-slate-950 font-bold"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12h20M4 12v5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-5M6 12V7a6 6 0 0 1 12 0v5" />
              </svg>
              <span>{tNav("helmetVisor")}</span>
            </button>
          </div>
        </div>

        {/* SLOT KANAN: Compact Non-Truncated Utility Controls + i18n & Theme */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Multi-Language Selector [ EN | ID | ES | FR | ZH ] */}
          <div className={`flex items-center ${
            isDark ? "bg-[#111827] border-slate-700" : "bg-slate-100 border-slate-300"
          } border p-0.5 font-mono text-[9px]`}>
            {(["en", "id", "es", "fr", "zh"] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => handleChangeLanguage(loc)}
                className={`px-1 py-0.5 uppercase font-bold transition-colors ${
                  currentLocale === loc
                    ? "bg-amber-600 text-slate-950"
                    : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            title="Toggle Dark / Light Theme"
            className={`px-1.5 py-0.5 ${
              isDark ? "bg-[#161e2e] hover:bg-[#1f2937] border-slate-700 text-slate-200" : "bg-white hover:bg-slate-100 border-slate-300 text-slate-800"
            } border font-mono text-[10px] font-bold transition-colors whitespace-nowrap`}
          >
            {theme === "dark" ? `[${tNav("themeDark")}]` : `[${tNav("themeLight")}]`}
          </button>

          <button
            onClick={() => setPitch3D(!pitch3D)}
            title="Toggle 2.5D / 3D Terrain Pitch"
            className={`flex items-center gap-1 px-1.5 py-0.5 ${
              isDark ? "bg-[#161e2e] hover:bg-[#1f2937] border-slate-700 text-amber-400" : "bg-white hover:bg-slate-100 border-slate-300 text-amber-600"
            } border font-mono text-[10px] font-bold transition-colors whitespace-nowrap`}
          >
            <span>{pitch3D ? tNav("pitch3D") : tNav("pitch2D")}</span>
          </button>

          <button
            onClick={() => setResetNorthTrigger((n) => n + 1)}
            title="Reset North Heading"
            className={`flex items-center gap-1 px-1.5 py-0.5 ${
              isDark ? "bg-[#161e2e] hover:bg-[#1f2937] border-slate-700 text-slate-200" : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
            } border font-mono text-[10px] font-bold transition-colors whitespace-nowrap`}
          >
            <span>{tNav("resetNorth")}</span>
          </button>

          <button
            onClick={handleExportEvaManifest}
            title="Export EVA Mission Manifest (JSON)"
            className="flex items-center gap-1 px-2 py-0.5 bg-[#064e3b] hover:bg-[#065f46] border border-[#10b981] text-[#34d399] font-mono text-[10px] font-bold transition-colors whitespace-nowrap"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{tNav("exportEva")}</span>
          </button>

          <button
            onClick={() => setIsInfoOpen(true)}
            title="Scientific Attribution & Mission Brief"
            className={`flex items-center justify-center px-2 py-0.5 ${
              isDark ? "bg-[#161e2e] hover:bg-[#1f2937] border-slate-700 text-slate-300" : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
            } border font-mono text-[10px] font-bold transition-colors whitespace-nowrap`}
          >
            {tNav("info")}
          </button>
        </div>
      </header>

      {/* Export Confirmation Toast */}
      {exportNotification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#064e3b] border border-[#10b981] px-4 py-1.5 text-xs font-mono text-[#a7f3d0] font-bold">
          {exportNotification}
        </div>
      )}

      {/* 2. MAIN WORKSPACE AREA WITH MMGIS VERTICAL LEFT RAIL */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* MMGIS VERTICAL LEFT TOOL RAIL (w-11 = 44px) */}
        <nav className={`w-11 h-full ${
          isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-100 border-slate-300"
        } border-r flex flex-col items-center py-2 z-30 shrink-0 select-none font-mono`}>
          {/* Tool 1: Scientific Layers */}
          <button
            onClick={() => handleToggleTool("layers")}
            title="Scientific Layers & WMTS Catalog"
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              activeTool === "layers" && viewMode === "mission_control"
                ? "bg-amber-600 text-slate-950 font-bold border-amber-400"
                : isDark
                ? "text-slate-400 hover:text-slate-200 hover:bg-[#161e2e] border-transparent"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </button>

          {/* Tool 2: Marswalk Route Planner */}
          <button
            onClick={() => handleToggleTool("marswalk")}
            title="Marswalk EVA Route Planner (Dijkstra A*)"
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              activeTool === "marswalk" && viewMode === "mission_control"
                ? "bg-emerald-600 text-slate-950 font-bold border-emerald-400"
                : isDark
                ? "text-slate-400 hover:text-slate-200 hover:bg-[#161e2e] border-transparent"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="19" r="3" />
              <path d="M9 19h8.5a4.5 4.5 0 0 0 0-9H7a4 4 0 0 1 0-8h11" />
            </svg>
          </button>

          {/* Tool 3: Prospector ML 35-Parameter Fusion */}
          <button
            onClick={() => handleToggleTool("prospector")}
            title="Prospector ML Fusion (35 Martian Parameters)"
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              activeTool === "prospector" && viewMode === "mission_control"
                ? "bg-amber-600 text-slate-950 font-bold border-amber-400"
                : isDark
                ? "text-slate-400 hover:text-slate-200 hover:bg-[#161e2e] border-transparent"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          {/* Tool 4: Earth Analogue Matcher */}
          <button
            onClick={() => handleToggleTool("analogue")}
            title="Earth Analogue Matcher (Terrestrial Testbeds)"
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              activeTool === "analogue" && viewMode === "mission_control"
                ? "bg-cyan-600 text-slate-950 font-bold border-cyan-400"
                : isDark
                ? "text-slate-400 hover:text-slate-200 hover:bg-[#161e2e] border-transparent"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </button>

          <div className="w-6 h-[1px] bg-slate-800 my-2" />

          {/* Action 5: 360° Real Rover Panorama */}
          <button
            onClick={() => handleOpenPovModal(selectedWaypoint)}
            title="Open 360° Real Rover Panorama (Mastcam-Z / MSL)"
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              isDark
                ? "text-amber-400 hover:text-amber-300 hover:bg-[#161e2e] border-slate-800"
                : "text-amber-700 hover:text-amber-900 hover:bg-slate-200 border-slate-300"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </button>
        </nav>

        {/* MMGIS SINGLE CLEAN DRAWER PANEL (w-[350px], left-11) */}
        {viewMode === "mission_control" && activeTool !== null && (
          <aside className={`absolute left-11 top-0 bottom-14 w-[350px] z-20 pointer-events-auto ${
            isDark ? "bg-[#0b0f17] border-slate-800" : "bg-white border-slate-300"
          } border-r flex flex-col shadow-2xl`}>
            {/* Drawer Header with Title and Close Button */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${
              isDark ? "border-slate-800 bg-[#07090e]" : "border-slate-200 bg-slate-50"
            } shrink-0 font-mono text-xs`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400" />
                <span className="font-bold uppercase tracking-wider text-slate-200">
                  {activeTool === "layers" && tDocks("layers")}
                  {activeTool === "marswalk" && tDocks("marswalk")}
                  {activeTool === "prospector" && tDocks("prospector")}
                  {activeTool === "analogue" && tDocks("earthAnalogues")}
                </span>
              </div>
              <button
                onClick={() => setActiveTool(null)}
                title={tNav("collapse")}
                className={`px-1.5 py-0.5 border text-slate-400 hover:text-white ${
                  isDark ? "border-slate-800 hover:bg-[#161e2e]" : "border-slate-300 hover:bg-slate-200"
                } font-mono text-[10px] font-bold`}
              >
                [ X ]
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              {activeTool === "layers" && (
                <ScientificLayersPanel
                  activeLayers={activeLayers}
                  onToggleLayer={handleToggleLayer}
                  theme={theme}
                  orbitalSource={orbitalSource}
                  onSelectOrbitalSource={setOrbitalSource}
                  wmtsStatus={wmtsStatus}
                  layerOpacities={layerOpacities}
                  onChangeLayerOpacity={handleChangeLayerOpacity}
                />
              )}
              {activeTool === "marswalk" && (
                <MarswalkPlannerPanel
                  selectedWaypoint={selectedWaypoint}
                  onRouteCalculated={setActiveRoute}
                  availableWaypoints={allWaypoints}
                  theme={theme}
                />
              )}
              {activeTool === "prospector" && (
                <ProspectorPanel
                  waypoint={selectedWaypoint}
                  onOpenPovModal={handleOpenPovModal}
                  onPlanRouteToWaypoint={handlePlanRouteToWaypoint}
                  dustStormActive={dustStormActive}
                  theme={theme}
                />
              )}
              {activeTool === "analogue" && (
                <AnalogueMatcherPanel
                  waypoint={selectedWaypoint}
                  theme={theme}
                />
              )}
            </div>
          </aside>
        )}
        {/* Full-width Map Viewport */}
        <AresMapViewer
          currentSite={currentSite}
          activeLayers={activeLayers}
          layerOpacities={layerOpacities}
          selectedWaypoint={selectedWaypoint}
          onSelectWaypoint={handleSelectWaypoint}
          onMapClickCoordinate={handleMapClickCoordinate}
          activeRoute={activeRoute}
          viewMode={viewMode === "planet_globe" ? "mission_control" : viewMode}
          pitch3D={pitch3D}
          resetNorthTrigger={resetNorthTrigger}
          customPinCoords={customPin ? customPin.coordinates : null}
          theme={theme}
          tileMode={tileMode}
          orbitalSource={orbitalSource}
          onWmtsStatusChange={setWmtsStatus}
          activeMmgisTool={activeMmgisTool}
          onSelectMmgisTool={setActiveMmgisTool}
          swipeCurtainActive={swipeCurtainActive}
          onToggleSwipeCurtain={() => setSwipeCurtainActive((prev) => !prev)}
          measurePoints={measurePoints}
          onUpdateMeasurePoints={setMeasurePoints}
          onProfileGenerated={setElevationProfile}
          zoiList={zoiList}
          onAddZoi={handleAddZoi}
          onExportGeoJson={handleExportGeoJson}
          onOpenPlanetGlobe={() => setViewMode("planet_globe")}
          isLeftDrawerOpen={activeTool !== null && viewMode === "mission_control"}
          onOpenPovModal={handleOpenPovModal}
          onAnalyzeProspector={handleAnalyzeProspector}
        />

        {/* 3D PLANET GLOBE ENGINE (MMGIS Architecture) */}
        {viewMode === "planet_globe" && (
          <div className="absolute inset-0 z-30 pointer-events-auto">
            <MarsGlobeViewer
              currentSite={currentSite}
              onSelectSite={(site) => {
                handleSwitchSite(site);
                setViewMode("mission_control");
              }}
              onExitGlobe={() => setViewMode("mission_control")}
              theme={theme}
            />
          </div>
        )}

        {/* MMGIS Interactive Elevation Profile & Line-of-Sight Drawer */}
        {elevationProfile && (
          <MmgisProfileDrawer
            profile={elevationProfile}
            onClear={() => {
              setMeasurePoints([]);
              setElevationProfile(null);
            }}
            onClose={() => setElevationProfile(null)}
            theme={theme}
            siteName={currentSite === "jezero_crater" ? "Jezero Crater" : "Gale Crater"}
          />
        )}

        {/* MODE: ASTRONAUT VISOR HUD (Simetris 4 Sudut, 16px Margin) */}
        {viewMode === "visor_hud" && (
          <VisorHudOverlay
            selectedWaypoint={selectedWaypoint}
            activeRoute={activeRoute}
            onOpenPovModal={handleOpenPovModal}
            dustStormActive={dustStormActive}
            currentSol={currentSol}
            theme={theme}
          />
        )}

        {/* 3. UNIFIED BOTTOM TELEMETRY BAR (Simetris h-9, bottom-4 left-14 right-4, zero overlap with left rail) */}
        <div className="absolute bottom-4 left-14 right-4 z-20 flex justify-between items-center gap-3 pointer-events-none select-none">
          {/* Slot Kiri Bawah (pointer-events-auto, h-9, border 1px solid, font-mono tabular-nums) */}
          <div className={`pointer-events-auto h-9 px-3 flex items-center text-[11px] font-mono tabular-nums whitespace-nowrap border ${
            isDark ? "bg-[#0b0f17] border-slate-800 text-slate-300" : "bg-white border-slate-300 text-slate-700 shadow-sm"
          } gap-2.5 max-w-[55%]`}>
            {viewMode === "mission_control" ? (
              <>
                <span className="text-amber-500 font-bold">MARSFORALL</span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>//</span>
                <span className="text-slate-400">DATUM -4500m TO -3500m</span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                <span className="text-cyan-400 font-medium">PITCH {pitch3D ? "45°" : "0°"}</span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                <span
                  className={`px-1.5 py-0.5 border text-[9px] font-bold tabular-nums uppercase ${
                    selectedWaypoint.sandTrapRisk === "HIGH"
                      ? "bg-[#7f1d1d] text-[#fca5a5] border-[#dc2626]"
                      : selectedWaypoint.sandTrapRisk === "MODERATE"
                      ? "bg-[#78350f] text-[#fde68a] border-[#d97706]"
                      : "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                  }`}
                >
                  [{selectedWaypoint.surfaceFirmness}]
                </span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                <span className="text-purple-400 font-medium">
                  MAG: {selectedWaypoint.crustalMagneticFieldNt} nT
                </span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                <span
                  className={`px-1.5 py-0.5 border text-[9px] font-bold tabular-nums uppercase ${
                    wmtsStatus === "streaming" && orbitalSource !== "local_vector" && tileMode === "live_trek"
                      ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                      : "bg-[#78350f] text-[#fde68a] border-[#d97706]"
                  }`}
                >
                  {wmtsStatus === "streaming" && orbitalSource !== "local_vector" && tileMode === "live_trek"
                    ? "[JPL WMTS STREAMING]"
                    : "[LOCAL VECTOR FALLBACK]"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTileMode("live_trek")}
                    className={`px-1.5 py-0.5 border text-[9px] font-bold uppercase transition-colors ${
                      tileMode === "live_trek"
                        ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                        : isDark
                        ? "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
                        : "bg-slate-100 text-slate-600 border-slate-300"
                    }`}
                  >
                    [JPL TREK]
                  </button>
                  <button
                    onClick={() => setTileMode("offline_procedural")}
                    className={`px-1.5 py-0.5 border text-[9px] font-bold uppercase transition-colors ${
                      tileMode === "offline_procedural"
                        ? "bg-[#78350f] text-[#fde68a] border-[#d97706]"
                        : isDark
                        ? "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
                        : "bg-slate-100 text-slate-600 border-slate-300"
                    }`}
                  >
                    [OFFLINE]
                  </button>
                </div>
              </>
            ) : viewMode === "planet_globe" ? (
              <>
                <span className="text-purple-400 font-bold">MARSFORALL // GLOBE</span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>//</span>
                <span className="text-slate-300">IAU-2000 SPHERICAL DATUM R=3396.19 km</span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                <span className="text-cyan-400 font-medium">GLOBAL PROJECTION</span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                <span className="text-emerald-400 font-medium">5 MMGIS LANDMARKS</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 ${dustStormActive ? "bg-amber-400" : "bg-emerald-400"}`} />
                  <span className={`font-bold ${dustStormActive ? "text-amber-400" : "text-emerald-400"}`}>
                    {dustStormActive ? "[TRAVERSE CAUTION]" : "[SAFE CORRIDOR]"}
                  </span>
                </span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                  {activeRoute?.supportMode === "SOLO_ASTRONAUT" ? "SOLO WALK" : "PAIRED + MULE"}
                </span>
                <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                <span className="text-cyan-400">EVA-01 // MRO LOCKED</span>
              </>
            )}
          </div>

          {/* Slot Kanan Bawah (pointer-events-auto, h-9, border 1px solid, font-mono tabular-nums): Sol Clock & Weather Scrubber */}
          <div className={`pointer-events-auto h-9 px-3 flex items-center text-[11px] font-mono tabular-nums whitespace-nowrap border ${
            isDark ? "bg-[#0b0f17] border-slate-800 text-slate-300" : "bg-white border-slate-300 text-slate-700 shadow-sm"
          } gap-3`}>
            {/* Sol Clock Selector */}
            <div className="flex items-center gap-1">
              <span className={`${isDark ? "text-slate-400" : "text-slate-500"} text-[10px] uppercase font-bold mr-0.5`}>
                {tScrubber("solClock")}:
              </span>
              {[4180, 4181, 4182, 4183, 4184, 4185].map((sol) => (
                <button
                  key={sol}
                  onClick={() => setCurrentSol(sol)}
                  className={`px-1.5 py-0.5 border text-[10px] font-bold transition-colors ${
                    currentSol === sol
                      ? "bg-[#1e293b] text-amber-400 border-amber-400"
                      : isDark
                      ? "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
                      : "bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {sol}
                </button>
              ))}
            </div>

            <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>

            {/* Atmospheric Condition Scrubber */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDustStormActive(false)}
                className={`px-2 py-0.5 border text-[10px] font-bold transition-colors ${
                  !dustStormActive
                    ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                    : isDark
                    ? "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
                    : "bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900"
                }`}
              >
                {tScrubber("clearSky")}
              </button>
              <button
                onClick={() => setDustStormActive(true)}
                className={`px-2 py-0.5 border text-[10px] font-bold transition-colors ${
                  dustStormActive
                    ? "bg-[#7f1d1d] text-[#fca5a5] border-[#ef4444]"
                    : isDark
                    ? "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
                    : "bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900"
                }`}
              >
                {tScrubber("dustStorm")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Surface POV Eye-Level Modal */}
      {isPovOpen && (
        <SurfacePovModal
          waypoint={selectedWaypoint}
          onClose={() => setIsPovOpen(false)}
          theme={theme}
          dustStormActive={dustStormActive}
        />
      )}

      {/* Scientific Attribution & Mission Info Modal */}
      <AresInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        theme={theme}
      />
    </div>
  );
};

export default AresMartianApp;