"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MountSharpWaypoint,
  ALL_MARTIAN_WAYPOINTS,
  getWaypointsForSite,
  MissionSiteId,
  CURIOSITY_HISTORICAL_TRAVERSE,
  PERSEVERANCE_HISTORICAL_TRAVERSE,
  getRoverTraverseForSite,
  BRADBURY_LANDING_ELLIPSE,
} from "@/lib/martian/mountSharpWaypoints";
import { MarswalkRouteResult, HighDensityPointTelemetry } from "@/lib/martian/marswalkRouter";
import {
  OrbitalImagerySource,
  WmtsStreamStatus,
  SurfaceFirmnessStatus,
  SandTrapRiskLevel,
} from "@/lib/martian/scientificParams";
import {
  getMartianElevation,
  getMartianSlope,
  computeElevationProfile,
  computeViewshed360,
  ElevationProfileResult,
  ZoiFeature,
  bearingBetweenTwoLatLngs,
  martianGreatCircleDistanceM,
  trimLineString,
} from "@/lib/martian/mmgisSpatialAnalysis";
import mountSharpGeology from "@/data/mountSharpGeology.json";
import martianTerrainBase from "@/data/martianTerrainBase.json";
import { AerialScoutTarget } from "./MarsAerialScoutDock";

interface AresMapViewerProps {
  currentSite?: MissionSiteId;
  onChangeSite?: (site: MissionSiteId) => void;
  activeLayers: Record<string, boolean>;
  layerOpacities?: Record<string, number>;
  selectedWaypoint: MountSharpWaypoint | null;
  onSelectWaypoint: (wp: MountSharpWaypoint) => void;
  onMapClickCoordinate?: (coords: [number, number], elevation: number) => void;
  activeRoute: MarswalkRouteResult | null;
  viewMode: "mission_control" | "visor_hud";
  pitch3D: boolean;
  onTogglePitch?: () => void;
  resetNorthTrigger: number;
  customPinCoords: [number, number] | null;
  theme?: "dark" | "light";
  tileMode?: "live_trek" | "offline_procedural";
  orbitalSource?: OrbitalImagerySource;
  onChangeOrbitalSource?: (src: OrbitalImagerySource) => void;
  onWmtsStatusChange?: (status: WmtsStreamStatus) => void;
  dustStormActive?: boolean;
  currentSol?: number;
  onSelectSol?: (sol: number) => void;
  onNotification?: (msg: string) => void;

  // MMGIS Spatial Analysis Props
  activeMmgisTool?: "none" | "measure" | "viewshed" | "zoi";
  onSelectMmgisTool?: (tool: "none" | "measure" | "viewshed" | "zoi") => void;
  measurePoints?: [number, number][];
  onUpdateMeasurePoints?: (points: [number, number][]) => void;
  onProfileGenerated?: (profile: ElevationProfileResult | null) => void;
  zoiList?: ZoiFeature[];
  onAddZoi?: (zoi: ZoiFeature) => void;
  onExportGeoJson?: () => void;
  onFeatureIdentified?: (feat: IdentifiedFeatureInfo) => void;
  isInspectorActive?: boolean;
  onOpenPlanetGlobe?: () => void;
  isLeftDrawerOpen?: boolean;
  onOpenPovModal?: (wp: MountSharpWaypoint) => void;
  onAnalyzeProspector?: (wp: MountSharpWaypoint) => void;
  onPlanRouteToWaypoint?: (wp: MountSharpWaypoint) => void;
  onOpenAnalogueMatcher?: (wp: MountSharpWaypoint) => void;
  onToggleProfileDock?: () => void;
  isProfileDockOpen?: boolean;
  onOpen360Manager?: () => void;
  custom360Waypoints?: MountSharpWaypoint[];
  hoveredRoutePoint?: HighDensityPointTelemetry | null;
  showRoverTraverse?: boolean;
  showGraticule?: boolean;
  showFloatingLegend?: boolean;
  onToggleFloatingLegend?: () => void;
  reCenterTrigger?: number;
  isAerialDockOpen?: boolean;
  showQuickStartBanner?: boolean;
  onCloseQuickStartBanner?: () => void;
  onLaunchSampleRoute?: () => void;
  flyToCoord?: [number, number] | null;
  aerialFlightTarget?: AerialScoutTarget | null;
  onAerialFlightComplete?: (target: AerialScoutTarget) => void;
  onAerialTelemetryUpdate?: (telemetry: {
    currentCoord: [number, number];
    altitudeM: number;
    speedMs: number;
    distanceRemainingKm: number;
    headingDeg: number;
  }) => void;
  onCursorTelemetryUpdate?: (telemetry: { lat: number; lon: number; elev: number; slope: number } | null) => void;
  onScaleUpdate?: (scale: { label: string; widthPx: number }) => void;
}

const MOUNT_SHARP_CENTER: [number, number] = [137.40, -4.74];
const MOUNT_SHARP_DEFAULT_ZOOM = 12.2;
const JEZERO_CRATER_CENTER: [number, number] = [77.4509, 18.3789];
const JEZERO_DEFAULT_ZOOM = 12.2;

const WAYPOINT_SHORT_CODES: Record<
  string,
  { code: string; color: string; border: string; text: string }
> = {
  gale_hab_alpha: {
    code: "HAB",
    color: "bg-[#064e3b]",
    border: "border-[#10b981]",
    text: "text-[#34d399]",
  },
  curiosity_boxwork_2025: {
    code: "BOX",
    color: "bg-[#78350f]",
    border: "border-[#f59e0b]",
    text: "text-[#fef3c7]",
  },
  vera_rubin_ridge: {
    code: "VRR",
    color: "bg-[#451a03]",
    border: "border-[#ea580c]",
    text: "text-[#fed7aa]",
  },
  glen_torridon_trough: {
    code: "GLT",
    color: "bg-[#083344]",
    border: "border-[#06b6d4]",
    text: "text-[#a5f3fc]",
  },
  greenheugh_pediment: {
    code: "GHP",
    color: "bg-[#1e293b]",
    border: "border-[#94a3b8]",
    text: "text-slate-200",
  },
  gediz_vallis_ridge: {
    code: "GDV",
    color: "bg-[#7f1d1d]",
    border: "border-[#ef4444]",
    text: "text-[#fca5a5]",
  },
  marker_band_valley: {
    code: "MBV",
    color: "bg-[#312e81]",
    border: "border-[#818cf8]",
    text: "text-[#c7d2fe]",
  },
  // Mars 2020 Perseverance Jezero Crater Waypoint Badges
  jzr_hab_alpha: {
    code: "HAB",
    color: "bg-[#064e3b]",
    border: "border-[#10b981]",
    text: "text-[#34d399]",
  },
  jzr_three_forks_delta: {
    code: "DLT",
    color: "bg-[#083344]",
    border: "border-[#06b6d4]",
    text: "text-[#a5f3fc]",
  },
  jzr_seitah_olivine: {
    code: "STH",
    color: "bg-[#78350f]",
    border: "border-[#f59e0b]",
    text: "text-[#fef3c7]",
  },
  jzr_bright_angel_redox: {
    code: "BRT",
    color: "bg-[#4c1d95]",
    border: "border-[#a855f7]",
    text: "text-[#f3e8ff]",
  },
};

export interface IdentifiedFeatureInfo {
  name: string;
  category: string;
  stratigraphicAge: string;
  elevationM: number;
  slopeDeg: number;
  mineralogy: string;
  coordinates: [number, number];
  surfaceFirmness?: SurfaceFirmnessStatus;
  sandTrapRisk?: SandTrapRiskLevel;
  crustalMagneticFieldNt?: number;
  surfaceRadiationMSvSol?: number;
  has360Pov?: boolean;
  associatedWaypoint?: MountSharpWaypoint;
  laymanDescription?: string;
  temperatureRange?: string;
}

export const SEARCH_SHORTCUTS: {
  name: string;
  coords: [number, number];
  zoom: number;
  site: MissionSiteId;
  desc: string;
}[] = [
  {
    name: "Gale Crater",
    coords: [137.4417, -4.5895],
    zoom: 11.5,
    site: "gale_crater",
    desc: "Kawah tumbukan purba berdiameter 154 km tempat pendaratan robot penjelajah Curiosity.",
  },
  {
    name: "Mount Sharp Boxwork",
    coords: [137.785, -5.325],
    zoom: 14.5,
    site: "gale_crater",
    desc: "Kisi-kisi mineral urat purba yang terbentuk dari sirkulasi air tanah miliaran tahun lalu.",
  },
  {
    name: "Jezero Crater",
    coords: [77.4509, 18.3789],
    zoom: 11.5,
    site: "jezero_crater",
    desc: "Cekungan danau purba tempat penjelajahan Perseverance mencari tanda-tanda kehidupan mikroba kuno.",
  },
  {
    name: "Cheyava Falls",
    coords: [77.382, 18.441],
    zoom: 14.5,
    site: "jezero_crater",
    desc: "Batuan sedimen berbercak 'leopard spots' dengan tanda reaksi kimia fosfat dan besi.",
  },
  {
    name: "Olympus Mons",
    coords: [-133.8, 18.65],
    zoom: 6.0,
    site: "gale_crater",
    desc: "Gunung berapi perisai raksasa tertinggi di Tata Surya menjulang 21 km ke angkasa Mars.",
  },
  {
    name: "Valles Marineris",
    coords: [-75.0, -14.0],
    zoom: 5.5,
    site: "gale_crater",
    desc: "Sistem ngarai terbesar di Mars sepanjang 4.000 km membelah seperempat lingkar planet.",
  },
];

export function getFeatureLaymanDescription(name: string, _category: string, slopeDeg: number): string {
  if (name.includes("Boxwork")) {
    return "Struktur kisi mineral purba yang terbentuk dari aliran air tanah miliaran tahun lalu, memberikan petunjuk kuat tentang masa lalu Mars yang basah.";
  }
  if (name.includes("Bradbury") || name.includes("Touchdown")) {
    return "Lokasi pendaratan bersejarah wahana Curiosity di dasar Kawah Gale dengan kerikil halus sisa aliran sungai purba.";
  }
  if (name.includes("Butler") || name.includes("Perseverance")) {
    return "Titik pendaratan wahana antariksa Perseverance di Kawah Jezero yang membidik jejak biosignatur masa lalu.";
  }
  if (name.includes("Cheyava")) {
    return "Batuan bintik macan tutul 'leopard spots' kaya fosfat & besi, salah satu kandidat biosignatur paling memikat di Mars.";
  }
  if (name.includes("Olympus")) {
    return "Gunung berapi perisai raksasa terbesar di Tata Surya, menjulang 21 km menembus lapisan tipis atmosfer Mars.";
  }
  if (name.includes("Valles Marineris")) {
    return "Sistem ngarai terbesar di Mars sepanjang 4.000 km dan sedalam 7 km, empat kali lebih dalam daripada Grand Canyon Bumi.";
  }
  if (name.includes("Habitat") || name.includes("HAB")) {
    return "Pangkalan habitat utama astronot di permukaan Mars dengan modul penunjang hidup, pelindung radiasi, dan sumber daya terpusat.";
  }
  if (slopeDeg > 25) {
    return "Lereng tebing berbatu curam dengan singkapan lapisan geologi purba yang menantang namun kaya informasi ilmiah.";
  }
  if (slopeDeg > 15) {
    return "Zona undakan batuan dengan kemiringan sedang, cocok untuk observasi panorama kawah dan formasi mineral berlapis.";
  }
  return "Wilayah permukaan Mars dengan hamparan batuan beku basaltik dan sedimen kaya mineral yang aman untuk lintasan penjelajahan.";
}

function generateMartianGraticule(centerLon: number, centerLat: number): any {
  const features: any[] = [];
  const span = 0.4;
  const step = 0.05;
  const minLon = Number((centerLon - span).toFixed(2));
  const maxLon = Number((centerLon + span).toFixed(2));
  const minLat = Number((centerLat - span).toFixed(2));
  const maxLat = Number((centerLat + span).toFixed(2));

  // Meridians (Lines of constant longitude)
  for (let lon = minLon; lon <= maxLon + 0.001; lon += step) {
    const roundedLon = Number(lon.toFixed(3));
    features.push({
      type: "Feature",
      properties: { type: "meridian", value: `${roundedLon}°E` },
      geometry: {
        type: "LineString",
        coordinates: [
          [roundedLon, minLat],
          [roundedLon, maxLat],
        ],
      },
    });
  }

  // Parallels (Lines of constant latitude)
  for (let lat = minLat; lat <= maxLat + 0.001; lat += step) {
    const roundedLat = Number(lat.toFixed(3));
    features.push({
      type: "Feature",
      properties: { type: "parallel", value: `${roundedLat}°N` },
      geometry: {
        type: "LineString",
        coordinates: [
          [minLon, roundedLat],
          [maxLon, roundedLat],
        ],
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

export const AresMapViewer: React.FC<AresMapViewerProps> = ({
  currentSite = "gale_crater",
  onChangeSite,
  activeLayers,
  layerOpacities = {
    layer_optical_geologic: 0.8,
    layer_topographic_hazard: 0.8,
    layer_thermal_subsurface: 0.8,
    layer_science_mineral: 0.8,
    layer_safety_magnetic: 0.8,
  },
  selectedWaypoint,
  onSelectWaypoint,
  onMapClickCoordinate,
  activeRoute,
  viewMode,
  pitch3D,
  onTogglePitch,
  resetNorthTrigger,
  customPinCoords,
  theme = "dark",
  tileMode = "live_trek",
  orbitalSource = "jpl_hirise",
  onChangeOrbitalSource,
  onWmtsStatusChange,
  dustStormActive = false,
  currentSol = 4180,
  onSelectSol,
  onNotification,
  // MMGIS
  activeMmgisTool = "none",
  onSelectMmgisTool,
  measurePoints = [],
  onUpdateMeasurePoints,
  onProfileGenerated,
  zoiList = [],
  onAddZoi,
  onExportGeoJson,
  onFeatureIdentified,
  isInspectorActive = false,
  onOpenPlanetGlobe,
  isLeftDrawerOpen = false,
  onOpenPovModal,
  onAnalyzeProspector,
  onPlanRouteToWaypoint,
  onOpenAnalogueMatcher,
  onToggleProfileDock,
  isProfileDockOpen = true,
  onOpen360Manager,
  custom360Waypoints = [],
  hoveredRoutePoint,
  showRoverTraverse = true,
  showGraticule = false,
  showFloatingLegend = true,
  onToggleFloatingLegend,
  reCenterTrigger = 0,
  isAerialDockOpen = false,
  showQuickStartBanner = false,
  onCloseQuickStartBanner,
  onLaunchSampleRoute,
  flyToCoord = null,
  aerialFlightTarget = null,
  onAerialFlightComplete,
  onAerialTelemetryUpdate,
  onCursorTelemetryUpdate,
  onScaleUpdate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const effectiveSol = currentSite === "jezero_crater" ? Math.min(currentSol, 1220) : currentSol;

  const planeMarkerRef = useRef<Marker | null>(null);

  const markersRef = useRef<Marker[]>([]);
  const curiosityMarkersRef = useRef<Marker[]>([]);
  const customMarkerRef = useRef<Marker | null>(null);
  const measureMarkersRef = useRef<Marker[]>([]);
  const zoiMarkersRef = useRef<Marker[]>([]);
  const viewshedMarkerRef = useRef<Marker | null>(null);
  const scrubMarkerRef = useRef<Marker | null>(null);
  const routeStartMarkerRef = useRef<Marker | null>(null);
  const routeTargetMarkerRef = useRef<Marker | null>(null);
  const routeMilestoneMarkersRef = useRef<Marker[]>([]);
  const routeBadgeMarkersRef = useRef<Marker[]>([]);
  const landmarkMarkersRef = useRef<Marker[]>([]);
  const roverActiveMarkerRef = useRef<Marker | null>(null);

  const [identifiedFeature, setIdentifiedFeature] = useState<IdentifiedFeatureInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Live Cursor Telemetry & Scale Bar States
  const [cursorTelemetry, setCursorTelemetry] = useState<{
    lat: number;
    lon: number;
    elev: number;
    slope: number;
  } | null>(null);

  const [scaleBar, setScaleBar] = useState<{ widthPx: number; label: string }>({
    widthPx: 80,
    label: "1 KM",
  });

  const t = useTranslations("mapViewer");
  const tMmgis = useTranslations("mmgis");
  const isDark = theme === "dark";

  // Auto-close Place Card when inspector or aerial scout dock is opened
  useEffect(() => {
    if (isInspectorActive || isAerialDockOpen) {
      setIdentifiedFeature(null);
    }
  }, [isInspectorActive, isAerialDockOpen]);

  const isFirstMountRef = useRef<boolean>(true);
  // Auto-sync Place Card with selectedWaypoint on user selection
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (selectedWaypoint) {
      const approxSlope = (selectedWaypoint as any).slopeDeg ?? getMartianSlope(selectedWaypoint.coordinates[0], selectedWaypoint.coordinates[1], currentSite);
      setIdentifiedFeature({
        name: selectedWaypoint.name,
        category: selectedWaypoint.category.toUpperCase().replace("_", " "),
        stratigraphicAge: selectedWaypoint.stratigraphicAge || (currentSite === "jezero_crater" ? "Noachian / Early Hesperian" : "Hesperian / Amazonian"),
        elevationM: selectedWaypoint.elevationM,
        slopeDeg: approxSlope,
        mineralogy: selectedWaypoint.dominantHydratedMineral || (selectedWaypoint as any).dominantMineral || "Phyllosilicates / Clay-Sulfate",
        coordinates: selectedWaypoint.coordinates,
        associatedWaypoint: selectedWaypoint,
        surfaceFirmness: selectedWaypoint.surfaceFirmness,
        sandTrapRisk: selectedWaypoint.sandTrapRisk,
        crustalMagneticFieldNt: selectedWaypoint.crustalMagneticFieldNt,
        surfaceRadiationMSvSol: selectedWaypoint.surfaceRadiationMSvSol,
        laymanDescription: getFeatureLaymanDescription(selectedWaypoint.name, selectedWaypoint.category, approxSlope),
        temperatureRange: "-75°C s.d. -15°C",
      });
    }
  }, [selectedWaypoint, currentSite]);

  // Fly to target mission site when switched
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (currentSite === "jezero_crater") {
      map.flyTo({
        center: JEZERO_CRATER_CENTER,
        zoom: JEZERO_DEFAULT_ZOOM,
        duration: 1200,
      });
    } else {
      map.flyTo({
        center: MOUNT_SHARP_CENTER,
        zoom: MOUNT_SHARP_DEFAULT_ZOOM,
        duration: 1200,
      });
    }
  }, [currentSite]);

  // Update dynamic metric scale bar on map move or zoom
  const updateScaleBar = useCallback((map: MapLibreMap) => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const latRad = (center.lat * Math.PI) / 180;
    // Martian meters per pixel
    const mpp = (2 * Math.PI * 3389500 * Math.cos(latRad)) / (256 * Math.pow(2, zoom));
    if (mpp <= 0) return;

    // Pick target distance in meters for ~100px width
    const roughMeters = mpp * 90;
    const steps = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
    let chosenM = steps[0];
    for (let i = 0; i < steps.length; i++) {
      if (steps[i] >= roughMeters) {
        chosenM = steps[i];
        break;
      }
    }
    const widthPx = Math.max(30, Math.min(180, Math.round(chosenM / mpp)));
    const label = chosenM >= 1000 ? `${chosenM / 1000} KM` : `${chosenM} M`;
    setScaleBar({ widthPx, label });
    onScaleUpdate?.({ widthPx, label });
  }, [onScaleUpdate]);

  // Primary MapLibre Instance Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          mars_viking_basemap: {
            type: "raster",
            tiles: ["/api/mars-tiles/viking-mdim21/{z}/{y}/{x}"],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 7,
            attribution: "NASA / JPL / USGS Viking MDIM 2.1 Mosaic",
          },
          mars_ctx_gale: {
            type: "raster",
            tiles: ["/api/mars-tiles/gale-ctx/{z}/{y}/{x}"],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 16,
            bounds: [135.1, -6.7, 139.3, -2.7],
            attribution: "NASA / JPL / MSSS (Gale CTX 6m Mosaic)",
          },
          mars_ctx_jezero: {
            type: "raster",
            tiles: ["/api/mars-tiles/jezero-ctx/{z}/{y}/{x}"],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 16,
            bounds: [76.8, 17.6, 78.3, 19.1],
            attribution: "NASA / JPL / Caltech (Jezero CTX 6m Mosaic)",
          },
          mars_mola_shaded: {
            type: "raster",
            tiles: ["/api/mars-tiles/mola-clrshade/{z}/{y}/{x}"],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 8,
            attribution: "NASA / GSFC / MOLA Team",
          },
          mars_themis_night: {
            type: "raster",
            tiles: ["/api/mars-tiles/themis-night-ir/{z}/{y}/{x}"],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 8,
            attribution: "NASA / ASU / THEMIS IR Night Mosaic",
          },
        },
        layers: [
          {
            id: "background-mars-space",
            type: "background",
            paint: { "background-color": "#07090e" },
          },

          {
            id: "mars-raster-viking",
            type: "raster",
            source: "mars_viking_basemap",
            layout: {
              visibility: "visible",
            },
            paint: {
              "raster-opacity": 1.0,
              "raster-contrast": 0.25,
              "raster-saturation": 0.15,
              "raster-resampling": "linear",
              "raster-fade-duration": 0,
            },
          },
          {
            id: "mars-raster-mola",
            type: "raster",
            source: "mars_mola_shaded",
            layout: {
              visibility: orbitalSource === "mola_hrsc" ? "visible" : "none",
            },
            paint: {
              "raster-opacity": orbitalSource === "mola_hrsc" ? 0.85 : 0,
              "raster-contrast": 0.35,
              "raster-resampling": "linear",
              "raster-fade-duration": 0,
            },
          },
          {
            id: "mars-raster-themis-night",
            type: "raster",
            source: "mars_themis_night",
            layout: {
              visibility: orbitalSource === "themis_night" ? "visible" : "none",
            },
            paint: {
              "raster-opacity": orbitalSource === "themis_night" ? 0.85 : 0,
              "raster-contrast": 0.30,
              "raster-resampling": "linear",
              "raster-fade-duration": 0,
            },
          },
          {
            id: "mars-raster-ctx-gale",
            type: "raster",
            source: "mars_ctx_gale",
            layout: {
              visibility: currentSite === "gale_crater" ? "visible" : "none",
            },
            paint: {
              "raster-opacity": orbitalSource === "mola_hrsc" || orbitalSource === "themis_night" ? 0.35 : 1.0,
              "raster-contrast": 0.25,
              "raster-resampling": "linear",
              "raster-fade-duration": 0,
            },
          },
          {
            id: "mars-raster-ctx-jezero",
            type: "raster",
            source: "mars_ctx_jezero",
            layout: {
              visibility: currentSite === "jezero_crater" ? "visible" : "none",
            },
            paint: {
              "raster-opacity": orbitalSource === "mola_hrsc" || orbitalSource === "themis_night" ? 0.35 : 1.0,
              "raster-contrast": 0.25,
              "raster-resampling": "linear",
              "raster-fade-duration": 0,
            },
          },
        ],
      },
      center: MOUNT_SHARP_CENTER,
      zoom: MOUNT_SHARP_DEFAULT_ZOOM,
      minZoom: 1.2,
      maxZoom: 18,
      pitch: 45,
      bearing: -15,
      maxPitch: 75,
      attributionControl: false,
    });

    map.on("load", () => {
      // 1. Procedural Martian Terrain Base
      map.addSource("mars_procedural_terrain", {
        type: "geojson",
        data: martianTerrainBase as unknown as maplibregl.GeoJSONSourceSpecification["data"],
      });

      map.addLayer({
        id: "mars_terrain_basin_fills",
        type: "fill",
        source: "mars_procedural_terrain",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.0,
        },
      });

      map.addLayer({
        id: "mars_terrain_lines",
        type: "line",
        source: "mars_procedural_terrain",
        paint: {
          "line-color": "#94a3b8",
          "line-width": 0.9,
          "line-opacity": 0.45,
          "line-dasharray": [3, 2],
        },
      });

      // 2. Gale Crater Geology GeoJSON Source
      map.addSource("gale_geology", {
        type: "geojson",
        data: mountSharpGeology as unknown as maplibregl.GeoJSONSourceSpecification["data"],
      });

      // Layer 1: Optical & Geologic Units
      map.addLayer({
        id: "geology_fills",
        type: "fill",
        source: "gale_geology",
        layout: {
          visibility: activeLayers["layer_optical_geologic"] ? "visible" : "none",
        },
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.10, 13, 0.02],
        },
      });

      map.addLayer({
        id: "geology_borders",
        type: "line",
        source: "gale_geology",
        layout: {
          visibility: activeLayers["layer_optical_geologic"] ? "visible" : "none",
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.5,
          "line-opacity": 0.85,
          "line-dasharray": [3, 2],
        },
      });

      // Layer 2: Topographic & Mobility Hazards
      map.addLayer({
        id: "hazard_slopes",
        type: "line",
        source: "gale_geology",
        layout: {
          visibility: activeLayers["layer_topographic_hazard"] ? "visible" : "none",
        },
        paint: {
          "line-color": [
            "match",
            ["get", "hazard"],
            "safe",
            "#16a34a",
            "caution",
            "#ca8a04",
            "cliff_hazard",
            "#dc2626",
            "#475569",
          ],
          "line-width":  1.5,
          "line-dasharray": [3, 2],
        },
      });

      // Layer 3: Thermal & Subsurface (ATI & CT)
      map.addLayer({
        id: "thermal_subsurface_circles",
        type: "fill",
        source: "gale_geology",
        layout: {
          visibility: activeLayers["layer_thermal_subsurface"] ? "visible" : "none",
        },
        paint: {
          "fill-color": [
            "match",
            ["get", "ct"],
            1,
            "#0284c7",
            0,
            "#64748b",
            -1,
            "#ea580c",
            "#4f46e5",
          ],
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.10, 13, 0.02],
        },
      });

      // Layer 4: CRISM Hydrated Minerals
      map.addLayer({
        id: "science_mineral_fills",
        type: "fill",
        source: "gale_geology",
        layout: {
          visibility: activeLayers["layer_science_mineral"] ? "visible" : "none",
        },
        paint: {
          "fill-color": "#06b6d4",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.10, 13, 0.02],
        },
      });

      // Layer 5: MGS MAG Crustal Magnetic Field
      map.addLayer({
        id: "safety_magnetic_fills",
        type: "fill",
        source: "gale_geology",
        layout: {
          visibility: activeLayers["layer_safety_magnetic"] ? "visible" : "none",
        },
        paint: {
          "fill-color": "#8b5cf6",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.10, 13, 0.02],
        },
      });

      // Curiosity Landing Ellipse
      map.addSource("curiosity_landing_ellipse_source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { name: "Bradbury Landing Ellipse (20km x 7km)" },
          geometry: {
            type: "Polygon",
            coordinates: [BRADBURY_LANDING_ELLIPSE],
          },
        },
      });

      map.addLayer({
        id: "curiosity_ellipse_fill",
        type: "fill",
        source: "curiosity_landing_ellipse_source",
        paint: {
          "fill-color": "#38bdf8",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.08, 13, 0.02],
        },
      });

      map.addLayer({
        id: "curiosity_ellipse_line",
        type: "line",
        source: "curiosity_landing_ellipse_source",
        paint: {
          "line-color": "#38bdf8",
          "line-width":  1.5,
          "line-dasharray": [4, 4],
        },
      });

      // Rover Historical Traverse (Dual-Layer Line Casing ala MMGIS)
      const initialTraverse = getRoverTraverseForSite(currentSite);
      map.addSource("curiosity_traverse_source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { name: "Martian Rover Historical Traverse" },
          geometry: {
            type: "LineString",
            coordinates: initialTraverse.map((p) => p.coordinates),
          },
        },
      });

      // Rover Candidate / Historical Traverse (Subtle Dashed Gray Track ala NASA MMGIS)
      map.addLayer({
        id: "curiosity_traverse_casing",
        type: "line",
        source: "curiosity_traverse_source",
        paint: {
          "line-color": "#07090e",
          "line-width": 3.5,
          "line-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "curiosity_traverse_line",
        type: "line",
        source: "curiosity_traverse_source",
        paint: {
          "line-color": "#facc15",
          "line-width": 2.2,
          "line-dasharray": [4, 4],
          "line-opacity": 0.55,
        },
      });

      // Marswalk Route 1 (Primary Safest Corridor) Source
      map.addSource("marswalk_route_source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Marswalk Route 2 (Alternative Pass Corridor) Source
      map.addSource("marswalk_route_alt_source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Alternative Route Dark Casing
      map.addLayer({
        id: "marswalk_route_alt_casing",
        type: "line",
        source: "marswalk_route_alt_source",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#020617",
          "line-width": 6.5,
          "line-opacity": 0.95,
        },
      });

      // Alternative Route Amber Dashed Spine
      map.addLayer({
        id: "marswalk_route_alt_line",
        type: "line",
        source: "marswalk_route_alt_source",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#f59e0b",
          "line-width": 4.0,
          "line-dasharray": [3, 2],
          "line-opacity": 0.9,
        },
      });

      // Primary Route Dark Protective Casing (No offset / shadow to prevent black triangles)
      map.addLayer({
        id: "marswalk_route_casing",
        type: "line",
        source: "marswalk_route_source",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#020617",
          "line-width": 8.0,
          "line-opacity": 1.0,
        },
      });

      // Primary Route Emerald Luminous Core Corridor (#10b981)
      map.addLayer({
        id: "marswalk_route_core",
        type: "line",
        source: "marswalk_route_source",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": [
            "coalesce",
            ["get", "color"],
            "#10b981"
          ],
          "line-width": 5.0,
        },
      });

      // Primary Route Directional Dashed Centerline
      map.addLayer({
        id: "marswalk_route_lane_dashed",
        type: "line",
        source: "marswalk_route_source",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#ffffff",
          "line-width": 1.5,
          "line-dasharray": [2, 3],
          "line-opacity": 0.85,
        },
      });

      // 5-Meter High Density Sampling Dots Layer (3D Map Pitch Aligned)
      map.addSource("marswalk_route_dots_source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "marswalk_route_dots",
        type: "circle",
        source: "marswalk_route_dots_source",
        paint: {
          "circle-radius": 4.0,
          "circle-color": [
            "coalesce",
            ["get", "color"],
            "#34d399"
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#07090e",
          "circle-opacity": 0.95,
          "circle-pitch-alignment": "map",
        },
      });

      // MMGIS 1: Measure Transect Line
      map.addSource("mmgis_measure_source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "mmgis_measure_line",
        type: "line",
        source: "mmgis_measure_source",
        paint: {
          "line-color": "#06b6d4",
          "line-width": 2.5,
          "line-dasharray": [3, 2],
        },
      });

      // MMGIS 3: Viewshed 360° Polygon
      map.addSource("mmgis_viewshed_source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "mmgis_viewshed_fill",
        type: "fill",
        source: "mmgis_viewshed_source",
        paint: {
          "fill-color": "#10b981",
          "fill-opacity": 0.22,
        },
      });

      map.addLayer({
        id: "mmgis_viewshed_line",
        type: "line",
        source: "mmgis_viewshed_source",
        paint: {
          "line-color": "#34d399",
          "line-width": 1.5,
          "line-dasharray": [2, 2],
        },
      });

      // MMGIS 4: Graticule Grid Layer
      const centerCoords = currentSite === "jezero_crater" ? JEZERO_CRATER_CENTER : MOUNT_SHARP_CENTER;
      map.addSource("mmgis_graticule_source", {
        type: "geojson",
        data: generateMartianGraticule(centerCoords[0], centerCoords[1]),
      });

      map.addLayer({
        id: "mmgis_graticule_line",
        type: "line",
        source: "mmgis_graticule_source",
        layout: {
          visibility: "none",
        },
        paint: {
          "line-color": "#94a3b8",
          "line-opacity": 0.25,
          "line-width": 1,
          "line-dasharray": [2, 2],
        },
      });

      updateScaleBar(map);
      setMapLoaded(true);
    });

    // Error handler for external tiles
    map.on("error", (e: any) => {
      const errText = (e?.error?.message || e?.message || "").toLowerCase();
      const sourceId = (e?.sourceId || "").toLowerCase();
      if (
        sourceId.startsWith("mars_") ||
        errText.includes("tile") ||
        errText.includes("fetch") ||
        errText.includes("network") ||
        errText.includes("404") ||
        errText.includes("cors")
      ) {
        if (onWmtsStatusChange) onWmtsStatusChange("fallback");
        // Do NOT hide raster layers - proxy route provides Viking MDIM 2.1 fallback
      }
    });

    // Detect successful WMTS load
    map.on("sourcedata", (e) => {
      if (
        e.isSourceLoaded &&
        e.sourceId?.startsWith("mars_") &&
        e.dataType === "source" &&
        orbitalSource !== "local_vector" &&
        tileMode === "live_trek"
      ) {
        if (onWmtsStatusChange) onWmtsStatusChange("streaming");
      }
    });

    // Live Cursor Telemetry Tracking (Throttled with requestAnimationFrame)
    let rafHoverId: number | null = null;
    map.on("mousemove", (e) => {
      if (rafHoverId) return;
      rafHoverId = requestAnimationFrame(() => {
        rafHoverId = null;
        const lon = Number(e.lngLat.lng.toFixed(4));
        const lat = Number(e.lngLat.lat.toFixed(4));
        const elev = getMartianElevation(lon, lat, currentSite);
        const slope = getMartianSlope(lon, lat, currentSite);
        setCursorTelemetry({ lat, lon, elev, slope });
        onCursorTelemetryUpdate?.({ lat, lon, elev, slope });
      });
    });

    map.on("mouseout", () => {
      setCursorTelemetry(null);
      onCursorTelemetryUpdate?.(null);
    });

    // Throttled Move & Scale Update
    let rafMoveId: number | null = null;
    map.on("moveend", () => {
      if (typeof window !== "undefined") {
        const center = map.getCenter();
        const zoom = Number(map.getZoom().toFixed(2));
        const lat = Number(center.lat.toFixed(4));
        const lng = Number(center.lng.toFixed(4));
        const url = new URL(window.location.href);
        url.searchParams.set("site", currentSite === "jezero_crater" ? "jezero" : "gale");
        url.searchParams.set("lat", lat.toString());
        url.searchParams.set("lng", lng.toString());
        url.searchParams.set("z", zoom.toString());
        url.searchParams.set("sol", currentSol.toString());
        window.history.replaceState(null, "", url.toString());
      }
    });

    map.on("move", () => {
      if (rafMoveId) return;
      rafMoveId = requestAnimationFrame(() => {
        rafMoveId = null;
        updateScaleBar(map);
      });
    });

    // Container Resize Observer for dynamic sidebar and drawer layout shifts
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.resize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    mapRef.current = map;

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (rafHoverId) cancelAnimationFrame(rafHoverId);
      if (rafMoveId) cancelAnimationFrame(rafMoveId);
      if (routeStartMarkerRef.current) routeStartMarkerRef.current.remove();
      if (routeTargetMarkerRef.current) routeTargetMarkerRef.current.remove();
      if (roverActiveMarkerRef.current) roverActiveMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to coordinate when triggered (e.g. from Navigation Turn-by-Turn Maneuvers)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToCoord) return;
    map.flyTo({ center: flyToCoord, zoom: 13.8, duration: 800, pitch: 48 });
  }, [flyToCoord]);

  // Mars Aerial Scout Drone Animated Flight Loop
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !aerialFlightTarget) {
      if (planeMarkerRef.current) {
        planeMarkerRef.current.remove();
        planeMarkerRef.current = null;
      }
      return;
    }

    const startLon = map.getCenter().lng;
    const startLat = map.getCenter().lat;
    const targetLon = aerialFlightTarget.lon;
    const targetLat = aerialFlightTarget.lat;

    const dLon = targetLon - startLon;
    const dLat = targetLat - startLat;
    const headingDeg = (Math.atan2(dLon, dLat) * 180) / Math.PI;

    // Create Aircraft Element
    const el = document.createElement("div");
    el.className = "select-none pointer-events-none";
    el.innerHTML = `
      <div class="relative flex flex-col items-center">
        <div class="w-8 h-8 rounded-full bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.9)]" style="transform: rotate(${headingDeg}deg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#38bdf8">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
        <div class="mt-1 px-1.5 py-0.5 bg-[#07090e] border border-cyan-400 text-cyan-300 font-mono text-[8px] font-bold tracking-wider whitespace-nowrap shadow-md">
          [AERIAL SCOUT-01] // ${aerialFlightTarget.altitudeM}m
        </div>
      </div>
    `;

    if (planeMarkerRef.current) {
      planeMarkerRef.current.remove();
    }

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([startLon, startLat])
      .addTo(map);
    planeMarkerRef.current = marker;

    const totalDistKm = Math.hypot(dLon * 59.2, dLat * 59.2);
    const durationMs = Math.min(8000, Math.max(3500, totalDistKm * 250));
    const startTime = performance.now();
    let animFrame: number;

    const animateFlight = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      const curLon = startLon + dLon * ease;
      const curLat = startLat + dLat * ease;

      marker.setLngLat([curLon, curLat]);
      map.easeTo({ center: [curLon, curLat], zoom: 13.5, pitch: 45, duration: 60 });

      const distRemaining = totalDistKm * (1 - ease);
      onAerialTelemetryUpdate?.({
        currentCoord: [curLon, curLat],
        altitudeM: aerialFlightTarget.altitudeM,
        speedMs: 140,
        distanceRemainingKm: Math.max(0, distRemaining),
        headingDeg,
      });

      if (progress < 1.0) {
        animFrame = requestAnimationFrame(animateFlight);
      } else {
        // Flight Complete!
        onAerialFlightComplete?.(aerialFlightTarget);
        const elev = getMartianElevation(targetLon, targetLat, currentSite);
        const slope = getMartianSlope(targetLon, targetLat, currentSite);
        setIdentifiedFeature({
          name: aerialFlightTarget.label,
          category: "AERIAL SCOUT RECONNAISSANCE TARGET",
          stratigraphicAge: `Aerial Survey Sol ${currentSol}`,
          elevationM: elev,
          slopeDeg: slope,
          mineralogy: "Aerial Laser Altimeter & Spectral Sweep Locked",
          coordinates: [targetLon, targetLat],
          surfaceFirmness: elev > -4100 ? "BEDROCK FIRM" : "SOFT SAND TRAP RISK",
          sandTrapRisk: elev > -4100 ? "LOW" : "HIGH",
          crustalMagneticFieldNt: 42,
          surfaceRadiationMSvSol: 0.64,
        });
      }
    };

    animFrame = requestAnimationFrame(animateFlight);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [aerialFlightTarget, currentSite, currentSol, onAerialFlightComplete, onAerialTelemetryUpdate]);

  // Update cursor style depending on active MMGIS tool
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvas();
    if (activeMmgisTool !== "none") {
      canvas.style.cursor = "crosshair";
    } else {
      canvas.style.cursor = "";
    }
  }, [activeMmgisTool]);

  // Click handler on map (Dispatches based on active MMGIS tool)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const lon = Number(e.lngLat.lng.toFixed(4));
      const lat = Number(e.lngLat.lat.toFixed(4));

      // 1. MMGIS Elevation Measure Transect Tool
      if (activeMmgisTool === "measure") {
        const nextPoints: [number, number][] = [...measurePoints, [lon, lat]];
        onUpdateMeasurePoints?.(nextPoints);
        if (nextPoints.length >= 2) {
          const profile = computeElevationProfile(nextPoints, 60, currentSite);
          onProfileGenerated?.(profile);
        }
        return;
      }

      // 2. MMGIS 360° Viewshed Tool
      if (activeMmgisTool === "viewshed") {
        const viewshedFeat = computeViewshed360([lon, lat], 3.0, 36, currentSite);
        const source = map.getSource("mmgis_viewshed_source") as maplibregl.GeoJSONSource | undefined;
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: [viewshedFeat],
          });
        }

        // Place viewshed observer marker
        if (viewshedMarkerRef.current) {
          viewshedMarkerRef.current.remove();
        }
        const el = document.createElement("div");
        el.className = "select-none";
        el.innerHTML = `
          <div class="flex items-center justify-center px-1.5 py-0.5 bg-[#064e3b] border border-[#10b981] text-[#34d399] font-mono font-bold text-[8px]">
            [ OBS: 3.0 KM VIEWSHED ]
          </div>
        `;
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lon, lat])
          .addTo(map);
        viewshedMarkerRef.current = marker;
        return;
      }

      // 3. MMGIS Zone of Interest (ZOI) Marker Tool
      if (activeMmgisTool === "zoi") {
        const elev = getMartianElevation(lon, lat, currentSite);
        const nextZoi: ZoiFeature = {
          id: `zoi_${Date.now()}`,
          name: `ZOI-${String((zoiList?.length || 0) + 1).padStart(2, "0")}`,
          coordinates: [lon, lat],
          elevationM: elev,
          createdAtSol: 4180,
          notes: `Tactical research waypoint recorded at ${lat}°, ${lon}°`,
        };
        onAddZoi?.(nextZoi);
        return;
      }

      // 4. Default: MMGIS Feature Identifier & User pin drop
      const siteWaypoints = getWaypointsForSite(currentSite);

      let matchedWp: MountSharpWaypoint | undefined;
      let minDistance = 0.025; // ~1.5 km tolerance
      for (const wp of siteWaypoints) {
        const d = Math.hypot(wp.coordinates[0] - lon, wp.coordinates[1] - lat);
        if (d < minDistance) {
          minDistance = d;
          matchedWp = wp;
        }
      }

      const approxElev = getMartianElevation(lon, lat, currentSite);
      const approxSlope = getMartianSlope(lon, lat, currentSite);

      const rendered = map.queryRenderedFeatures(e.point);
      const geoFeature = rendered.find(
        (f) => f.properties && (f.properties.unit_name || f.properties.name)
      );
      const unitName =
        (geoFeature?.properties?.unit_name as string) ||
        (currentSite === "jezero_crater"
          ? "Deltaic Stratified Sediment Unit"
          : "Mt Sharp Flank Layered Sulfate Unit");

      const feat: IdentifiedFeatureInfo = matchedWp
        ? {
            name: matchedWp.name,
            category: matchedWp.category.toUpperCase().replace("_", " "),
            stratigraphicAge:
              matchedWp.stratigraphicAge ||
              (currentSite === "jezero_crater"
                ? "Noachian / Early Hesperian"
                : "Hesperian / Amazonian"),
            elevationM: matchedWp.elevationM,
            slopeDeg: approxSlope,
            mineralogy: matchedWp.dominantHydratedMineral || "Phyllosilicates / Clay-Sulfate",
            coordinates: matchedWp.coordinates,
            associatedWaypoint: matchedWp,
            surfaceFirmness: matchedWp.surfaceFirmness,
            sandTrapRisk: matchedWp.sandTrapRisk,
            crustalMagneticFieldNt: matchedWp.crustalMagneticFieldNt,
            surfaceRadiationMSvSol: matchedWp.surfaceRadiationMSvSol,
          }
        : {
            name: unitName,
            category: "MARTIAN REGOLITH / BEDROCK",
            stratigraphicAge:
              currentSite === "jezero_crater" ? "Noachian (~3.8 Ga)" : "Hesperian (~3.3 Ga)",
            elevationM: approxElev,
            slopeDeg: approxSlope,
            mineralogy:
              currentSite === "jezero_crater"
                ? "Olivine-Carbonate & Smectite Clays"
                : "Hematite, Sulfates & Amorphous Silica",
            coordinates: [lon, lat],
            associatedWaypoint: siteWaypoints[0],
            surfaceFirmness: approxElev > -4100 ? "BEDROCK FIRM" : "SOFT SAND TRAP RISK",
            sandTrapRisk: approxElev > -4100 ? "LOW" : "HIGH",
            crustalMagneticFieldNt: 38,
            surfaceRadiationMSvSol: 0.65,
          };

      setIdentifiedFeature(feat);
      onFeatureIdentified?.(feat);

      if (onMapClickCoordinate) {
        onMapClickCoordinate([lon, lat], approxElev);
      }
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [
    activeMmgisTool,
    measurePoints,
    currentSite,
    onUpdateMeasurePoints,
    onProfileGenerated,
    zoiList,
    onAddZoi,
    onMapClickCoordinate,
  ]);

  // Sync Measure Transect Line Source & Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("mmgis_measure_source") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    measureMarkersRef.current.forEach((m) => m.remove());
    measureMarkersRef.current = [];

    if (measurePoints.length >= 2) {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: measurePoints,
            },
          },
        ],
      });
    } else {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }

    // Render vertex distance tags along measure path
    let cumulativeDistKm = 0;
    measurePoints.forEach((pt, idx) => {
      if (idx > 0) {
        const prev = measurePoints[idx - 1];
        const d = Math.sqrt(
          Math.pow((pt[0] - prev[0]) * 59.16, 2) + Math.pow((pt[1] - prev[1]) * 59.16, 2)
        );
        cumulativeDistKm += d;
      }
      const el = document.createElement("div");
      el.className = "select-none";
      el.innerHTML = `
        <div class="px-1.5 py-0.2 bg-[#083344] border border-[#06b6d4] text-[#a5f3fc] font-mono font-bold text-[8px] whitespace-nowrap">
          #${idx + 1} (${cumulativeDistKm.toFixed(1)} km)
        </div>
      `;
      const m = new maplibregl.Marker({ element: el })
        .setLngLat(pt)
        .addTo(map);
      measureMarkersRef.current.push(m);
    });
  }, [measurePoints, mapLoaded]);

  // Sync ZOI Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    zoiMarkersRef.current.forEach((m) => m.remove());
    zoiMarkersRef.current = [];

    zoiList.forEach((zoi) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer select-none group";
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center px-1.5 py-0.5 bg-[#78350f] border border-[#f59e0b] text-[#fef3c7] text-[9px] font-mono font-bold shadow-none transition-transform group-hover:scale-105">
            ${zoi.name}
          </div>
          <div class="absolute -bottom-3 whitespace-nowrap px-1 bg-[#0b0f17] text-amber-300 border border-amber-500/80 text-[7px] font-mono font-bold">
            ${zoi.elevationM}M
          </div>
        </div>
      `;
      const m = new maplibregl.Marker({ element: el })
        .setLngLat(zoi.coordinates)
        .addTo(map);
      zoiMarkersRef.current.push(m);
    });
  }, [zoiList, mapLoaded]);

  // Dynamic Opacity Synchronization
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const opacities = {
      layer_optical_geologic: layerOpacities.layer_optical_geologic ?? 0.8,
      layer_topographic_hazard: layerOpacities.layer_topographic_hazard ?? 0.8,
      layer_thermal_subsurface: layerOpacities.layer_thermal_subsurface ?? 0.8,
      layer_science_mineral: layerOpacities.layer_science_mineral ?? 0.8,
      layer_safety_magnetic: layerOpacities.layer_safety_magnetic ?? 0.8,
    };

    if (map.getLayer("geology_fills")) {
      map.setPaintProperty(
        "geology_fills",
        "fill-opacity",
        Math.min(0.25, 0.12 * (opacities.layer_optical_geologic / 0.8))
      );
    }
    if (map.getLayer("geology_borders")) {
      map.setPaintProperty(
        "geology_borders",
        "line-opacity",
        Math.min(0.85, 0.65 * (opacities.layer_optical_geologic / 0.8))
      );
    }
    if (map.getLayer("hazard_slopes")) {
      map.setPaintProperty(
        "hazard_slopes",
        "line-opacity",
        Math.min(0.85, 0.7 * (opacities.layer_topographic_hazard / 0.8))
      );
    }
    if (map.getLayer("thermal_subsurface_circles")) {
      map.setPaintProperty(
        "thermal_subsurface_circles",
        "fill-opacity",
        Math.min(0.3, 0.14 * (opacities.layer_thermal_subsurface / 0.8))
      );
    }
    if (map.getLayer("science_mineral_fills")) {
      map.setPaintProperty(
        "science_mineral_fills",
        "fill-opacity",
        Math.min(0.25, 0.12 * (opacities.layer_science_mineral / 0.8))
      );
    }
    if (map.getLayer("safety_magnetic_fills")) {
      map.setPaintProperty(
        "safety_magnetic_fills",
        "fill-opacity",
        Math.min(0.22, 0.10 * (opacities.layer_safety_magnetic / 0.8))
      );
    }
    if (map.getLayer("mars-raster-hirise")) {
      map.setPaintProperty(
        "mars-raster-hirise",
        "raster-opacity",
        0.88 * opacities.layer_optical_geologic
      );
    }
  }, [layerOpacities, mapLoaded]);

  // Sync background color with theme
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer("background-mars-space")) {
      map.setPaintProperty(
        "background-mars-space",
        "background-color",
        isDark ? "#06080d" : "#f1f5f9"
      );
    }
    if (map.getLayer("mars-true-color-underlay")) {
      map.setPaintProperty(
        "mars-true-color-underlay",
        "background-color",
        isDark ? "#8f371a" : "#b44c28"
      );
    }
  }, [isDark, mapLoaded]);

  // Update pitch when pitch3D prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ pitch: pitch3D ? 55 : 0, duration: 500 });
  }, [pitch3D]);

  // Reset North when trigger increments
  useEffect(() => {
    const map = mapRef.current;
    if (!map || resetNorthTrigger === 0) return;
    map.easeTo({ bearing: 0, duration: 500 });
  }, [resetNorthTrigger]);

  // Re-center mission site on trigger
  useEffect(() => {
    const map = mapRef.current;
    if (!map || reCenterTrigger === 0) return;
    const center = currentSite === "jezero_crater" ? JEZERO_CRATER_CENTER : MOUNT_SHARP_CENTER;
    const zoom = currentSite === "jezero_crater" ? JEZERO_DEFAULT_ZOOM : MOUNT_SHARP_DEFAULT_ZOOM;
    map.flyTo({ center, zoom, duration: 1000 });
  }, [reCenterTrigger, currentSite]);

  // Sync Layer Visibility Toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("geology_fills")) {
      map.setLayoutProperty(
        "geology_fills",
        "visibility",
        activeLayers["layer_optical_geologic"] ? "visible" : "none"
      );
    }
    if (map.getLayer("geology_borders")) {
      map.setLayoutProperty(
        "geology_borders",
        "visibility",
        activeLayers["layer_optical_geologic"] ? "visible" : "none"
      );
    }
    if (map.getLayer("hazard_slopes")) {
      map.setLayoutProperty(
        "hazard_slopes",
        "visibility",
        activeLayers["layer_topographic_hazard"] ? "visible" : "none"
      );
    }
    if (map.getLayer("thermal_subsurface_circles")) {
      map.setLayoutProperty(
        "thermal_subsurface_circles",
        "visibility",
        activeLayers["layer_thermal_subsurface"] ? "visible" : "none"
      );
    }
    if (map.getLayer("science_mineral_fills")) {
      map.setLayoutProperty(
        "science_mineral_fills",
        "visibility",
        activeLayers["layer_science_mineral"] ? "visible" : "none"
      );
    }
    if (map.getLayer("safety_magnetic_fills")) {
      map.setLayoutProperty(
        "safety_magnetic_fills",
        "visibility",
        activeLayers["layer_safety_magnetic"] ? "visible" : "none"
      );
    }
  }, [activeLayers, mapLoaded]);

  // Reactive NASA Mars Trek Satellite Imagery Synchronization
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // 1. Viking MDIM 2.1 Basemap (always visible as global underlay)
    if (map.getLayer("mars-raster-viking")) {
      map.setLayoutProperty("mars-raster-viking", "visibility", "visible");
    }

    const isMola = orbitalSource === "mola_hrsc";
    const isThemis = orbitalSource === "themis_night";
    const isOptical = orbitalSource === "jpl_hirise" || orbitalSource === "opm_basemap" || !orbitalSource;

    // 2. MOLA Shaded Relief
    if (map.getLayer("mars-raster-mola")) {
      map.setLayoutProperty(
        "mars-raster-mola",
        "visibility",
        isMola ? "visible" : "none"
      );
      map.setPaintProperty(
        "mars-raster-mola",
        "raster-opacity",
        isMola ? 0.85 : 0
      );
    }

    // 3. THEMIS Night IR
    if (map.getLayer("mars-raster-themis-night")) {
      map.setLayoutProperty(
        "mars-raster-themis-night",
        "visibility",
        isThemis ? "visible" : "none"
      );
      map.setPaintProperty(
        "mars-raster-themis-night",
        "raster-opacity",
        isThemis ? 0.85 : 0
      );
    }

    // 4. Gale CTX Mosaic (6m/px)
    if (map.getLayer("mars-raster-ctx-gale")) {
      const isVisible = currentSite === "gale_crater";
      map.setLayoutProperty(
        "mars-raster-ctx-gale",
        "visibility",
        isVisible ? "visible" : "none"
      );
      map.setPaintProperty(
        "mars-raster-ctx-gale",
        "raster-opacity",
        isOptical ? 1.0 : 0.35
      );
    }

    // 5. Jezero CTX Mosaic (6m/px)
    if (map.getLayer("mars-raster-ctx-jezero")) {
      const isVisible = currentSite === "jezero_crater";
      map.setLayoutProperty(
        "mars-raster-ctx-jezero",
        "visibility",
        isVisible ? "visible" : "none"
      );
      map.setPaintProperty(
        "mars-raster-ctx-jezero",
        "raster-opacity",
        isOptical ? 1.0 : 0.35
      );
    }
  }, [orbitalSource, tileMode, currentSite, mapLoaded]);

  // Sync Rover Historical Traverse (Curiosity vs Perseverance) Visibility, Coordinates & Sol Scrubber
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const vis = showRoverTraverse ? "visible" : "none";
    const isGale = currentSite === "gale_crater";

    // 1. Update rover traverse LineString filtered by currentSol (ATM MMGIS trimLineString)
    const source = map.getSource("curiosity_traverse_source") as maplibregl.GeoJSONSource | undefined;
    const activeTraverse = getRoverTraverseForSite(currentSite);
    const filteredPoints = activeTraverse.filter((p) => p.sol <= effectiveSol);
    const coordinates = filteredPoints.length > 0
      ? filteredPoints.map((p) => p.coordinates)
      : (activeTraverse.length > 0 ? [activeTraverse[0].coordinates] : []);

    if (source) {
      source.setData({
        type: "Feature",
        properties: { name: `${currentSite} Rover Historical Traverse` },
        geometry: {
          type: "LineString",
          coordinates,
        },
      });
    }

    // 2. Active Rover Vehicle Marker Pin at currentSol position
    const currentPoint = [...activeTraverse].reverse().find((p) => p.sol <= effectiveSol) || activeTraverse[0];
    if (currentPoint) {
      if (!roverActiveMarkerRef.current) {
        const roverEl = document.createElement("div");
        roverEl.className = "select-none pointer-events-none";
        roverEl.innerHTML = `
          <div class="relative flex flex-col items-center -translate-y-2">
            <div class="w-6 h-6 rounded-full bg-[#facc15] border-2 border-[#07090e] flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.9)] animate-pulse">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#07090e">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
            <div class="mt-1 px-1.5 py-0.5 bg-[#07090e] border border-yellow-400 text-yellow-300 font-mono text-[8px] font-bold tracking-wider whitespace-nowrap shadow-md">
              ${currentSite === "jezero_crater" ? "PERSEVERANCE" : "CURIOSITY"} // SOL ${effectiveSol}
            </div>
          </div>
        `;
        roverActiveMarkerRef.current = new maplibregl.Marker({ element: roverEl })
          .setLngLat(currentPoint.coordinates)
          .addTo(map);
      } else {
        roverActiveMarkerRef.current.setLngLat(currentPoint.coordinates);
        const labelEl = roverActiveMarkerRef.current.getElement().querySelector("div.mt-1");
        if (labelEl) {
          labelEl.textContent = `${currentSite === "jezero_crater" ? "PERSEVERANCE" : "CURIOSITY"} // SOL ${effectiveSol}`;
        }
      }
    }

    // Landing ellipse only displayed for Gale Crater (Bradbury Landing)
    if (map.getLayer("curiosity_ellipse_fill")) {
      map.setLayoutProperty("curiosity_ellipse_fill", "visibility", isGale && showRoverTraverse ? "visible" : "none");
    }
    if (map.getLayer("curiosity_ellipse_line")) {
      map.setLayoutProperty("curiosity_ellipse_line", "visibility", isGale && showRoverTraverse ? "visible" : "none");
    }
    if (map.getLayer("curiosity_traverse_casing")) {
      map.setLayoutProperty("curiosity_traverse_casing", "visibility", vis);
    }
    if (map.getLayer("curiosity_traverse_line")) {
      map.setLayoutProperty("curiosity_traverse_line", "visibility", vis);
    }

    curiosityMarkersRef.current.forEach((m) => {
      const el = m.getElement();
      if (el) el.style.display = showRoverTraverse ? "block" : "none";
    });
  }, [showRoverTraverse, currentSite, currentSol, mapLoaded]);

  // Sync MMGIS Graticule Grid Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("mmgis_graticule_source") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      const centerCoords = currentSite === "jezero_crater" ? JEZERO_CRATER_CENTER : MOUNT_SHARP_CENTER;
      source.setData(generateMartianGraticule(centerCoords[0], centerCoords[1]));
    }
    if (map.getLayer("mmgis_graticule_line")) {
      map.setLayoutProperty(
        "mmgis_graticule_line",
        "visibility",
        showGraticule ? "visible" : "none"
      );
    }
  }, [showGraticule, currentSite, mapLoaded]);

  // Render Marswalk Path on Route Calculation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("marswalk_route_source") as maplibregl.GeoJSONSource | undefined;
    const altSource = map.getSource("marswalk_route_alt_source") as maplibregl.GeoJSONSource | undefined;
    const dotsSource = map.getSource("marswalk_route_dots_source") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    // Remove previous dynamic markers
    routeMilestoneMarkersRef.current.forEach((m) => m.remove());
    routeMilestoneMarkersRef.current = [];
    routeBadgeMarkersRef.current.forEach((m) => m.remove());
    routeBadgeMarkersRef.current = [];

    if (activeRoute && activeRoute.pathCoordinates.length > 1) {
      // 1. Populate Primary Route with high-resolution continuous Catmull-Rom spline (85+ coordinates)
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              color: "#10b981",
              name: "RUTE TERAMAN (UTAMA)",
            },
            geometry: {
              type: "LineString",
              coordinates: activeRoute.pathCoordinates.map((c) => [c[0], c[1]]),
            },
          },
        ],
      } as any);

      // 2. Populate Alternative Route (Route 2 - Dashed Amber)
      if (altSource) {
        if (activeRoute.alternativeRoute && activeRoute.alternativeRoute.pathCoordinates.length > 1) {
          altSource.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {
                  color: "#f59e0b",
                  name: activeRoute.alternativeRoute.label,
                },
                geometry: {
                  type: "LineString",
                  coordinates: activeRoute.alternativeRoute.pathCoordinates.map((c) => [c[0], c[1]]),
                },
              },
            ],
          } as any);
        } else {
          altSource.setData({
            type: "FeatureCollection",
            features: [],
          } as any);
        }
      }

      // 3. Populate 5m high-density sampling nodes (Image 2 MMGIS standard)
      if (dotsSource) {
        if (activeRoute.highDensityRoutePoints && activeRoute.highDensityRoutePoints.length > 0) {
          dotsSource.setData({
            type: "FeatureCollection",
            features: activeRoute.highDensityRoutePoints.map((pt) => {
              const dotColor =
                pt.slopeCategory === "HAZARD"
                  ? "#ef4444"
                  : pt.slopeCategory === "CAUTION"
                    ? "#f59e0b"
                    : "#ffffff";
              return {
                type: "Feature",
                properties: {
                  distanceM: pt.cumulativeDistanceM,
                  slopeDeg: pt.slopeDeg,
                  color: dotColor,
                },
                geometry: {
                  type: "Point",
                  coordinates: pt.coordinates,
                },
              };
            }),
          } as any);
        } else {
          dotsSource.setData({
            type: "FeatureCollection",
            features: [],
          });
        }
      }

      // 4. Render Floating Midpoint Badges (Google Maps Directions aesthetic)
      // Primary Route Badge (Safe Route)
      const midIdx = Math.floor(activeRoute.pathCoordinates.length / 2);
      const primaryMid = activeRoute.pathCoordinates[midIdx];
      const maxSlope = activeRoute.safetyRationale?.slopeAnalysis?.maxSlopeDeg?.toFixed(1) || "7.2";
      const primaryBadgeEl = document.createElement("div");
      primaryBadgeEl.className = "select-none pointer-events-auto cursor-pointer";
      primaryBadgeEl.innerHTML = `
        <div class="px-2.5 py-1 bg-[#064e3b]/95 border-2 border-[#10b981] text-[#34d399] font-mono font-bold text-[9px] shadow-[0_4px_16px_rgba(16,185,129,0.7)] flex items-center gap-1.5 whitespace-nowrap -translate-y-2">
          <span class="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
          <span>RUTE AMAN • ${activeRoute.totalDistanceKm} KM • LERENG MAKS ${maxSlope}°</span>
        </div>
      `;
      const primaryMarker = new maplibregl.Marker({ element: primaryBadgeEl })
        .setLngLat([primaryMid[0], primaryMid[1]])
        .addTo(map);
      routeBadgeMarkersRef.current.push(primaryMarker);

      // Alternative Route Badge
      if (activeRoute.alternativeRoute && activeRoute.alternativeRoute.pathCoordinates.length > 1) {
        const altMidIdx = Math.floor(activeRoute.alternativeRoute.pathCoordinates.length / 2);
        const altMid = activeRoute.alternativeRoute.pathCoordinates[altMidIdx];
        const altBadgeEl = document.createElement("div");
        altBadgeEl.className = "select-none pointer-events-auto cursor-pointer";
        altBadgeEl.innerHTML = `
          <div class="px-2.5 py-1 bg-[#78350f]/95 border-2 border-[#f59e0b] text-[#fde68a] font-mono font-bold text-[9px] shadow-[0_4px_16px_rgba(245,158,11,0.7)] flex items-center gap-1.5 whitespace-nowrap -translate-y-2">
            <span class="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
            <span>${activeRoute.alternativeRoute.label} • ${activeRoute.alternativeRoute.sublabel}</span>
          </div>
        `;
        const altMarker = new maplibregl.Marker({ element: altBadgeEl })
          .setLngLat([altMid[0], altMid[1]])
          .addTo(map);
        routeBadgeMarkersRef.current.push(altMarker);
      }

      // 5. Render 3D Holographic Start & Target Beacon Markers
      if (routeStartMarkerRef.current) {
        routeStartMarkerRef.current.remove();
        routeStartMarkerRef.current = null;
      }
      if (routeTargetMarkerRef.current) {
        routeTargetMarkerRef.current.remove();
        routeTargetMarkerRef.current = null;
      }

      // 3D Start Beacon (Base Station)
      const startEl = document.createElement("div");
      startEl.className = "select-none pointer-events-none";
      startEl.innerHTML = `
        <div class="relative flex flex-col items-center -translate-y-5">
          <div class="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#064e3b] text-[#34d399] border-2 border-[#10b981] font-mono font-bold text-[9px] shadow-[0_0_14px_rgba(16,185,129,0.9)]">
            <svg class="w-3 h-3 text-[#34d399] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span>[ START: ${activeRoute.startWaypoint.name.toUpperCase().slice(0, 20)} ]</span>
          </div>
          <div class="w-0.5 h-3 bg-[#10b981]"></div>
          <div class="w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#07090e] shadow-[0_0_8px_rgba(16,185,129,0.9)]"></div>
        </div>
      `;
      routeStartMarkerRef.current = new maplibregl.Marker({ element: startEl })
        .setLngLat(activeRoute.startWaypoint.coordinates)
        .addTo(map);

      // 3D Target Objective Beacon
      const targetEl = document.createElement("div");
      targetEl.className = "select-none pointer-events-none";
      targetEl.innerHTML = `
        <div class="relative flex flex-col items-center -translate-y-5">
          <div class="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#78350f] text-[#fde68a] border-2 border-[#f59e0b] font-mono font-bold text-[9px] shadow-[0_0_14px_rgba(245,158,11,0.9)]">
            <svg class="w-3 h-3 text-[#f59e0b] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="2" /></svg>
            <span>[ TARGET: ${activeRoute.targetWaypoint.name.toUpperCase().slice(0, 20)} ]</span>
          </div>
          <div class="w-0.5 h-3 bg-[#f59e0b]"></div>
          <div class="w-3 h-3 rounded-full bg-[#f59e0b] border-2 border-[#07090e] shadow-[0_0_8px_rgba(245,158,11,0.9)]"></div>
        </div>
      `;
      routeTargetMarkerRef.current = new maplibregl.Marker({ element: targetEl })
        .setLngLat(activeRoute.targetWaypoint.coordinates)
        .addTo(map);

      // Auto-fit camera comfortably close to the route with 3D pitch perspective
      if (activeRoute.pathCoordinates.length > 1) {
        const lons = activeRoute.pathCoordinates.map((c) => c[0]);
        const lats = activeRoute.pathCoordinates.map((c) => c[1]);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        map.fitBounds(
          [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
          {
            padding: { top: 90, bottom: 200, left: 100, right: 100 },
            maxZoom: 15.0,
            duration: 900,
            pitch: 48,
          }
        );
      }
    } else {
      if (routeStartMarkerRef.current) {
        routeStartMarkerRef.current.remove();
        routeStartMarkerRef.current = null;
      }
      if (routeTargetMarkerRef.current) {
        routeTargetMarkerRef.current.remove();
        routeTargetMarkerRef.current = null;
      }

      source.setData({
        type: "FeatureCollection",
        features: [],
      });
      if (altSource) {
        altSource.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
      if (dotsSource) {
        dotsSource.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    }
  }, [activeRoute, mapLoaded]);  // Synchronized Scrubbing Cursor Marker along Route (NASA MMGIS Ref 4)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (scrubMarkerRef.current) {
      scrubMarkerRef.current.remove();
      scrubMarkerRef.current = null;
    }

    if (hoveredRoutePoint) {
      const el = document.createElement("div");
      el.className = "select-none pointer-events-none";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-4 h-4 rounded-full bg-yellow-400 border-2 border-[#07090e] shadow-[0_0_12px_rgba(250,204,21,0.9)] animate-ping absolute"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-[#07090e] shadow-[0_0_8px_rgba(250,204,21,0.8)] z-10"></div>
          <div class="absolute -top-7 whitespace-nowrap bg-[#0b0f17] border border-yellow-400 text-yellow-300 font-mono font-bold text-[9px] px-1.5 py-0.5 z-20 shadow-lg">
            ${hoveredRoutePoint.cumulativeDistanceM}m [${hoveredRoutePoint.slopeDeg}°]
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(hoveredRoutePoint.coordinates)
        .addTo(map);

      scrubMarkerRef.current = marker;
    }
  }, [hoveredRoutePoint]);

  // Render Flat Scientific Waypoint Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Combine site waypoints with custom 360 waypoints (avoiding duplicate markers at same coordinates)
    const siteWaypoints = getWaypointsForSite(currentSite);
    const combinedWaypoints = [...siteWaypoints];
    custom360Waypoints.forEach((cwp) => {
      const idx = combinedWaypoints.findIndex(
        (w) =>
          w.id === cwp.id ||
          (Math.abs(w.coordinates[0] - cwp.coordinates[0]) < 0.002 &&
            Math.abs(w.coordinates[1] - cwp.coordinates[1]) < 0.002)
      );
      if (idx >= 0) {
        combinedWaypoints[idx] = {
          ...combinedWaypoints[idx],
          ...cwp,
          has360Pov: true,
          name: combinedWaypoints[idx].name, // Keep clean canonical name
        };
      } else {
        combinedWaypoints.push(cwp);
      }
    });

    combinedWaypoints.forEach((wp, idx) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer select-none group";

      const isSelected = selectedWaypoint?.id === wp.id;
      const has360 = wp.has360Pov || !!(wp as any).customPanoramaUrl;
      const wpNumber = idx + 1;

      // Compact Circular Marker: Only show Camera Icon + 360 if has 360 view; otherwise simple clean waypoint dot
      if (has360) {
        el.innerHTML = `
          <div class="relative flex flex-col items-center group" title="${wp.name} (360° POV)">
            <div class="flex items-center justify-center gap-1 px-1.5 h-6 rounded-full bg-[#083344] text-[#38bdf8] border-2 ${
              isSelected ? "border-cyan-300 ring-2 ring-cyan-400" : "border-[#06b6d4]"
            } font-mono font-bold text-[9px] shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-transform group-hover:scale-115">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
              </svg>
              <span>360</span>
            </div>
            <div class="w-0.5 h-1.5 bg-[#06b6d4] -mt-0.5"></div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="relative flex flex-col items-center group" title="${wp.name}">
            <div class="flex items-center justify-center w-5 h-5 rounded-full ${
              isSelected
                ? "bg-amber-400 text-slate-950 border-2 border-amber-200 ring-2 ring-amber-500"
                : "bg-[#111827] text-slate-300 border border-slate-600"
            } font-mono font-bold text-[8px] shadow-sm transition-transform group-hover:scale-115">
              <span>${wpNumber}</span>
            </div>
            <div class="w-0.5 h-1 ${isSelected ? "bg-amber-400" : "bg-slate-600"} -mt-0.5"></div>
          </div>
        `;
      }

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectWaypoint(wp);
        const approxSlope = (wp as any).slopeDeg ?? getMartianSlope(wp.coordinates[0], wp.coordinates[1], currentSite);
        setIdentifiedFeature({
          name: wp.name,
          category: wp.category.toUpperCase().replace("_", " "),
          stratigraphicAge: wp.stratigraphicAge || (currentSite === "jezero_crater" ? "Noachian / Early Hesperian" : "Hesperian / Amazonian"),
          elevationM: wp.elevationM,
          slopeDeg: approxSlope,
          mineralogy: wp.dominantHydratedMineral || (wp as any).dominantMineral || "Phyllosilicates / Clay-Sulfate",
          coordinates: wp.coordinates,
          associatedWaypoint: wp,
          surfaceFirmness: wp.surfaceFirmness,
          sandTrapRisk: wp.sandTrapRisk,
          crustalMagneticFieldNt: wp.crustalMagneticFieldNt,
          surfaceRadiationMSvSol: wp.surfaceRadiationMSvSol,
          laymanDescription: getFeatureLaymanDescription(wp.name, wp.category, approxSlope),
          temperatureRange: "-75°C s.d. -15°C",
        });
        map.flyTo({ center: wp.coordinates, zoom: 12.8, duration: 600 });
      });

      // Double-click or clicking on a 360 waypoint directly launches 360 POV Modal
      if (has360) {
        el.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          onOpenPovModal?.(wp);
        });
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(wp.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [selectedWaypoint, onSelectWaypoint, onOpenPovModal, isDark, custom360Waypoints, currentSite, mapLoaded]);

  // Render Martian Topographic Landmarks & Geomorphic Formations (Ref Image 2 & 3 Standard)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    landmarkMarkersRef.current.forEach((m) => m.remove());
    landmarkMarkersRef.current = [];

    const landmarks = currentSite === "gale_crater"
      ? [
          { name: "MOUNT SHARP SUMMIT", sub: "AEOLIS MONS // -3,912M", coords: [137.8414, -5.4453] as [number, number] },
          { name: "GEDIZ VALLIS CANYON", sub: "DEBRIS FLOW CHANNEL", coords: [137.7120, -5.2150] as [number, number] },
        ]
      : [
          { name: "JEZERO DELTA SCARP", sub: "ANCIENT RIVER DELTA FRONT", coords: [77.4042, 18.4410] as [number, number] },
          { name: "BELVA IMPACT CRATER", sub: "SUB-BASIN EXCAVATION", coords: [77.3620, 18.3840] as [number, number] },
        ];

    landmarks.forEach((lm) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer select-none flex flex-col items-center group";
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950 shadow-sm transition-transform group-hover:scale-130"></div>
          <div class="absolute -bottom-6 whitespace-nowrap px-1.5 py-0.5 bg-[#07090e] border border-slate-700 text-[8px] font-mono font-bold tracking-wider text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-md">
            <span>${lm.name}</span>
          </div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const elev = getMartianElevation(lm.coords[0], lm.coords[1], currentSite);
        const slope = getMartianSlope(lm.coords[0], lm.coords[1], currentSite);
        setIdentifiedFeature({
          name: lm.name,
          category: "TOPOGRAPHIC LANDMARK",
          stratigraphicAge: lm.sub,
          elevationM: elev,
          slopeDeg: slope,
          mineralogy: "Regional Geologic Bedrock Formation",
          coordinates: lm.coords,
          surfaceFirmness: elev > -4100 ? "BEDROCK FIRM" : "SOFT SAND TRAP RISK",
          sandTrapRisk: elev > -4100 ? "LOW" : "HIGH",
          crustalMagneticFieldNt: 42,
          surfaceRadiationMSvSol: 0.64,
        });
        map.flyTo({ center: lm.coords, zoom: 12.8, duration: 600 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(lm.coords)
        .addTo(map);
      landmarkMarkersRef.current.push(marker);
    });
  }, [currentSite, mapLoaded]);

  // Render Custom Click Pin Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (customMarkerRef.current) {
      customMarkerRef.current.remove();
      customMarkerRef.current = null;
    }

    if (customPinCoords) {
      const el = document.createElement("div");
      el.className = "cursor-pointer select-none";
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center w-7 h-7 bg-[#b45309] border border-[#fbbf24] text-white text-[10px] font-mono font-black shadow-none animate-pulse">
            ${t("pin")}
          </div>
          <div class="absolute -bottom-4 whitespace-nowrap px-1 py-0.2 ${isDark ? "bg-[#111827] text-amber-300 border-amber-400" : "bg-white text-amber-700 border-amber-500"
        } border text-[8px] font-mono font-bold tracking-wider">
            ${t("customTarget")}
          </div>
        </div>
      `;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(customPinCoords)
        .addTo(map);
      customMarkerRef.current = marker;
    }
  }, [customPinCoords, isDark, t]);

  // Render Rover Historical Sol Checkpoints (Curiosity & Perseverance ala MMGIS)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    curiosityMarkersRef.current.forEach((m) => m.remove());
    curiosityMarkersRef.current = [];

    const activeTraverse = getRoverTraverseForSite(currentSite);

    activeTraverse.forEach((pt) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer select-none group";
      el.style.display = showRoverTraverse ? "block" : "none";
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="w-1.5 h-1.5 rounded-full bg-slate-400 border border-slate-900 opacity-60 transition-transform group-hover:scale-125 group-hover:opacity-100"></div>
          <div class="absolute -bottom-3 whitespace-nowrap text-slate-400 font-mono font-medium text-[7px] tracking-tight opacity-50 group-hover:opacity-100">
            SOL ${pt.sol}
          </div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const elev = getMartianElevation(pt.coordinates[0], pt.coordinates[1], currentSite);
        const slope = getMartianSlope(pt.coordinates[0], pt.coordinates[1], currentSite);
        setIdentifiedFeature({
          name: `Sol ${pt.sol}: ${pt.name}`,
          category: "ROVER TRAVERSE CHECKPOINT",
          stratigraphicAge: `Sol ${pt.sol} Mission Milestone`,
          elevationM: elev,
          slopeDeg: slope,
          mineralogy: "Proven Safe Rover Surface Corridor",
          coordinates: pt.coordinates,
          surfaceFirmness: "BEDROCK FIRM",
          sandTrapRisk: "LOW",
          crustalMagneticFieldNt: 39,
          surfaceRadiationMSvSol: 0.63,
        });
        map.flyTo({ center: pt.coordinates, zoom: 13, duration: 600 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(pt.coordinates)
        .addTo(map);

      curiosityMarkersRef.current.push(marker);
    });
  }, [showRoverTraverse, currentSite, isDark, mapLoaded]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${isDark ? "bg-[#07090e]" : "bg-slate-100"}`}>
      {/* Active Tool Floating Banner (Appears ONLY when Measure / Viewshed / ZOI is active) */}
      {activeMmgisTool !== "none" && (
        <div
          className={`absolute top-3 z-20 flex items-center gap-2 font-mono text-[10px] transition-all duration-200 select-none ${isLeftDrawerOpen ? "left-4 sm:left-[416px]" : "left-4 sm:left-[64px]"
            }`}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#07090e] border border-cyan-400 text-cyan-300 font-bold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>
              {activeMmgisTool === "measure" && (
                <>
                  {tMmgis("activeMeasuringPill")}
                  {measurePoints.length > 0 && ` (${measurePoints.length} NODES)`}
                </>
              )}
              {activeMmgisTool === "viewshed" && tMmgis("activeViewshedPill")}
              {activeMmgisTool === "zoi" && tMmgis("activeZoiPill")}
            </span>
            <button
              onClick={() => onSelectMmgisTool?.("none")}
              className="ml-2 px-1.5 py-0.5 bg-red-950/80 border border-red-500 text-red-300 hover:bg-red-900 transition-colors"
              title="Deactivate Tool"
            >
              {tMmgis("doneBtn")}
            </button>
          </div>
        </div>
      )}

      {/* Floating Scientific Map Legend (Ref Image 1: Bioscape / MMGIS Legend Window) */}
      {showFloatingLegend && (
        <div
          className={`absolute top-12 right-4 z-20 w-64 border font-mono select-none shadow-xl ${isDark
            ? "bg-[#0b0f17] border-slate-700 text-slate-200"
            : "bg-white border-slate-300 text-slate-800"
            }`}
        >
          <div className="flex items-center justify-between px-2.5 py-1 bg-[#0b0f17] border-b border-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-1.5 h-1.5 bg-amber-400" />
              <span>LEGEND</span>
            </span>
            <button
              onClick={() => onToggleFloatingLegend?.()}
              className="text-slate-400 hover:text-white px-1 text-[11px]"
            >
              ✕
            </button>
          </div>
          <div className="p-2.5 space-y-2 text-[9px]">
            <div>
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Topography &amp; Mobility Hazard
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 shrink-0 bg-[#22c55e] border border-black/40" />
                  <span className="text-slate-200">Safe Walk (&lt;15°)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 shrink-0 bg-[#eab308] border border-black/40" />
                  <span className="text-slate-200">Suit Caution (15°-25°)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 shrink-0 bg-[#ef4444] border border-black/40" />
                  <span className="text-slate-200">Cliff Hazard (&gt;25°)</span>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Thermal &amp; Sand Trap Risk
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 shrink-0 bg-[#0284c7] border border-black/40" />
                  <span className="text-slate-200">[BEDROCK FIRM] (&gt;350 tiu)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 shrink-0 bg-[#ea580c] border border-black/40" />
                  <span className="text-slate-200">[SOFT SAND TRAP RISK]</span>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Hydrated Minerals &amp; Radiation
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 shrink-0 bg-[#06b6d4] border border-black/40" />
                  <span className="text-slate-200">CRISM High Hydration (&gt;6% WEH)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 shrink-0 bg-[#8b5cf6] border border-black/40" />
                  <span className="text-slate-200">MGS MAG Shielding Umbrella</span>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Stations &amp; Traverse Track
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-white border border-slate-900 flex items-center justify-center text-[7px] text-slate-900 font-black shrink-0">
                    <svg className="w-2.5 h-2.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  </span>
                  <span className="text-slate-200">Station Photographic Node</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#083344] border border-[#06b6d4] flex items-center justify-center text-[7px] text-[#22d3ee] font-black shrink-0">
                    360
                  </span>
                  <span className="text-cyan-300 font-bold">360° Spherical Panoramic Station</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                  <span className="text-yellow-300">Curiosity Historical Traverse</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white border border-black shrink-0" />
                  <span className="text-slate-300">5-Meter Path Sampling Nodes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Google Maps Style Clean Search Bar & 1-Click Shortcuts (Top-Left) */}
      <div className="absolute top-3 left-4 z-30 flex flex-col gap-1.5 select-none">
        <div className="relative flex items-center w-72 sm:w-96 bg-[#07090e] border border-slate-700 shadow-xl">
          <div className="pl-3 pr-2 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder={t("searchPlaceholder")}
            className="w-full py-1.5 bg-transparent text-slate-200 font-mono text-[11px] placeholder:text-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsSearchFocused(false);
              }}
              className="px-2 text-slate-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {/* 1-Click Location Shortcut Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[calc(100vw-3rem)] sm:max-w-xl pb-1 scrollbar-none">
          {SEARCH_SHORTCUTS.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (item.site !== currentSite && onChangeSite) {
                  onChangeSite(item.site);
                }
                const map = mapRef.current;
                if (map) {
                  map.flyTo({ center: item.coords, zoom: item.zoom, duration: 1200 });
                }
                const elev = getMartianElevation(item.coords[0], item.coords[1], item.site);
                const slope = getMartianSlope(item.coords[0], item.coords[1], item.site);
                setIdentifiedFeature({
                  name: item.name,
                  category: "MARTIAN LANDMARK",
                  stratigraphicAge: "Martian Geologic Landmark",
                  elevationM: elev,
                  slopeDeg: slope,
                  mineralogy: "Regional Mars Bedrock Formation",
                  coordinates: item.coords,
                  surfaceFirmness: elev > -4100 ? "BEDROCK FIRM" : "SOFT SAND TRAP RISK",
                  sandTrapRisk: elev > -4100 ? "LOW" : "HIGH",
                  crustalMagneticFieldNt: 38,
                  surfaceRadiationMSvSol: 0.65,
                  laymanDescription: item.desc,
                  temperatureRange: "-80°C s.d. -10°C",
                });
                setIsSearchFocused(false);
              }}
              className="shrink-0 px-2.5 py-1 bg-[#0b0f17]/95 hover:bg-[#111827] border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 font-mono text-[9px] font-bold tracking-wider transition-colors shadow-md"
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Novelty Quick Start Navigation Guide stacked neatly below search bar */}
        {!activeRoute && showQuickStartBanner && (
          <div className="mt-1 px-3 py-1.5 bg-[#07090e]/95 border border-emerald-500/80 shadow-2xl flex items-center gap-3 font-mono text-[10px] select-none max-w-fit">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t("quickStartTitle")}</span>
            </div>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => onLaunchSampleRoute?.()}
              className="px-2 py-0.5 bg-[#064e3b] hover:bg-[#047857] text-[#34d399] border border-[#10b981] font-bold text-[9px] transition-colors whitespace-nowrap"
            >
              {t("quickStartSimGale")}
            </button>
            <button
              onClick={() => {
                onChangeSite?.("jezero_crater");
                onCloseQuickStartBanner?.();
              }}
              className="px-2 py-0.5 bg-[#161e2e] hover:bg-[#1f2937] text-cyan-300 border border-slate-700 font-bold text-[9px] transition-colors whitespace-nowrap"
            >
              {t("quickStartToJezero")}
            </button>
            <button
              onClick={() => onCloseQuickStartBanner?.()}
              className="text-slate-500 hover:text-white text-xs px-1"
              title={t("quickStartClose")}
            >
              ✕
            </button>
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {isSearchFocused && searchQuery.trim().length > 0 && (
          <div className="w-72 sm:w-96 max-h-56 overflow-y-auto bg-[#07090e] border border-slate-700 shadow-2xl divide-y divide-slate-800 font-mono text-[10px]">
            {SEARCH_SHORTCUTS.filter((sc) =>
              sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sc.desc.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((res) => (
              <div
                key={res.name}
                onMouseDown={() => {
                  if (res.site !== currentSite && onChangeSite) {
                    onChangeSite(res.site);
                  }
                  const map = mapRef.current;
                  if (map) {
                    map.flyTo({ center: res.coords, zoom: res.zoom, duration: 1200 });
                  }
                  const elev = getMartianElevation(res.coords[0], res.coords[1], res.site);
                  const slope = getMartianSlope(res.coords[0], res.coords[1], res.site);
                  setIdentifiedFeature({
                    name: res.name,
                    category: "MARTIAN LANDMARK",
                    stratigraphicAge: "Martian Geologic Landmark",
                    elevationM: elev,
                    slopeDeg: slope,
                    mineralogy: "Regional Mars Bedrock Formation",
                    coordinates: res.coords,
                    surfaceFirmness: elev > -4100 ? "BEDROCK FIRM" : "SOFT SAND TRAP RISK",
                    sandTrapRisk: elev > -4100 ? "LOW" : "HIGH",
                    crustalMagneticFieldNt: 38,
                    surfaceRadiationMSvSol: 0.65,
                    laymanDescription: res.desc,
                    temperatureRange: "-80°C s.d. -10°C",
                  });
                  setSearchQuery("");
                  setIsSearchFocused(false);
                }}
                className="p-2.5 hover:bg-[#111827] cursor-pointer"
              >
                <div className="text-cyan-300 font-bold">{res.name}</div>
                <div className="text-slate-400 text-[8px] line-clamp-1">{res.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 1-Click Map Style Switcher (Bottom-Left ala Google Maps) */}
      <div
        className={`absolute z-20 flex items-center bg-[#07090e] border border-slate-700 shadow-xl transition-all duration-200 select-none ${
          isProfileDockOpen ? "bottom-[250px]" : "bottom-16"
        } ${
          isLeftDrawerOpen ? "left-4 sm:left-[416px]" : "left-4 sm:left-14"
        }`}
      >
        <button
          onClick={() => onChangeOrbitalSource?.("jpl_hirise")}
          className={`px-3 py-1.5 font-mono text-[9px] font-bold border-r border-slate-700 transition-colors ${
            orbitalSource === "jpl_hirise" || orbitalSource === "opm_basemap" || !orbitalSource
              ? "bg-[#083344] text-[#a5f3fc] border-cyan-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#111827]"
          }`}
          title="Citra Satelit Resolusi Tinggi NASA Mars Trek"
        >
          {t("styleSatellite")}
        </button>
        <button
          onClick={() => onChangeOrbitalSource?.("mola_hrsc")}
          className={`px-3 py-1.5 font-mono text-[9px] font-bold border-r border-slate-700 transition-colors ${
            orbitalSource === "mola_hrsc"
              ? "bg-[#083344] text-[#a5f3fc] border-cyan-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#111827]"
          }`}
          title="Topografi Elevasi MOLA Global Mars"
        >
          {t("styleElevation")}
        </button>
        <button
          onClick={() => onChangeOrbitalSource?.("themis_night")}
          className={`px-3 py-1.5 font-mono text-[9px] font-bold transition-colors ${
            orbitalSource === "themis_night"
              ? "bg-[#083344] text-[#a5f3fc] border-cyan-500"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#111827]"
          }`}
          title="Inframerah Termal Malam Mars Odyssey THEMIS"
        >
          {t("styleThermal")}
        </button>
      </div>

      {/* 3. Google Maps Vertical Navigation Controls (Bottom-Right) */}
      <div className={`absolute ${isProfileDockOpen ? "bottom-[250px]" : "bottom-16"} right-4 z-20 flex flex-col bg-[#07090e] border border-slate-700 shadow-2xl select-none font-mono transition-all duration-200`}>
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#111827] border-b border-slate-800 text-sm font-bold transition-colors"
          title={t("zoomIn")}
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#111827] border-b border-slate-800 text-sm font-bold transition-colors"
          title={t("zoomOut")}
        >
          −
        </button>
        <button
          onClick={() => mapRef.current?.easeTo({ bearing: 0, duration: 400 })}
          className="w-8 h-8 flex items-center justify-center text-cyan-400 hover:text-cyan-200 hover:bg-[#111827] border-b border-slate-800 text-[10px] font-bold transition-colors"
          title={t("resetNorth")}
        >
          N
        </button>
        <button
          onClick={() => onTogglePitch?.()}
          className={`w-8 h-8 flex items-center justify-center border-b border-slate-800 text-[10px] font-bold transition-colors ${
            pitch3D ? "bg-amber-950/80 text-amber-300" : "text-slate-300 hover:text-white hover:bg-[#111827]"
          }`}
          title={t("toggle3d")}
        >
          3D
        </button>
        <button
          onClick={() => {
            const activeTraverse = getRoverTraverseForSite(currentSite);
            const currentPoint = [...activeTraverse].reverse().find((p) => p.sol <= effectiveSol) || activeTraverse[0];
            if (currentPoint && mapRef.current) {
              mapRef.current.flyTo({ center: currentPoint.coordinates, zoom: 14.5, duration: 900 });
            }
          }}
          className="w-8 h-8 flex items-center justify-center text-yellow-400 hover:text-yellow-200 hover:bg-[#111827] text-[8px] font-bold transition-colors"
          title={t("focusRover")}
        >
          ROVER
        </button>
      </div>

      {/* 5. Google Maps Style Friendly Place Card */}
      {identifiedFeature && (
        <div className="absolute top-36 sm:top-40 left-4 z-40 w-80 sm:w-96 max-w-[calc(100vw-3rem)] border border-slate-700 bg-[#07090e] text-slate-200 font-mono select-none shadow-[0_12px_40px_rgba(0,0,0,0.95)]">
          {/* Card Header */}
          <div className="h-9 px-3 bg-[#0b0f17] flex items-center justify-between border-b border-slate-700 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-cyan-400 truncate">
              <span className="w-2 h-2 bg-cyan-400 shrink-0" />
              <span className="truncate">{identifiedFeature.category}</span>
            </span>
            <button
              onClick={() => setIdentifiedFeature(null)}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 text-xs font-bold"
              title="Tutup Kartu"
            >
              ✕
            </button>
          </div>

          {/* Card Body */}
          <div className="p-3.5 space-y-3 bg-[#07090e]">
            <div>
              <div className="text-amber-400 font-bold text-sm leading-tight">
                {identifiedFeature.name}
              </div>
              <p className="mt-1.5 text-slate-300 text-[11px] leading-relaxed font-sans">
                {identifiedFeature.laymanDescription ||
                  getFeatureLaymanDescription(
                    identifiedFeature.name,
                    identifiedFeature.category,
                    identifiedFeature.slopeDeg
                  )}
              </p>
            </div>

            {/* Safety & Physical Attributes */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 bg-[#0b0f17] border border-slate-800">
                <span className="text-[8px] text-slate-400 uppercase font-bold block">
                  KESELAMATAN JALAN
                </span>
                <span
                  className={`inline-block mt-1 px-1.5 py-0.5 font-bold text-[9px] border ${
                    identifiedFeature.slopeDeg < 15
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500"
                      : identifiedFeature.slopeDeg < 25
                      ? "bg-amber-950 text-amber-300 border-amber-500"
                      : "bg-red-950 text-red-300 border-red-500"
                  }`}
                >
                  {identifiedFeature.slopeDeg < 15
                    ? t("statusSafe")
                    : identifiedFeature.slopeDeg < 25
                    ? t("statusCaution")
                    : t("statusHazard")}{" "}
                  ({identifiedFeature.slopeDeg.toFixed(1)}°)
                </span>
              </div>

              <div className="p-2 bg-[#0b0f17] border border-slate-800">
                <span className="text-[8px] text-slate-400 uppercase font-bold block">
                  ELEVASI MOLA
                </span>
                <span className="text-white font-mono font-bold text-xs tabular-nums block mt-1">
                  {identifiedFeature.elevationM > 0
                    ? `+${identifiedFeature.elevationM}`
                    : identifiedFeature.elevationM}{" "}
                  m
                </span>
              </div>

              <div className="p-2 bg-[#0b0f17] border border-slate-800">
                <span className="text-[8px] text-slate-400 uppercase font-bold block">
                  SUHU PERMUKAAN
                </span>
                <span className="text-cyan-300 font-mono font-bold text-[10px] tabular-nums block mt-1">
                  {identifiedFeature.temperatureRange || "-75°C s.d. -15°C"}
                </span>
              </div>

              <div className="p-2 bg-[#0b0f17] border border-slate-800">
                <span className="text-[8px] text-slate-400 uppercase font-bold block">
                  KONDISI BATUAN
                </span>
                <span className="text-slate-200 font-mono font-bold text-[9px] truncate block mt-1">
                  {identifiedFeature.surfaceFirmness ||
                    (identifiedFeature.elevationM > -4100
                      ? "BEDROCK FIRM"
                      : "SOFT SAND TRAP")}
                </span>
              </div>
            </div>

            {copyFeedback && (
              <div className="px-2 py-1 bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-[9px] font-bold text-center">
                {t("linkCopied")}
              </div>
            )}

            {/* 4 Action Buttons */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-1.5">
                {/* 1. LIHAT FOTO 360° */}
                {identifiedFeature.associatedWaypoint &&
                (identifiedFeature.associatedWaypoint.has360Pov ||
                  (identifiedFeature.associatedWaypoint as any).customPanoramaUrl ||
                  custom360Waypoints.some((c) => c.id === identifiedFeature.associatedWaypoint?.id)) ? (
                  <button
                    onClick={() => {
                      if (identifiedFeature.associatedWaypoint) {
                        onOpenPovModal?.(identifiedFeature.associatedWaypoint);
                      }
                    }}
                    className="py-1.5 px-2 bg-[#083344] hover:bg-[#0e7490] text-[#a5f3fc] border border-[#06b6d4] font-bold text-[9px] transition-colors flex items-center justify-center gap-1"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                    </svg>
                    <span>{t("btn360")}</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="py-1.5 px-2 bg-[#111827] text-slate-500 border border-slate-800 font-bold text-[9px] cursor-not-allowed opacity-60 text-center"
                  >
                    {t("btnNo360")}
                  </button>
                )}

                {/* 2. RUTE JALAN KE SINI */}
                <button
                  onClick={() => {
                    const targetWp = identifiedFeature.associatedWaypoint || ({
                      id: `custom_pt_${Date.now()}`,
                      name: identifiedFeature.name,
                      coordinates: identifiedFeature.coordinates,
                      elevationM: identifiedFeature.elevationM,
                      category: "custom_user_pov",
                      slopeDeg: identifiedFeature.slopeDeg,
                      surfaceFirmness: identifiedFeature.surfaceFirmness || (identifiedFeature.elevationM > -4100 ? "BEDROCK FIRM" : "SOFT SAND TRAP RISK"),
                      sandTrapRisk: identifiedFeature.sandTrapRisk || (identifiedFeature.elevationM > -4100 ? "LOW" : "HIGH"),
                      crustalMagneticFieldNt: identifiedFeature.crustalMagneticFieldNt || 38,
                      surfaceRadiationMSvSol: identifiedFeature.surfaceRadiationMSvSol || 0.65,
                      dominantMineral: identifiedFeature.mineralogy,
                    } as unknown as MountSharpWaypoint);

                    onPlanRouteToWaypoint?.(targetWp);
                  }}
                  className="py-1.5 px-2 bg-[#064e3b] hover:bg-[#047857] text-[#34d399] border border-[#10b981] font-bold text-[9px] transition-colors text-center"
                >
                  {t("btnRoute")}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {/* 3. CEK AIR & MINERAL */}
                <button
                  onClick={() => {
                    const targetWp = identifiedFeature.associatedWaypoint || ({
                      id: `custom_pt_${Date.now()}`,
                      name: identifiedFeature.name,
                      coordinates: identifiedFeature.coordinates,
                      elevationM: identifiedFeature.elevationM,
                      category: "custom_user_pov",
                      slopeDeg: identifiedFeature.slopeDeg,
                    } as unknown as MountSharpWaypoint);
                    onAnalyzeProspector?.(targetWp);
                  }}
                  className="py-1.5 px-2 bg-[#1e1b4b] hover:bg-[#312e81] text-[#c7d2fe] border border-[#6366f1] font-bold text-[9px] transition-colors text-center"
                >
                  {t("btnCheckMineral")}
                </button>

                {/* 4. SALIN LINK LOKASI */}
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.set("site", currentSite === "jezero_crater" ? "jezero" : "gale");
                      url.searchParams.set("lat", identifiedFeature.coordinates[1].toFixed(4));
                      url.searchParams.set("lng", identifiedFeature.coordinates[0].toFixed(4));
                      const zoom = mapRef.current ? Math.round(mapRef.current.getZoom()) : 13;
                      url.searchParams.set("z", zoom.toString());
                      url.searchParams.set("sol", currentSol.toString());
                      navigator.clipboard.writeText(url.toString()).then(() => {
                        setCopyFeedback(true);
                        setTimeout(() => setCopyFeedback(false), 2500);
                      });
                    }
                  }}
                  className="py-1.5 px-2 bg-[#111827] hover:bg-[#1e293b] text-slate-200 hover:text-white border border-slate-700 font-bold text-[9px] transition-colors text-center"
                >
                  {t("btnCopyLink")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Tool Banner Helper with Dynamic Offset */}
      {activeMmgisTool !== "none" && (
        <div className={`absolute top-12 z-20 px-2 py-1 bg-[#0b0f17] border border-cyan-500 text-cyan-300 font-mono text-[9px] font-bold flex items-center gap-2 select-none transition-all duration-200 ${isLeftDrawerOpen ? "left-4 sm:left-[406px]" : "left-4 sm:left-[56px]"
          }`}>
          <span className="w-1.5 h-1.5 bg-cyan-400 animate-pulse" />
          <span>
            {activeMmgisTool === "measure" && tMmgis("measureInstruction")}
            {activeMmgisTool === "viewshed" && tMmgis("viewshedInstruction")}
            {activeMmgisTool === "zoi" && tMmgis("zoiActive")}
          </span>
          <button
            onClick={() => onSelectMmgisTool?.("none")}
            className="ml-2 px-1 text-slate-400 hover:text-white border border-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default React.memo(AresMapViewer);
