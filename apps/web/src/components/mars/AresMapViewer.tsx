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
} from "@/lib/martian/mmgisSpatialAnalysis";
import mountSharpGeology from "@/data/mountSharpGeology.json";
import martianTerrainBase from "@/data/martianTerrainBase.json";
import { AerialScoutTarget } from "./MarsAerialScoutDock";

interface AresMapViewerProps {
  currentSite?: MissionSiteId;
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
  onWmtsStatusChange?: (status: WmtsStreamStatus) => void;
  dustStormActive?: boolean;
  currentSol?: number;

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
  resetNorthTrigger,
  customPinCoords,
  theme = "dark",
  tileMode = "live_trek",
  orbitalSource = "jpl_hirise",
  onWmtsStatusChange,
  dustStormActive = false,
  currentSol = 4180,
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
  const landmarkMarkersRef = useRef<Marker[]>([]);

  const [identifiedFeature, setIdentifiedFeature] = useState<IdentifiedFeatureInfo | null>(null);

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
          mars_openplanetary: {
            type: "raster",
            tiles: [
              "https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-1/all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "OpenPlanetary / CARTO / USGS Shaded Relief Basemap",
            maxzoom: 18,
          },
          mars_viking_basemap: {
            type: "raster",
            tiles: ["/api/mars-tiles/viking-mdim21/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "NASA / JPL / USGS Viking MDIM 2.1 Mosaic",
          },
          mars_ctx_gale: {
            type: "raster",
            tiles: ["/api/mars-tiles/gale-ctx/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "NASA / JPL / MSSS (Gale CTX 6m Mosaic)",
          },
          mars_ctx_jezero: {
            type: "raster",
            tiles: ["/api/mars-tiles/jezero-ctx/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "NASA / JPL / Caltech (Jezero CTX 6m Mosaic)",
          },
          mars_mola_shaded: {
            type: "raster",
            tiles: ["/api/mars-tiles/mola-clrshade/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "NASA / GSFC / MOLA Team",
          },
        },
        layers: [
          {
            id: "background-mars-space",
            type: "background",
            paint: { "background-color": isDark ? "#06080d" : "#e2e8f0" },
          },
          {
            id: "mars-raster-openplanetary",
            type: "raster",
            source: "mars_openplanetary",
            layout: {
              visibility: "visible",
            },
            paint: {
              "raster-opacity": 1.0,
              "raster-contrast": 0.28,
              "raster-saturation": 0.12,
            },
          },
          {
            id: "mars-raster-viking",
            type: "raster",
            source: "mars_viking_basemap",
            layout: {
              visibility: tileMode === "live_trek" && orbitalSource !== "opm_basemap" ? "visible" : "none",
            },
            paint: {
              "raster-opacity": 0.9,
              "raster-contrast": 0.25,
              "raster-saturation": 0.15,
            },
          },
          {
            id: "mars-raster-mola",
            type: "raster",
            source: "mars_mola_shaded",
            layout: {
              visibility: orbitalSource === "mola_hrsc" && tileMode === "live_trek" ? "visible" : "none",
            },
            paint: {
              "raster-opacity": 0.85,
              "raster-contrast": 0.35,
            },
          },
          {
            id: "mars-raster-ctx-gale",
            type: "raster",
            source: "mars_ctx_gale",
            layout: {
              visibility:
                orbitalSource === "jpl_hirise" &&
                  currentSite === "gale_crater" &&
                  tileMode === "live_trek"
                  ? "visible"
                  : "none",
            },
            paint: {
              "raster-opacity": 1.0,
              "raster-contrast": 0.25,
            },
          },
          {
            id: "mars-raster-ctx-jezero",
            type: "raster",
            source: "mars_ctx_jezero",
            layout: {
              visibility:
                orbitalSource === "jpl_hirise" &&
                  currentSite === "jezero_crater" &&
                  tileMode === "live_trek"
                  ? "visible"
                  : "none",
            },
            paint: {
              "raster-opacity": 1.0,
              "raster-contrast": 0.25,
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
          "fill-opacity": 0.10,
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
          "line-width": 2,
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
          "fill-opacity": 0.35,
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
          "fill-opacity": 0.12,
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
          "fill-opacity": 0.10,
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
          "fill-opacity": 0.08,
        },
      });

      map.addLayer({
        id: "curiosity_ellipse_line",
        type: "line",
        source: "curiosity_landing_ellipse_source",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 1.5,
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
          "line-width": 2.8,
          "line-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "curiosity_traverse_line",
        type: "line",
        source: "curiosity_traverse_source",
        paint: {
          "line-color": "#94a3b8",
          "line-width": 1.6,
          "line-dasharray": [4, 4],
          "line-opacity": 0.55,
        },
      });

      // Marswalk Route 3D Elevated Highway Source
      map.addSource("marswalk_route_source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Layer 1: Ground Ambient Occlusion Shadow (Creates Elevated 3D Floating Effect)
      map.addLayer({
        id: "marswalk_route_shadow",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": "#000000",
          "line-width": 14,
          "line-offset": 4,
          "line-blur": 6,
          "line-opacity": 0.75,
        },
      });

      // Layer 2: 3D Outer Structural Tube Casing
      map.addLayer({
        id: "marswalk_route_casing",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": "#020617",
          "line-width": 9.6,
          "line-opacity": 1.0,
        },
      });

      // Layer 3: 3D Luminous Core Corridor (Emerald Safe / Amber Caution / Red Hazard)
      map.addLayer({
        id: "marswalk_route_core",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": [
            "coalesce",
            ["get", "color"],
            "#10b981"
          ],
          "line-width": 5.8,
        },
      });

      // Layer 4: 3D Specular Highlight Spine (Cylindrical Glass / Chrome Gleam)
      map.addLayer({
        id: "marswalk_route_highlight",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": "#ffffff",
          "line-width": 2.0,
          "line-offset": -1.2,
          "line-opacity": 0.9,
        },
      });

      // Layer 5: Directional Dashed Lane Navigation Markers (Google Maps Highway aesthetic)
      map.addLayer({
        id: "marswalk_route_lane_dashed",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": "#ffffff",
          "line-width": 1.4,
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
        ["mars-raster-ctx-gale", "mars-raster-ctx-jezero", "mars-raster-mola"].forEach((id) => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, "visibility", "none");
          }
        });
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

    const isLive = tileMode === "live_trek";

    // 0. OpenPlanetary Global Shaded Relief Basemap
    if (map.getLayer("mars-raster-openplanetary")) {
      map.setLayoutProperty("mars-raster-openplanetary", "visibility", "visible");
    }

    // 1. Viking MDIM 2.1 Basemap (always visible when live_trek is on)
    if (map.getLayer("mars-raster-viking")) {
      map.setLayoutProperty("mars-raster-viking", "visibility", isLive ? "visible" : "none");
    }

    // 2. MOLA Shaded Relief
    if (map.getLayer("mars-raster-mola")) {
      map.setLayoutProperty(
        "mars-raster-mola",
        "visibility",
        isLive && orbitalSource === "mola_hrsc" ? "visible" : "none"
      );
    }

    // 3. Gale CTX Mosaic (6m/px)
    if (map.getLayer("mars-raster-ctx-gale")) {
      map.setLayoutProperty(
        "mars-raster-ctx-gale",
        "visibility",
        isLive &&
          currentSite === "gale_crater" &&
          orbitalSource === "jpl_hirise"
          ? "visible"
          : "none"
      );
    }

    // 4. Jezero CTX Mosaic (6m/px)
    if (map.getLayer("mars-raster-ctx-jezero")) {
      map.setLayoutProperty(
        "mars-raster-ctx-jezero",
        "visibility",
        isLive &&
          currentSite === "jezero_crater" &&
          orbitalSource === "jpl_hirise"
          ? "visible"
          : "none"
      );
    }
  }, [orbitalSource, tileMode, currentSite, mapLoaded]);

  // Sync Rover Historical Traverse (Curiosity vs Perseverance) Visibility & Coordinates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const vis = showRoverTraverse ? "visible" : "none";
    const isGale = currentSite === "gale_crater";

    // Update rover traverse GeoJSON data based on active mission site
    const source = map.getSource("curiosity_traverse_source") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      const activeTraverse = getRoverTraverseForSite(currentSite);
      source.setData({
        type: "Feature",
        properties: { name: `${currentSite} Rover Historical Traverse` },
        geometry: {
          type: "LineString",
          coordinates: activeTraverse.map((p) => p.coordinates),
        },
      });
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
  }, [showRoverTraverse, currentSite, mapLoaded]);

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
    const dotsSource = map.getSource("marswalk_route_dots_source") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (activeRoute && activeRoute.pathCoordinates.length > 1) {
      const features: any[] = [];

      if (activeRoute.segments && activeRoute.segments.length > 0) {
        // Individual multi-hazard colored segments
        activeRoute.segments.forEach((seg) => {
          const isHazard = seg.sandTrapRisk === "HIGH" || seg.slopeDeg > 22 || seg.isHazardWarning;
          const isCaution = seg.slopeDeg > 15 || seg.sandTrapRisk === "MODERATE";
          const color = isHazard ? "#ef4444" : isCaution ? "#f59e0b" : "#10b981";

          features.push({
            type: "Feature",
            properties: {
              segmentIndex: seg.segmentIndex,
              slopeDeg: seg.slopeDeg,
              hazard: isHazard ? "HAZARD" : isCaution ? "CAUTION" : "SAFE",
              color,
            },
            geometry: {
              type: "LineString",
              coordinates: [seg.fromCoordinate, seg.toCoordinate],
            },
          });
        });
      } else {
        // Fallback continuous line
        features.push({
          type: "Feature",
          properties: {
            color: "#10b981",
            hazard: "SAFE",
          },
          geometry: {
            type: "LineString",
            coordinates: activeRoute.pathCoordinates.map((c) => [c[0], c[1]]),
          },
        });
      }

      source.setData({
        type: "FeatureCollection",
        features,
      } as any);

      // Populate 5m high-density sampling nodes (Image 2 MMGIS standard)
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

      // Render 3D Holographic Start & Target Beacon Markers
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
            padding: { top: 90, bottom: 200, left: isLeftDrawerOpen ? 430 : 90, right: 90 },
            maxZoom: 15.0,
            duration: 900,
            pitch: 48, // 3D elevated highway perspective
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
      if (dotsSource) {
        dotsSource.setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    }
  }, [activeRoute, isLeftDrawerOpen, mapLoaded]);

  // Synchronized Scrubbing Cursor Marker along Route (NASA MMGIS Ref 4)
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

      {/* In-Map MMGIS Feature Identifier Popover */}
      {/* Interactive Waypoint & Feature Hub Inspector Card (Google Maps / NASA Mars Trek Standard) */}
      {identifiedFeature && isInspectorActive && !isLeftDrawerOpen && (
        <div
          className={`absolute top-14 z-40 w-96 max-w-[calc(100vw-3rem)] border font-mono select-none shadow-[0_12px_40px_rgba(0,0,0,0.95)] transition-all duration-200 ${
            isLeftDrawerOpen ? "left-4 sm:left-[416px]" : "left-4 sm:left-14"
          } bg-[#0b0f17] border-slate-700 text-slate-200`}
        >
          {/* Header */}
          <div className="h-8 px-3 bg-[#07090e] flex items-center justify-between border-b border-slate-700 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 bg-cyan-400 shrink-0" />
              <span>POINT INSPECTOR // {identifiedFeature.category}</span>
            </span>
            <button
              onClick={() => setIdentifiedFeature(null)}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 text-xs font-bold"
              title="Close Inspector"
            >
              ✕
            </button>
          </div>

          {/* Feature Attributes Table */}
          <div className="p-3.5 space-y-3 text-[10px] bg-[#0b0f17]">
            <div className="bg-[#111827] p-2.5 border border-slate-700">
              <div className="text-[9px] text-slate-300 uppercase font-bold tracking-wider">LOCATION &amp; GEOLOGY</div>
              <div className="text-amber-400 font-bold text-xs truncate mt-0.5">{identifiedFeature.name}</div>
              <div className="text-[10px] text-slate-300 font-medium mt-0.5">{identifiedFeature.stratigraphicAge}</div>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#111827] p-2 border border-slate-700">
                <span className="text-[8px] text-slate-300 uppercase tracking-wider block font-bold">MOLA ELEVATION</span>
                <span className="text-white font-mono font-bold text-xs tabular-nums block mt-0.5">
                  {identifiedFeature.elevationM > 0 ? `+${identifiedFeature.elevationM}` : identifiedFeature.elevationM} m
                </span>
              </div>
              <div className="bg-[#111827] p-2 border border-slate-700">
                <span className="text-[8px] text-slate-300 uppercase tracking-wider block font-bold">SLOPE / LERENG</span>
                <span className="text-white font-mono font-bold text-xs tabular-nums block mt-0.5">
                  {identifiedFeature.slopeDeg.toFixed(1)}°{" "}
                  <span className={`text-[8px] font-bold ${
                    identifiedFeature.slopeDeg < 15 ? "text-emerald-400" : identifiedFeature.slopeDeg < 25 ? "text-amber-400" : "text-red-400"
                  }`}>
                    [{identifiedFeature.slopeDeg < 15 ? "SAFE <15°" : identifiedFeature.slopeDeg < 25 ? "CAUTION" : "HAZARD"}]
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#111827] p-2 border border-slate-700">
                <span className="text-[8px] text-slate-300 uppercase tracking-wider block font-bold">GROUND FIRMNESS</span>
                <span className={`text-[9px] font-bold block mt-0.5 ${
                  (identifiedFeature.surfaceFirmness ?? "BEDROCK FIRM") === "BEDROCK FIRM"
                    ? "text-emerald-400"
                    : (identifiedFeature.surfaceFirmness ?? "") === "MODERATE COMPACTION"
                    ? "text-amber-400"
                    : "text-red-400"
                }`}>
                  [{identifiedFeature.surfaceFirmness || (identifiedFeature.elevationM > -4100 ? "BEDROCK FIRM" : "SOFT SAND TRAP RISK")}]
                </span>
              </div>
              <div className="bg-[#111827] p-2 border border-slate-700">
                <span className="text-[8px] text-slate-300 uppercase tracking-wider block font-bold">MAG SHIELDING</span>
                <span className="text-purple-300 font-mono font-bold text-xs tabular-nums block mt-0.5">
                  {identifiedFeature.crustalMagneticFieldNt ?? 38} nT
                </span>
              </div>
            </div>

            <div className="bg-[#111827] p-2 border border-slate-700 flex justify-between items-center text-[10px]">
              <span className="text-slate-300 uppercase font-bold tracking-wider">COORDINATES:</span>
              <span className="text-white font-mono font-bold tabular-nums">
                Lat {identifiedFeature.coordinates[1].toFixed(4)}°, Lon {identifiedFeature.coordinates[0].toFixed(4)}°
              </span>
            </div>

            <div className="bg-[#111827] p-2 border border-slate-700">
              <span className="text-[8px] text-slate-300 uppercase block font-bold tracking-wider">HYDRATED MINERALOGY:</span>
              <span className="text-cyan-300 font-bold text-[10px] truncate block mt-0.5">
                {identifiedFeature.mineralogy}
              </span>
            </div>

            {/* ACTION FEATURE MENU: WHAT CAN BE ACCESSED FROM THIS POINT */}
            <div className="pt-2 border-t border-slate-700 space-y-2">
              <span className="text-[8px] text-slate-300 uppercase font-bold tracking-wider block">
                AVAILABLE ACTIONS &amp; ANALYSIS:
              </span>

              {/* PRIMARY ACTION: PLAN SAFE ROUTE HERE */}
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
                className="w-full py-2 px-3 bg-[#064e3b] hover:bg-[#047857] text-[#34d399] border border-[#10b981] font-bold text-[11px] tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <span>[ {tMmgis("planRouteHere")} ]</span>
              </button>

              {/* SECONDARY ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                {/* 360 POV (Only enabled if the coordinate actually has a 360 panorama) */}
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
                    className="py-1.5 px-2 bg-[#083344] hover:bg-[#0e7490] text-[#a5f3fc] border border-[#06b6d4] font-bold text-[9px] transition-colors text-center truncate flex items-center justify-center gap-1"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                    </svg>
                    <span>{tMmgis("openPov")}</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="py-1.5 px-2 bg-[#111827] text-slate-500 border border-slate-800 font-bold text-[9px] text-center truncate cursor-not-allowed opacity-60"
                  >
                    [ {tMmgis("no360Pov")} ]
                  </button>
                )}

                {/* PROSPECTOR ML */}
                <button
                  onClick={() => {
                    if (identifiedFeature.associatedWaypoint && onAnalyzeProspector) {
                      onAnalyzeProspector(identifiedFeature.associatedWaypoint);
                    } else if (onAnalyzeProspector && selectedWaypoint) {
                      onAnalyzeProspector(selectedWaypoint);
                    }
                  }}
                  className="py-1.5 px-2 bg-[#1e1b4b] hover:bg-[#312e81] text-[#c7d2fe] border border-[#6366f1] font-bold text-[9px] transition-colors text-center truncate"
                >
                  {tMmgis("analyzeProspector")}
                </button>

                {/* EARTH ANALOGUE */}
                <button
                  onClick={() => {
                    if (identifiedFeature.associatedWaypoint && onOpenAnalogueMatcher) {
                      onOpenAnalogueMatcher(identifiedFeature.associatedWaypoint);
                    } else if (onOpenAnalogueMatcher && selectedWaypoint) {
                      onOpenAnalogueMatcher(selectedWaypoint);
                    }
                  }}
                  className="py-1.5 px-2 bg-[#451a03] hover:bg-[#78350f] text-[#fde68a] border border-[#d97706] font-bold text-[9px] transition-colors text-center truncate"
                >
                  [ {tMmgis("compareAnalogue")} ]
                </button>

                {/* 5M TRANSECT DOCK */}
                <button
                  onClick={() => {
                    onToggleProfileDock?.();
                  }}
                  className={`py-1.5 px-2 border font-bold text-[9px] transition-colors text-center truncate ${
                    isProfileDockOpen
                      ? "bg-[#161e2e] text-cyan-300 border-cyan-500"
                      : "bg-[#111827] text-slate-300 border-slate-700 hover:text-white"
                  }`}
                >
                  [ {tMmgis("transectDock")} ]
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
