"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import MarsForAllBadge from "../MarsForAllBadge";
import AresMapViewer, { IdentifiedFeatureInfo } from "./AresMapViewer";
import { PointInspectorPanel } from "./PointInspectorPanel";
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
  getRoverTraverseForSite,
} from "@/lib/martian/mountSharpWaypoints";
import { get360WaypointsAsMountSharp } from "@/lib/martian/customPanoramas";
import {
  MarswalkRouteResult,
  HighDensityPointTelemetry,
  planMarswalkRoute,
} from "@/lib/martian/marswalkRouter";
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
import type { AerialScoutTarget } from "./MarsAerialScoutDock";

export type SupportedLocale = "en" | "id";

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

const Custom360ManagerModal = dynamic(() => import("./Custom360ManagerModal"), {
  ssr: false,
});

const MarsAerialScoutDock = dynamic(() => import("./MarsAerialScoutDock"), {
  ssr: false,
});

const MarswalkProfileDock = dynamic(() => import("./MarswalkProfileDock"), {
  ssr: false,
});

const MarsNavigationHud = dynamic(() => import("./MarsNavigationHud"), {
  ssr: false,
});

const MmgisToolsPanel = dynamic(() => import("./MmgisToolsPanel"), {
  ssr: false,
});

export type ViewMode = "mission_control" | "visor_hud" | "planet_globe";
export type ActiveDrawerTool = "layers" | "marswalk" | "tools" | "prospector" | "analogue" | "inspector" | null;

export const AresMartianApp: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const tNav = useTranslations("nav");
  const tDocks = useTranslations("docks");
  const tScrubber = useTranslations("scrubber");
  const tCustom360 = useTranslations("custom360");
  const tMmgis = useTranslations("mmgis");
  const tSidebar = useTranslations("sidebar");

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currentSite, setCurrentSite] = useState<MissionSiteId>("gale_crater");
  const [viewMode, setViewMode] = useState<ViewMode>("mission_control");
  const [selectedWaypoint, setSelectedWaypoint] = useState<MountSharpWaypoint>(
    MOUNT_SHARP_WAYPOINTS[1] // Default: Curiosity Boxwork 2025 Site
  );
  const [customPin, setCustomPin] = useState<MountSharpWaypoint | null>(null);

  // MMGIS Left Sidebar Expanded/Collapsed State (default: expanded on desktop)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);

  // MMGIS Left Tool Rail Active Drawer State (null = full-canvas map/globe)
  const [activeTool, setActiveTool] = useState<ActiveDrawerTool>(null);
  const [identifiedFeature, setIdentifiedFeature] = useState<IdentifiedFeatureInfo | null>(null);

  // Sol & Atmospheric Simulation State
  const [currentSol, setCurrentSol] = useState<number>(4180);
  const [dustStormActive, setDustStormActive] = useState<boolean>(false);
  const [showSolWeatherScrubber, setShowSolWeatherScrubber] = useState<boolean>(false);
  const [tileMode, setTileMode] = useState<"live_trek" | "offline_procedural">("live_trek");
  const [orbitalSource, setOrbitalSource] = useState<OrbitalImagerySource>("jpl_hirise");
  const [wmtsStatus, setWmtsStatus] = useState<WmtsStreamStatus>("streaming");
  const [showBottomTelemetry, setShowBottomTelemetry] = useState<boolean>(false);

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
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [elevationProfile, setElevationProfile] = useState<ElevationProfileResult | null>(null);
  const [zoiList, setZoiList] = useState<ZoiFeature[]>([]);
  const [showRoverTraverse, setShowRoverTraverse] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(false);
  const [showFloatingLegend, setShowFloatingLegend] = useState<boolean>(false);
  const [reCenterTrigger, setReCenterTrigger] = useState<number>(0);

  const handleAddZoi = useCallback((newZoi: ZoiFeature) => {
    setZoiList((prev) => [...prev, newZoi]);
    setExportNotification(`ZONE ADDED: ${newZoi.name}`);
    setTimeout(() => setExportNotification(null), 2500);
  }, []);

  const [activeRoute, setActiveRoute] = useState<MarswalkRouteResult | null>(null);
  const [isProfileDockOpen, setIsProfileDockOpen] = useState<boolean>(false);
  const [navFlyToCoord, setNavFlyToCoord] = useState<[number, number] | null>(null);
  const [hoveredRoutePoint, setHoveredRoutePoint] = useState<HighDensityPointTelemetry | null>(null);
  const [isPovOpen, setIsPovOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [is360ManagerOpen, setIs360ManagerOpen] = useState<boolean>(false);
  const [pickedCoordsFor360, setPickedCoordsFor360] = useState<[number, number] | null>(null);
  const [pickedElevFor360, setPickedElevFor360] = useState<number | undefined>(undefined);
  const [isPicking360Coord, setIsPicking360Coord] = useState<boolean>(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Mars Aerial Scout Drone States
  const [isAerialDockOpen, setIsAerialDockOpen] = useState<boolean>(false);
  const [aerialFlightTarget, setAerialFlightTarget] = useState<AerialScoutTarget | null>(null);
  const [isAerialFlying, setIsAerialFlying] = useState<boolean>(false);
  const [aerialFlightTelemetry, setAerialFlightTelemetry] = useState<any>(null);

  // Live Cursor Telemetry & Dynamic Metric Scale Bar (Fed from MapLibre engine)
  const [cursorTelemetry, setCursorTelemetry] = useState<{ lat: number; lon: number; elev: number; slope: number } | null>(null);
  const [scaleBar, setScaleBar] = useState<{ label: string; widthPx: number }>({ label: "10.0 KM", widthPx: 96 });
  const [showQuickStartBanner, setShowQuickStartBanner] = useState<boolean>(true);

  const handleLaunchAerialFlight = useCallback((target: AerialScoutTarget) => {
    setAerialFlightTarget(target);
    setIsAerialFlying(true);
    setExportNotification(`[AERIAL SCOUT LAUNCHED: ${target.label.toUpperCase()}]`);
    setTimeout(() => setExportNotification(null), 3500);
  }, []);

  const handleAerialFlightComplete = useCallback((target: AerialScoutTarget) => {
    setIsAerialFlying(false);
    setExportNotification(`[AERIAL SCOUT ARRIVED: ${target.label.toUpperCase()}]`);
    setTimeout(() => setExportNotification(null), 4000);
  }, []);

  // Theme Sync on Mount & Toggle
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("pov") === "true" || params.get("pov") === "1") {
        setIsPovOpen(true);
      }
      const toolParam = params.get("tool");
      if (toolParam && ["layers", "marswalk", "tools", "inspector", "prospector", "analogue"].includes(toolParam)) {
        setActiveTool(toolParam as any);
      }
      if (params.get("view") === "visor") {
        setViewMode("visor_hud");
      }
      if (params.get("drone") === "true") {
        setIsAerialDockOpen(true);
      }
    }
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
    // Clear any active route and close profile dock so the map remains clean and unobstructed
    setActiveRoute(null);
    setIsProfileDockOpen(false);
  }, []);

  const activeTraverseSols = useMemo(() => {
    return getRoverTraverseForSite(currentSite);
  }, [currentSite]);

  const handleSelectSol = useCallback((sol: number) => {
    setCurrentSol(sol);
    const traverse = getRoverTraverseForSite(currentSite);
    const match = traverse.find((p) => p.sol === sol);
    if (match) {
      setNavFlyToCoord(match.coordinates);
      setExportNotification(`ROVER TIME-TRAVEL: SOL ${sol} - ${match.name.toUpperCase()}`);
      setTimeout(() => setExportNotification(null), 3500);
    }
  }, [currentSite]);

  const custom360List = useMemo(() => {
    return get360WaypointsAsMountSharp(currentSite);
  }, [currentSite, is360ManagerOpen]);

  // Pool of waypoints including any user-dropped custom pin and 360 panorama waypoints
  const allWaypoints = useMemo(() => {
    const siteBase = getWaypointsForSite(currentSite);
    const combined = [...siteBase];
    custom360List.forEach((cwp) => {
      const idx = combined.findIndex(
        (w) =>
          w.id === cwp.id ||
          (Math.abs(w.coordinates[0] - cwp.coordinates[0]) < 0.002 &&
            Math.abs(w.coordinates[1] - cwp.coordinates[1]) < 0.002)
      );
      if (idx >= 0) {
        combined[idx] = {
          ...combined[idx],
          ...cwp,
          has360Pov: true,
          name: combined[idx].name,
        };
      } else {
        combined.push(cwp);
      }
    });
    return customPin ? [...combined, customPin] : combined;
  }, [currentSite, customPin, custom360List]);

  const handleLaunchSampleRoute = useCallback(() => {
    try {
      const boxworkWp = allWaypoints.find((w) => w.id === "curiosity_boxwork_2025") || allWaypoints[1];
      const route = planMarswalkRoute({
        startWaypointId: "gale_hab_alpha",
        targetWaypointId: boxworkWp.id,
        supportMode: "PAIRED_CREW_MULE_ROVER",
        avoidHighRadiationRidges: true,
      });
      setActiveRoute(route);
      setSelectedWaypoint(boxworkWp);
      setIsProfileDockOpen(true);
      setShowQuickStartBanner(false);
      setExportNotification(
        currentLocale === "id"
          ? "RUTE AMAN ASTRONAUT BERHASIL DIHITUNG (88/100)"
          : "ASTRONAUT SAFE ROUTE VERIFIED (88/100)"
      );
      setTimeout(() => setExportNotification(null), 3500);
    } catch (e) {
      console.error("Failed to plan sample route:", e);
    }
  }, [allWaypoints, currentLocale]);

  // Deep-link helper for route & inspect query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("route") === "sample") {
      handleLaunchSampleRoute();
    }
    if (params.get("inspect") === "boxwork") {
      const boxworkWp = allWaypoints.find((w) => w.id === "curiosity_boxwork_2025" || w.id === "stn_07_boxwork_2025") || allWaypoints[1];
      if (boxworkWp) {
        setSelectedWaypoint(boxworkWp);
        setActiveTool("inspector");
        setIdentifiedFeature({
          name: boxworkWp.name,
          category: "BOXWORK MINERAL VEIN",
          stratigraphicAge: "Hesperian (~3.3 Ga)",
          elevationM: boxworkWp.elevationM,
          slopeDeg: boxworkWp.meanSlopeDeg,
          mineralogy: "Polyhydrated Sulfates & Amorphous Silica",
          coordinates: boxworkWp.coordinates,
          surfaceFirmness: "BEDROCK FIRM",
          sandTrapRisk: "LOW",
          crustalMagneticFieldNt: 72,
          surfaceRadiationMSvSol: 0.68,
          associatedWaypoint: boxworkWp,
        });
      }
    }
  }, [allWaypoints, handleLaunchSampleRoute]);

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

  const handleToggleTool = useCallback((tool: Exclude<ActiveDrawerTool, null>) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  }, []);

  const handlePlanRouteToWaypoint = useCallback((wp: MountSharpWaypoint) => {
    setSelectedWaypoint(wp);
    setActiveTool("marswalk");
  }, []);

  // Click-anywhere custom coordinate pin
  const handleMapClickCoordinate = useCallback((coords: [number, number], elevation: number) => {
    if (isPicking360Coord) {
      setPickedCoordsFor360(coords);
      setPickedElevFor360(elevation);
      setIsPicking360Coord(false);
      setIs360ManagerOpen(true);
      setExportNotification(
        tCustom360("coordCaptured", {
          lat: coords[1].toFixed(4),
          lon: coords[0].toFixed(4),
        })
      );
      setTimeout(() => setExportNotification(null), 3000);
      return;
    }

    const pinName =
      currentLocale === "id"
        ? `Titik Sasaran Pilihan (${coords[1]}°, ${coords[0]}°)`
        : `Target Waypoint Pin (${coords[1]}°, ${coords[0]}°)`;
    const pinDesc =
      currentLocale === "id"
        ? "Titik sasaran hasil klik langsung pada peta lereng Mount Sharp untuk analisis rute & tanah."
        : "Target point designated directly on Mount Sharp map flank for route & soil analysis.";

    const customWp: MountSharpWaypoint = {
      id: "custom_target_pin",
      name: pinName,
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
      briefDescription: pinDesc,
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
    <div className={`relative w-screen h-screen overflow-hidden ${isDark ? "bg-[#07090e] text-slate-100" : "bg-[#f8fafc] text-slate-900"
      } flex flex-col font-sans select-none`}>
      {/* 1. TOP NAVIGATION BAR (h-11, px-3, MMGIS Compact Single-Row Layout) */}
      <header className={`h-11 ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-white border-slate-300 shadow-sm"
        } border-b px-3 flex items-center justify-between z-20 shrink-0 overflow-x-auto gap-2`}>
        {/* SLOT KIRI: Badge + Segmented Mission Site Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <MarsForAllBadge size={26} showSubtext={false} />
          <div className={`flex items-center ${isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-100 border-slate-300"
            } border p-0.5 font-mono text-[10px]`}>
            <button
              onClick={() => handleSwitchSite("gale_crater")}
              className={`px-2 py-0.5 font-bold transition-colors ${currentSite === "gale_crater"
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
              className={`px-2 py-0.5 font-bold transition-colors ${currentSite === "jezero_crater"
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
          <div className={`flex items-center ${isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-100 border-slate-300"
            } border p-0.5 font-mono text-[11px] shrink-0`}>
            <button
              onClick={() => setViewMode("mission_control")}
              className={`flex items-center gap-1 px-2.5 py-0.5 transition-colors ${viewMode === "mission_control"
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
              className={`flex items-center gap-1 px-2.5 py-0.5 transition-colors ${viewMode === "planet_globe"
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
              className={`flex items-center gap-1 px-2.5 py-0.5 transition-colors ${viewMode === "visor_hud"
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

            {/* MARS AERIAL SCOUT DRONE / PESAWAT ORBITER */}
            <button
              onClick={() => setIsAerialDockOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2 py-0.5 transition-colors border ${isAerialDockOpen
                ? "bg-cyan-600 text-slate-950 font-bold border-cyan-400"
                : isDark
                  ? "bg-[#111827] text-cyan-400 hover:text-cyan-200 border-slate-700"
                  : "bg-slate-100 text-cyan-700 hover:text-cyan-900 border-slate-300"
                }`}
              title="Mars Aerial Scout Drone: Fly to Coordinates"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <span>AERIAL SCOUT</span>
            </button>

            {/* POINT INSPECTOR TOOLBAR BUTTON */}
            <button
              onClick={() => handleToggleTool("inspector")}
              className={`flex items-center gap-1.5 px-2 py-0.5 transition-colors border ${activeTool === "inspector"
                ? "bg-cyan-600 text-slate-950 font-bold border-cyan-400"
                : isDark
                  ? "bg-[#111827] text-cyan-400 hover:text-cyan-200 border-slate-700"
                  : "bg-slate-100 text-cyan-700 hover:text-cyan-900 border-slate-300"
                }`}
              title={tNav("pointInspector")}
            >
              <svg className="w-3 h-3 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
              <span>{tNav("pointInspectorShort")}</span>
            </button>
          </div>
        </div>

        {/* SLOT KANAN: Compact Non-Truncated Utility Controls + i18n & Theme */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Multi-Language Selector [ EN | ID ] */}
          <div className={`flex items-center ${isDark ? "bg-[#111827] border-slate-700" : "bg-slate-100 border-slate-300"
            } border p-0.5 font-mono text-[9px]`}>
            {(["en", "id"] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => handleChangeLanguage(loc)}
                className={`px-1 py-0.5 uppercase font-bold transition-colors ${currentLocale === loc
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
            className={`px-1.5 py-0.5 ${isDark ? "bg-[#161e2e] hover:bg-[#1f2937] border-slate-700 text-slate-200" : "bg-white hover:bg-slate-100 border-slate-300 text-slate-800"
              } border font-mono text-[10px] font-bold transition-colors whitespace-nowrap`}
          >
            {theme === "dark" ? `[${tNav("themeDark")}]` : `[${tNav("themeLight")}]`}
          </button>

          <button
            onClick={() => setPitch3D(!pitch3D)}
            title="Toggle 2.5D / 3D Terrain Pitch"
            className={`flex items-center gap-1 px-1.5 py-0.5 ${isDark ? "bg-[#161e2e] hover:bg-[#1f2937] border-slate-700 text-amber-400" : "bg-white hover:bg-slate-100 border-slate-300 text-amber-600"
              } border font-mono text-[10px] font-bold transition-colors whitespace-nowrap`}
          >
            <span>{pitch3D ? tNav("pitch3D") : tNav("pitch2D")}</span>
          </button>

          <button
            onClick={() => setResetNorthTrigger((n) => n + 1)}
            title="Reset North Heading"
            className={`flex items-center gap-1 px-1.5 py-0.5 ${isDark ? "bg-[#161e2e] hover:bg-[#1f2937] border-slate-700 text-slate-200" : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
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
            className={`flex items-center justify-center px-2 py-0.5 ${isDark ? "bg-[#161e2e] hover:bg-[#1f2937] border-slate-700 text-slate-300" : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
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

      {/* 2. MAIN WORKSPACE AREA WITH MMGIS EXPANDABLE SIDEBAR */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* MMGIS SIDEBAR (EXPANDED w-72 sm:w-80 or COLLAPSED w-12) */}
        <nav
          className={`${
            isSidebarExpanded ? "w-72 sm:w-80" : "w-12"
          } h-full ${
            isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-100 border-slate-300"
          } border-r flex flex-col z-30 shrink-0 select-none font-mono transition-all duration-200`}
        >
          {/* SIDEBAR HEADER / TOGGLE BAR */}
          <div
            className={`h-9 px-2.5 border-b ${
              isDark ? "border-slate-800 bg-[#0b0f17]" : "border-slate-300 bg-slate-200"
            } flex items-center justify-between shrink-0`}
          >
            {isSidebarExpanded ? (
              <>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 bg-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold tracking-wider text-slate-200 uppercase truncate">
                    {tSidebar("missionControl")}
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarExpanded(false)}
                  className="px-1.5 py-0.5 border text-slate-400 hover:text-white border-slate-700 hover:bg-[#161e2e] text-[9px] font-bold transition-colors"
                  title={tSidebar("collapse")}
                >
                  [ ◄ CIUTKAN ]
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSidebarExpanded(true)}
                className="w-full h-full flex items-center justify-center text-slate-400 hover:text-white text-[11px] font-bold transition-colors"
                title={tSidebar("expand")}
              >
                [ ► ]
              </button>
            )}
          </div>

          {/* SCROLLABLE SIDEBAR MENU ITEMS */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* 1. DOCKED MARSWALK NAVIGATION HUD (WHEN ROUTE IS ACTIVE) */}
            {activeRoute && viewMode === "mission_control" && (
              isSidebarExpanded ? (
                <MarsNavigationHud
                  route={activeRoute}
                  docked={true}
                  onOpenPovModal={handleOpenPovModal}
                  onOpenMarswalkPlanner={() => setActiveTool("marswalk")}
                  onToggleProfileDock={() => setIsProfileDockOpen((prev) => !prev)}
                  isProfileDockOpen={isProfileDockOpen}
                  onSwitchToVisorHud={() => setViewMode("visor_hud")}
                  onReCenterCorridor={() => setReCenterTrigger((c) => c + 1)}
                  onCloseRoute={() => setActiveRoute(null)}
                  onFlyToCoord={(coord) => setNavFlyToCoord(coord)}
                />
              ) : (
                <button
                  onClick={() => setIsSidebarExpanded(true)}
                  className="w-8 h-8 mx-auto my-1 flex items-center justify-center border border-emerald-500 bg-[#064e3b] text-emerald-300 relative"
                  title={`Active Marswalk Route (${activeRoute.totalDistanceKm} km) - Click to expand sidebar`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              )
            )}

            {/* GROUP 1: NAVIGASI & MISI LAPANGAN */}
            <div className="space-y-1">
              {isSidebarExpanded && (
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                  {tSidebar("groupNavigation")}
                </div>
              )}

              {/* Item 1: Rute Marswalk A* */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => handleToggleTool("marswalk")}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    activeTool === "marswalk" && viewMode === "mission_control"
                      ? "bg-emerald-950/60 border-emerald-400 text-white"
                      : isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mt-0.5 p-1 border shrink-0 ${
                    activeTool === "marswalk" && viewMode === "mission_control"
                      ? "bg-emerald-600 text-slate-950 border-emerald-400"
                      : "bg-[#07090e] border-slate-800 text-emerald-400"
                  }`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="6" cy="19" r="3" />
                      <path d="M9 19h8.5a4.5 4.5 0 0 0 0-9H7a4 4 0 0 1 0-8h11" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("marswalkTitle")}
                      </span>
                      <span className={`text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 ${
                        activeRoute
                          ? "bg-[#064e3b] border-emerald-500 text-emerald-300"
                          : "bg-[#111827] border-emerald-800 text-emerald-400"
                      }`}>
                        {activeRoute ? tSidebar("badgeActive") : tSidebar("badgeCoreAi")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("marswalkDesc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleTool("marswalk")}
                  title={`${tSidebar("marswalkTitle")} - ${tSidebar("marswalkDesc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors relative ${
                    activeTool === "marswalk" && viewMode === "mission_control"
                      ? "bg-emerald-600 text-slate-950 font-bold border-emerald-400"
                      : isDark
                      ? "text-emerald-400 hover:text-emerald-300 hover:bg-[#161e2e] border-emerald-800/60"
                      : "text-emerald-700 hover:text-emerald-900 hover:bg-slate-200 border-emerald-300"
                  }`}
                >
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="19" r="3" />
                    <path d="M9 19h8.5a4.5 4.5 0 0 0 0-9H7a4 4 0 0 1 0-8h11" />
                  </svg>
                </button>
              )}

              {/* Item 2: Drone Pengintai Udara */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => {
                    setShowFloatingLegend(false);
                    setIsAerialDockOpen((prev) => !prev);
                  }}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    isAerialDockOpen
                      ? "bg-cyan-950/60 border-cyan-400 text-white"
                      : isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mt-0.5 p-1 border shrink-0 ${
                    isAerialDockOpen
                      ? "bg-cyan-600 text-slate-950 border-cyan-400"
                      : "bg-[#07090e] border-slate-800 text-cyan-400"
                  }`}>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("aerialTitle")}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 bg-[#111827] border-cyan-800 text-cyan-400">
                        {tSidebar("badgeDrone")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("aerialDesc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowFloatingLegend(false);
                    setIsAerialDockOpen((prev) => !prev);
                  }}
                  title={`${tSidebar("aerialTitle")} - ${tSidebar("aerialDesc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors ${
                    isAerialDockOpen
                      ? "bg-cyan-600 text-slate-950 font-bold border-cyan-400"
                      : isDark
                      ? "text-cyan-400 hover:text-cyan-200 hover:bg-[#161e2e] border-slate-800"
                      : "text-cyan-700 hover:text-cyan-900 hover:bg-slate-200 border-slate-300"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                </button>
              )}
            </div>

            {/* GROUP 2: SAINS & GEOFISIKA NASA */}
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              {isSidebarExpanded && (
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                  {tSidebar("groupScience")}
                </div>
              )}

              {/* Item 3: 5 Lapisan Ilmiah NASA */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => handleToggleTool("layers")}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    activeTool === "layers" && viewMode === "mission_control"
                      ? "bg-amber-950/60 border-amber-400 text-white"
                      : isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mt-0.5 p-1 border shrink-0 ${
                    activeTool === "layers" && viewMode === "mission_control"
                      ? "bg-amber-600 text-slate-950 border-amber-400"
                      : "bg-[#07090e] border-slate-800 text-amber-400"
                  }`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("layersTitle")}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 bg-[#111827] border-amber-800 text-amber-400">
                        {tSidebar("badge5Layers")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("layersDesc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleTool("layers")}
                  title={`${tSidebar("layersTitle")} - ${tSidebar("layersDesc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors ${
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
              )}

              {/* Item 4: Point Inspector Regolith */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => handleToggleTool("inspector")}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    activeTool === "inspector" && viewMode === "mission_control"
                      ? "bg-cyan-950/60 border-cyan-400 text-white"
                      : isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mt-0.5 p-1 border shrink-0 ${
                    activeTool === "inspector" && viewMode === "mission_control"
                      ? "bg-cyan-600 text-slate-950 border-cyan-400"
                      : "bg-[#07090e] border-slate-800 text-cyan-400"
                  }`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <line x1="12" y1="3" x2="12" y2="7" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                      <line x1="3" y1="12" x2="7" y2="12" />
                      <line x1="17" y1="12" x2="21" y2="12" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("inspectorTitle")}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 bg-[#111827] border-cyan-800 text-cyan-400">
                        {tSidebar("badgeInspector")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("inspectorDesc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleTool("inspector")}
                  title={`${tSidebar("inspectorTitle")} - ${tSidebar("inspectorDesc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors ${
                    activeTool === "inspector" && viewMode === "mission_control"
                      ? "bg-cyan-600 text-slate-950 font-bold border-cyan-400"
                      : isDark
                      ? "text-cyan-400 hover:text-cyan-200 hover:bg-[#161e2e] border-transparent"
                      : "text-cyan-700 hover:text-cyan-900 hover:bg-slate-200 border-transparent"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="3" x2="12" y2="7" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                    <line x1="3" y1="12" x2="7" y2="12" />
                    <line x1="17" y1="12" x2="21" y2="12" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                </button>
              )}

              {/* Item 5: Alat Analisis Spasial MMGIS */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => handleToggleTool("tools")}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    activeTool === "tools" && viewMode === "mission_control"
                      ? "bg-cyan-950/60 border-cyan-400 text-white"
                      : isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mt-0.5 p-1 border shrink-0 ${
                    activeTool === "tools" && viewMode === "mission_control"
                      ? "bg-cyan-600 text-slate-950 border-cyan-400"
                      : "bg-[#07090e] border-slate-800 text-cyan-400"
                  }`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m14.7 6.3 5 5-9.4 9.4H5.3v-5z" />
                      <path d="m12.4 8.6 2.8 2.8" />
                      <path d="M2 2h4v4H2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("toolsTitle")}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 bg-[#111827] border-cyan-800 text-cyan-400">
                        {tSidebar("badgeMmgis")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("toolsDesc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleTool("tools")}
                  title={`${tSidebar("toolsTitle")} - ${tSidebar("toolsDesc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors ${
                    activeTool === "tools" && viewMode === "mission_control"
                      ? "bg-cyan-600 text-slate-950 font-bold border-cyan-400"
                      : isDark
                      ? "text-slate-400 hover:text-slate-200 hover:bg-[#161e2e] border-transparent"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-transparent"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m14.7 6.3 5 5-9.4 9.4H5.3v-5z" />
                    <path d="m12.4 8.6 2.8 2.8" />
                    <path d="M2 2h4v4H2z" />
                  </svg>
                </button>
              )}
            </div>

            {/* GROUP 3: SUMBER DAYA & VALIDASI BUMI */}
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              {isSidebarExpanded && (
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                  {tSidebar("groupResources")}
                </div>
              )}

              {/* Item 6: Prospektor AI Sumber Daya */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => handleToggleTool("prospector")}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    activeTool === "prospector" && viewMode === "mission_control"
                      ? "bg-amber-950/60 border-amber-400 text-white"
                      : isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mt-0.5 p-1 border shrink-0 ${
                    activeTool === "prospector" && viewMode === "mission_control"
                      ? "bg-amber-600 text-slate-950 border-amber-400"
                      : "bg-[#07090e] border-slate-800 text-amber-400"
                  }`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("prospectorTitle")}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 bg-[#111827] border-amber-800 text-amber-400">
                        {tSidebar("badgeMl")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("prospectorDesc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleTool("prospector")}
                  title={`${tSidebar("prospectorTitle")} - ${tSidebar("prospectorDesc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors ${
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
              )}

              {/* Item 7: Pencocok Analogi Bumi */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => handleToggleTool("analogue")}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    activeTool === "analogue" && viewMode === "mission_control"
                      ? "bg-cyan-950/60 border-cyan-400 text-white"
                      : isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mt-0.5 p-1 border shrink-0 ${
                    activeTool === "analogue" && viewMode === "mission_control"
                      ? "bg-cyan-600 text-slate-950 border-cyan-400"
                      : "bg-[#07090e] border-slate-800 text-cyan-400"
                  }`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("analogueTitle")}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 bg-[#111827] border-cyan-800 text-cyan-400">
                        {tSidebar("badgeMcda")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("analogueDesc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleTool("analogue")}
                  title={`${tSidebar("analogueTitle")} - ${tSidebar("analogueDesc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors ${
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
              )}
            </div>

            {/* GROUP 4: SIMULASI EKSPLORASI */}
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              {isSidebarExpanded && (
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1">
                  {tSidebar("groupSimulation")}
                </div>
              )}

              {/* Item 8: Panorama Permukaan 360° */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => handleOpenPovModal(selectedWaypoint)}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="mt-0.5 p-1 border shrink-0 bg-[#07090e] border-slate-800 text-amber-400">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("pov360Title")}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 bg-[#111827] border-amber-800 text-amber-400">
                        {tSidebar("badgePov")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("pov360Desc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleOpenPovModal(selectedWaypoint)}
                  title={`${tSidebar("pov360Title")} - ${tSidebar("pov360Desc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors ${
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
              )}

              {/* Item 9: Astronaut Visor HUD */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => setViewMode("visor_hud")}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    viewMode === "visor_hud"
                      ? "bg-purple-950/60 border-purple-400 text-white"
                      : isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mt-0.5 p-1 border shrink-0 ${
                    viewMode === "visor_hud"
                      ? "bg-purple-600 text-slate-950 border-purple-400"
                      : "bg-[#07090e] border-slate-800 text-purple-400"
                  }`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12h20M12 2a10 10 0 0 1 10 10v4a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-4a10 10 0 0 1 10-10z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("visorHudTitle")}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 bg-[#111827] border-purple-800 text-purple-400">
                        {tSidebar("badgeVisor")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("visorHudDesc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setViewMode("visor_hud")}
                  title={`${tSidebar("visorHudTitle")} - ${tSidebar("visorHudDesc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors ${
                    viewMode === "visor_hud"
                      ? "bg-purple-600 text-slate-950 font-bold border-purple-400"
                      : isDark
                      ? "text-purple-400 hover:text-purple-300 hover:bg-[#161e2e] border-slate-800"
                      : "text-purple-700 hover:text-purple-900 hover:bg-slate-200 border-slate-300"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12h20M12 2a10 10 0 0 1 10 10v4a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-4a10 10 0 0 1 10-10z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              )}

              {/* Item 10: Bola Planet Mars 3D */}
              {isSidebarExpanded ? (
                <button
                  onClick={() => setViewMode("planet_globe")}
                  className={`w-full text-left p-2 border transition-colors flex items-start gap-2.5 font-mono ${
                    viewMode === "planet_globe"
                      ? "bg-emerald-950/60 border-emerald-400 text-white"
                      : isDark
                      ? "bg-[#0b0f17] border-slate-800 hover:bg-[#111827] hover:border-slate-700 text-slate-300"
                      : "bg-white border-slate-300 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className={`mt-0.5 p-1 border shrink-0 ${
                    viewMode === "planet_globe"
                      ? "bg-emerald-600 text-slate-950 border-emerald-400"
                      : "bg-[#07090e] border-slate-800 text-emerald-400"
                  }`}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <ellipse cx="12" cy="12" rx="10" ry="4" />
                      <line x1="12" y1="2" x2="12" y2="22" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs truncate text-slate-200">
                        {tSidebar("planetGlobeTitle")}
                      </span>
                      <span className="text-[8px] px-1 py-0.2 border uppercase font-bold shrink-0 bg-[#111827] border-emerald-800 text-emerald-400">
                        {tSidebar("badgeGlobe")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {tSidebar("planetGlobeDesc")}
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setViewMode("planet_globe")}
                  title={`${tSidebar("planetGlobeTitle")} - ${tSidebar("planetGlobeDesc")}`}
                  className={`w-8 h-8 mx-auto my-0.5 flex items-center justify-center border transition-colors ${
                    viewMode === "planet_globe"
                      ? "bg-emerald-600 text-slate-950 font-bold border-emerald-400"
                      : isDark
                      ? "text-emerald-400 hover:text-emerald-300 hover:bg-[#161e2e] border-slate-800"
                      : "text-emerald-700 hover:text-emerald-900 hover:bg-slate-200 border-slate-300"
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* MMGIS SINGLE CLEAN DRAWER PANEL (w-[350px], left-72 / left-12) */}
        {viewMode === "mission_control" && activeTool !== null && (
          <aside className={`absolute ${isSidebarExpanded ? "left-72 sm:left-80" : "left-12"} top-0 bottom-0 w-[calc(100vw-48px)] sm:w-[350px] max-w-[calc(100vw-48px)] z-20 pointer-events-auto ${isDark ? "bg-[#0b0f17] border-slate-800" : "bg-white border-slate-300"
            } border-r flex flex-col shadow-2xl transition-all duration-200`}>
            {/* Drawer Header with Title and Close Button */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? "border-slate-800 bg-[#07090e]" : "border-slate-200 bg-slate-50"
              } shrink-0 font-mono text-xs`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400" />
                <span className="font-bold uppercase tracking-wider text-slate-200">
                  {activeTool === "layers" && tDocks("layers")}
                  {activeTool === "marswalk" && tDocks("marswalk")}
                  {activeTool === "tools" && tDocks("spatialTools")}
                  {activeTool === "inspector" && tDocks("inspector")}
                  {activeTool === "prospector" && tDocks("prospector")}
                  {activeTool === "analogue" && tDocks("earthAnalogues")}
                </span>
              </div>
              <button
                onClick={() => setActiveTool(null)}
                title={tNav("collapse")}
                className={`px-1.5 py-0.5 border text-slate-400 hover:text-white ${isDark ? "border-slate-800 hover:bg-[#161e2e]" : "border-slate-300 hover:bg-slate-200"
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
              {activeTool === "tools" && (
                <MmgisToolsPanel
                  currentSite={currentSite}
                  activeMmgisTool={activeMmgisTool}
                  onSelectMmgisTool={setActiveMmgisTool}
                  measurePoints={measurePoints}
                  onClearMeasurePoints={() => {
                    setMeasurePoints([]);
                    setElevationProfile(null);
                  }}
                  zoiList={zoiList}
                  onRemoveZoi={(id) => setZoiList((prev) => prev.filter((z) => z.id !== id))}
                  showRoverTraverse={showRoverTraverse}
                  onToggleRoverTraverse={() => setShowRoverTraverse((prev) => !prev)}
                  showGraticule={showGraticule}
                  onToggleGraticule={() => setShowGraticule((prev) => !prev)}
                  showFloatingLegend={showFloatingLegend}
                  onToggleFloatingLegend={() => setShowFloatingLegend((prev) => !prev)}
                  pitch3D={pitch3D}
                  onTogglePitch={() => setPitch3D((prev) => !prev)}
                  onReCenter={() => setReCenterTrigger((prev) => prev + 1)}
                  onOpen360Manager={() => setIs360ManagerOpen(true)}
                  onOpenPovModal={() => setIsPovOpen(true)}
                  onExportGeoJson={handleExportGeoJson}
                  theme={theme}
                  currentSol={currentSol}
                  onSelectSol={handleSelectSol}
                  dustStormActive={dustStormActive}
                  onToggleDustStorm={(active) => setDustStormActive(active)}
                  showSolWeatherScrubber={showSolWeatherScrubber}
                  onToggleSolWeatherScrubber={() => setShowSolWeatherScrubber((prev) => !prev)}
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
              {activeTool === "inspector" && (
                <PointInspectorPanel
                  feature={identifiedFeature}
                  waypoint={selectedWaypoint}
                  onPlanRouteToWaypoint={handlePlanRouteToWaypoint}
                  onOpenPovModal={handleOpenPovModal}
                  onAnalyzeProspector={handleAnalyzeProspector}
                  onOpenAnalogueMatcher={(wp) => {
                    setSelectedWaypoint(wp);
                    setActiveTool("analogue");
                  }}
                  onToggleProfileDock={() => setIsProfileDockOpen((prev) => !prev)}
                  isProfileDockOpen={isProfileDockOpen}
                  custom360Waypoints={custom360List}
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
          measurePoints={measurePoints}
          onUpdateMeasurePoints={setMeasurePoints}
          onProfileGenerated={setElevationProfile}
          zoiList={zoiList}
          onAddZoi={handleAddZoi}
          onExportGeoJson={handleExportGeoJson}
          onOpenPlanetGlobe={() => setViewMode("planet_globe")}
          isLeftDrawerOpen={activeTool !== null && viewMode === "mission_control"}
          onFeatureIdentified={setIdentifiedFeature}
          isInspectorActive={activeTool === "inspector"}
          onOpenPovModal={handleOpenPovModal}
          onAnalyzeProspector={handleAnalyzeProspector}
          onPlanRouteToWaypoint={handlePlanRouteToWaypoint}
          onOpenAnalogueMatcher={(wp: MountSharpWaypoint) => {
            setSelectedWaypoint(wp);
            setActiveTool("analogue");
          }}
          onToggleProfileDock={() => setIsProfileDockOpen((prev) => !prev)}
          isProfileDockOpen={isProfileDockOpen}
          onOpen360Manager={() => setIs360ManagerOpen(true)}
          custom360Waypoints={custom360List}
          hoveredRoutePoint={hoveredRoutePoint}
          showRoverTraverse={showRoverTraverse}
          showGraticule={showGraticule}
          showFloatingLegend={showFloatingLegend}
          onToggleFloatingLegend={() => setShowFloatingLegend((prev) => !prev)}
          reCenterTrigger={reCenterTrigger}
          flyToCoord={navFlyToCoord}
          dustStormActive={dustStormActive}
          currentSol={currentSol}
          aerialFlightTarget={aerialFlightTarget}
          onAerialFlightComplete={handleAerialFlightComplete}
          onAerialTelemetryUpdate={setAerialFlightTelemetry}
          onCursorTelemetryUpdate={setCursorTelemetry}
          onScaleUpdate={setScaleBar}
        />

        {/* NOVELTY QUICK START BANNER (Panduan Cepat Navigasi Peta) */}
        {!activeRoute && activeTool === null && !isAerialDockOpen && !elevationProfile && showQuickStartBanner && viewMode === "mission_control" && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-[#07090e]/95 border border-emerald-500/80 shadow-2xl flex items-center gap-3 font-mono text-[10px] select-none">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {currentLocale === "id"
                  ? "[ PANDUAN CEPAT ]"
                  : "[ QUICK START ]"}
              </span>
            </div>
            <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
            <button
              onClick={handleLaunchSampleRoute}
              className="px-2 py-0.5 bg-[#064e3b] hover:bg-[#047857] text-[#34d399] border border-[#10b981] font-bold text-[9px] transition-colors"
              title="Hitung contoh rute jalan kaki astronot dari Hab Alpha ke Boxwork 2025"
            >
              [ {currentLocale === "id" ? "1-KLIK CONTOH RUTE" : "1-CLICK SAMPLE ROUTE"} ]
            </button>
            <button
              onClick={() => {
                setShowFloatingLegend(false);
                setIsAerialDockOpen(true);
              }}
              className="px-2 py-0.5 bg-[#083344] hover:bg-[#0e7490] text-[#a5f3fc] border border-[#06b6d4] font-bold text-[9px] transition-colors"
              title="Buka panel simulasi drone pengintai udara"
            >
              [ {currentLocale === "id" ? "SIMULASI DRONE" : "DRONE SIMULATION"} ]
            </button>
            <button
              onClick={() => setShowQuickStartBanner(false)}
              className="text-slate-500 hover:text-slate-300 text-[10px] font-bold ml-1"
              title="Tutup"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mars Aerial Scout Drone Flight Dock (Input Koordinat & Terbang Pesawat) */}
        {isAerialDockOpen && viewMode === "mission_control" && (
          <MarsAerialScoutDock
            currentSite={currentSite}
            onLaunchFlight={handleLaunchAerialFlight}
            onClose={() => setIsAerialDockOpen(false)}
            isFlying={isAerialFlying}
            flightTelemetry={aerialFlightTelemetry}
            theme={theme}
          />
        )}

        {/* High-Density 5-Meter Marswalk Transect Profile Dock (NASA MMGIS Ref 4) */}
        {activeRoute && isProfileDockOpen && viewMode === "mission_control" && (
          <MarswalkProfileDock
            route={activeRoute}
            onHoverPoint={setHoveredRoutePoint}
            onClose={() => setIsProfileDockOpen(false)}
            isLeftDrawerOpen={activeTool !== null && viewMode === "mission_control"}
            isSidebarExpanded={isSidebarExpanded}
          />
        )}

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

        {/* 3. UNIFIED BOTTOM TELEMETRY BAR & CIRCULAR TOGGLE BUTTON */}
        {viewMode === "mission_control" && !((activeRoute && isProfileDockOpen) || elevationProfile !== null) && (
          <div
            className={`absolute bottom-3 z-20 flex items-center gap-2 pointer-events-none select-none transition-all duration-200 ${activeTool !== null ? "hidden sm:flex sm:left-[406px]" : "left-14"
              } right-4`}
          >
            {/* Tombol Bulat Toggle Telemetri (Pointer-events-auto) */}
            <button
              onClick={() => setShowBottomTelemetry((prev) => !prev)}
              className={`pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center border shadow-xl transition-all duration-200 shrink-0 ${showBottomTelemetry
                ? "bg-amber-500 border-amber-300 text-slate-950 font-bold"
                : isDark
                  ? "bg-[#0b0f17] hover:bg-[#161e2e] border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-400"
                  : "bg-white hover:bg-slate-100 border-slate-300 hover:border-amber-500 text-slate-700 hover:text-amber-600"
                }`}
              title={
                showBottomTelemetry
                  ? currentLocale === "id"
                    ? "Sembunyikan Panel Telemetri Bawah"
                    : "Hide Bottom Telemetry Panel"
                  : currentLocale === "id"
                    ? "Buka Telemetri Permukaan Mars"
                    : "Open Martian Surface Telemetry"
              }
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M3 12h18" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </button>

            {/* Panel Telemetri & Scale (Hanya muncul jika tombol bulat diklik) */}
            {showBottomTelemetry && (
              <div className="flex-1 flex justify-between items-center gap-3 overflow-hidden">
                {/* Slot Kiri Bawah: Datum, Cursor Telemetry, Firmness, Radiation Shield */}
                <div
                  className={`pointer-events-auto h-9 px-3 flex items-center text-[10px] font-mono tabular-nums whitespace-nowrap border ${isDark ? "bg-[#0b0f17] border-slate-800 text-slate-300" : "bg-white border-slate-300 text-slate-700 shadow-sm"
                    } gap-2.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
                >
                  <span className="text-amber-500 font-bold">MARSFORALL</span>
                  <span className={isDark ? "text-slate-700" : "text-slate-300"}>//</span>
                  <span className="text-slate-400">DATUM -4500m TO -3500m</span>
                  <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                  <span className="text-cyan-400 font-medium">PITCH {pitch3D ? "45°" : "0°"}</span>
                  <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>

                  {/* Live Cursor Telemetry */}
                  {cursorTelemetry ? (
                    <>
                      <span className="text-slate-400 font-bold uppercase text-[9px]">CURSOR:</span>
                      <span className="text-cyan-400 font-bold">{cursorTelemetry.lat}°, {cursorTelemetry.lon}°</span>
                      <span className="text-amber-400 font-bold">{cursorTelemetry.elev} M</span>
                      <span className="text-purple-400 font-bold">{cursorTelemetry.slope}°</span>
                    </>
                  ) : (
                    <span className="text-slate-400 text-[9px]">SCANNING MARTIAN SURFACE...</span>
                  )}

                  <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                  <span
                    className={`px-1.5 py-0.5 border text-[9px] font-bold tabular-nums uppercase ${selectedWaypoint.sandTrapRisk === "HIGH"
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
                </div>

                {/* Slot Kanan Bawah: Scale Bar & JPL Mode + Optional Weather Scrubber */}
                <div className="pointer-events-auto flex items-center gap-2 shrink-0">
                  {/* Dynamic Metric Scale Bar */}
                  <div
                    className={`h-9 px-3 flex items-center text-[10px] font-mono tabular-nums whitespace-nowrap border ${isDark ? "bg-[#0b0f17] border-slate-800 text-slate-300" : "bg-white border-slate-300 text-slate-700 shadow-sm"
                      } gap-2`}
                  >
                    <span className="text-slate-400 font-bold uppercase text-[9px]">{tMmgis("scaleBar")}:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-amber-400 font-bold tabular-nums leading-none mb-0.5">
                        {scaleBar.label}
                      </span>
                      <div
                        style={{ width: `${scaleBar.widthPx}px` }}
                        className="h-1 border-x border-b border-amber-400"
                      />
                    </div>
                    <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTileMode("live_trek")}
                        className={`px-1.5 py-0.5 border text-[9px] font-bold uppercase transition-colors ${tileMode === "live_trek"
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
                        className={`px-1.5 py-0.5 border text-[9px] font-bold uppercase transition-colors ${tileMode === "offline_procedural"
                          ? "bg-[#78350f] text-[#fde68a] border-[#d97706]"
                          : isDark
                            ? "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                      >
                        [OFFLINE]
                      </button>
                    </div>
                  </div>

                  {/* Sol Clock & Weather Scrubber (if toggled) */}
                  {showSolWeatherScrubber && (
                    <div
                      className={`h-9 px-3 flex items-center text-[10px] font-mono tabular-nums whitespace-nowrap border ${isDark ? "bg-[#0b0f17] border-slate-800 text-slate-300" : "bg-white border-slate-300 text-slate-700 shadow-sm"
                        } gap-2`}
                    >
                      <span className="text-slate-400 text-[9px] uppercase font-bold">{tScrubber("solClock")}:</span>
                      {activeTraverseSols.map((pt) => (
                        <button
                          key={pt.sol}
                          onClick={() => handleSelectSol(pt.sol)}
                          title={`Jump to Sol ${pt.sol}: ${pt.name}`}
                          className={`px-1.5 py-0.5 border text-[9px] font-bold transition-colors ${currentSol === pt.sol
                            ? "bg-[#1e293b] text-amber-400 border-amber-400"
                            : isDark
                              ? "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
                              : "bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900"
                            }`}
                        >
                          {pt.sol}
                        </button>
                      ))}
                      <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
                      <button
                        onClick={() => {
                          setDustStormActive(false);
                          setExportNotification("ATMOSPHERE: CLEAR SKY // TAU 0.30");
                          setTimeout(() => setExportNotification(null), 2500);
                        }}
                        className={`px-1.5 py-0.5 border text-[9px] font-bold transition-colors ${!dustStormActive
                          ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                          : isDark
                            ? "bg-[#111827] text-slate-400 border-slate-800"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                      >
                        {tScrubber("clearSky")}
                      </button>
                      <button
                        onClick={() => {
                          setDustStormActive(true);
                          setExportNotification("WARNING: MARS DUST STORM // TAU 2.40");
                          setTimeout(() => setExportNotification(null), 3000);
                        }}
                        className={`px-1.5 py-0.5 border text-[9px] font-bold transition-colors ${dustStormActive
                          ? "bg-[#7f1d1d] text-[#fca5a5] border-[#ef4444]"
                          : isDark
                            ? "bg-[#111827] text-slate-400 border-slate-800"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                          }`}
                      >
                        {tScrubber("dustStorm")}
                      </button>
                      <button
                        onClick={() => setShowSolWeatherScrubber(false)}
                        className="px-1 text-slate-500 hover:text-slate-300 text-[10px] font-bold"
                        title="Hide Scrubber"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Tombol Tutup Panel Telemetri */}
                  <button
                    onClick={() => setShowBottomTelemetry(false)}
                    className={`h-9 px-2 flex items-center justify-center border font-mono text-xs font-bold transition-colors ${isDark
                      ? "bg-[#161e2e] hover:bg-red-950 border-slate-700 hover:border-red-600 text-slate-400 hover:text-red-300"
                      : "bg-slate-100 hover:bg-red-50 border-slate-300 hover:border-red-400 text-slate-600 hover:text-red-600"
                      }`}
                    title={currentLocale === "id" ? "Sembunyikan Telemetri" : "Hide Telemetry"}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Custom 360 Panorama Manager Modal */}
      {is360ManagerOpen && (
        <Custom360ManagerModal
          isOpen={is360ManagerOpen}
          onClose={() => setIs360ManagerOpen(false)}
          currentSite={currentSite}
          pickedCoords={pickedCoordsFor360}
          pickedElevation={pickedElevFor360}
          onStartPickCoordinate={() => {
            setIsPicking360Coord(true);
            setExportNotification(tCustom360("clickMapPrompt"));
            setTimeout(() => setExportNotification(null), 3000);
          }}
          onSelectAndOpen360={(wp) => {
            setSelectedWaypoint(wp);
            setIsPovOpen(true);
          }}
          onFlyToCoordinate={(coords) => {
            const customWp: MountSharpWaypoint = {
              id: `fly_${Date.now()}`,
              name: "Focus Target",
              category: "custom_user_pov" as any,
              coordinates: coords,
              elevationM: -4000,
              geologicUnit: "Mars Flank",
              stratigraphicAge: "Hesperian",
              apparentThermalInertiaTiu: 380,
              consistencyIndexCT: 0,
              meanSlopeDeg: 8,
              maxSlopeDeg: 14,
              roughnessHapkeThetaDeg: 20,
              craterDensityBeta: 0.2,
              surfaceRadiationMSvSol: 0.7,
              windExposureRisk: "moderate",
              crustalMagneticFieldNt: 50,
              themisNightTempK: 185,
              sandTrapRisk: "LOW",
              surfaceFirmness: "BEDROCK FIRM",
              waterEquivalentHydrogenPercent: 4.5,
              dominantHydratedMineral: "Sulfates",
              mineralogy: {
                sulfatePercent: 25,
                hematitePercent: 10,
                phyllosilicateClayPercent: 15,
                silicaPercent: 30,
                perchloratePercent: 0.5,
              },
              evaSuitTraversable: true,
              muleRoverTraversable: true,
              scientificPriority: 3,
              briefDescription: currentLocale === "id" ? "Titik sasaran eksplorasi" : "Exploration target waypoint",
            };
            setSelectedWaypoint(customWp);
          }}
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