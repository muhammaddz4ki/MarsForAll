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

  // MMGIS Spatial Analysis Props
  activeMmgisTool?: "none" | "measure" | "viewshed" | "zoi";
  onSelectMmgisTool?: (tool: "none" | "measure" | "viewshed" | "zoi") => void;
  swipeCurtainActive?: boolean;
  onToggleSwipeCurtain?: () => void;
  measurePoints?: [number, number][];
  onUpdateMeasurePoints?: (points: [number, number][]) => void;
  onProfileGenerated?: (profile: ElevationProfileResult | null) => void;
  zoiList?: ZoiFeature[];
  onAddZoi?: (zoi: ZoiFeature) => void;
  onExportGeoJson?: () => void;
  onOpenPlanetGlobe?: () => void;
  isLeftDrawerOpen?: boolean;
  onOpenPovModal?: (wp: MountSharpWaypoint) => void;
  onAnalyzeProspector?: (wp: MountSharpWaypoint) => void;
  onOpen360Manager?: () => void;
  custom360Waypoints?: MountSharpWaypoint[];
  hoveredRoutePoint?: HighDensityPointTelemetry | null;
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

interface IdentifiedFeatureInfo {
  name: string;
  category: string;
  stratigraphicAge: string;
  elevationM: number;
  slopeDeg: number;
  mineralogy: string;
  coordinates: [number, number];
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
  // MMGIS
  activeMmgisTool = "none",
  onSelectMmgisTool,
  swipeCurtainActive = false,
  onToggleSwipeCurtain,
  measurePoints = [],
  onUpdateMeasurePoints,
  onProfileGenerated,
  zoiList = [],
  onAddZoi,
  onExportGeoJson,
  onOpenPlanetGlobe,
  isLeftDrawerOpen = false,
  onOpenPovModal,
  onAnalyzeProspector,
  onOpen360Manager,
  custom360Waypoints = [],
  hoveredRoutePoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  // Compare Map references for Swipe Curtain
  const compareContainerRef = useRef<HTMLDivElement>(null);
  const compareMapRef = useRef<MapLibreMap | null>(null);

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

  const [showRoverTraverse, setShowRoverTraverse] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(false);
  const [showFloatingLegend, setShowFloatingLegend] = useState<boolean>(true);
  const [identifiedFeature, setIdentifiedFeature] = useState<IdentifiedFeatureInfo | null>(null);
  const [swipePosition, setSwipePosition] = useState<number>(50); // percentage 0 - 100
  const isDraggingDivider = useRef<boolean>(false);

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
  }, []);

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
          "line-width": 12,
          "line-offset": 3,
          "line-blur": 4,
          "line-opacity": 0.7,
        },
      });

      // Layer 2: 3D Outer Structural Tube Casing
      map.addLayer({
        id: "marswalk_route_casing",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": "#050811",
          "line-width": 8,
          "line-opacity": 0.98,
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
          "line-width": 4.8,
        },
      });

      // Layer 4: 3D Specular Highlight Spine (Cylindrical Glass / Chrome Gleam)
      map.addLayer({
        id: "marswalk_route_highlight",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": "#ffffff",
          "line-width": 1.6,
          "line-offset": -1.2,
          "line-opacity": 0.88,
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
          "circle-radius": 3.5,
          "circle-color": [
            "coalesce",
            ["get", "color"],
            "#34d399"
          ],
          "circle-stroke-width": 1.4,
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
      });
    });

    // Throttled Move & Scale Update
    let rafMoveId: number | null = null;
    map.on("move", () => {
      if (rafMoveId) return;
      rafMoveId = requestAnimationFrame(() => {
        rafMoveId = null;
        updateScaleBar(map);
        // Sync compare map if swipe curtain active
        if (compareMapRef.current) {
          compareMapRef.current.jumpTo({
            center: map.getCenter(),
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
          });
        }
      });
    });

    mapRef.current = map;

    return () => {
      if (rafHoverId) cancelAnimationFrame(rafHoverId);
      if (rafMoveId) cancelAnimationFrame(rafMoveId);
      if (routeStartMarkerRef.current) routeStartMarkerRef.current.remove();
      if (routeTargetMarkerRef.current) routeTargetMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

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

      if (matchedWp) {
        setIdentifiedFeature({
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
        });
      } else {
        const rendered = map.queryRenderedFeatures(e.point);
        const geoFeature = rendered.find(
          (f) => f.properties && (f.properties.unit_name || f.properties.name)
        );
        const unitName =
          (geoFeature?.properties?.unit_name as string) ||
          (currentSite === "jezero_crater"
            ? "Deltaic Stratified Sediment Unit"
            : "Mt Sharp Flank Layered Sulfate Unit");

        setIdentifiedFeature({
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
        });
      }

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
  }, [measurePoints]);

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
  }, [zoiList]);

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
  }, [layerOpacities]);

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
  }, [isDark]);

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
  }, [activeLayers]);

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
  }, [orbitalSource, tileMode, currentSite]);

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
  }, [showRoverTraverse, currentSite]);

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
  }, [showGraticule, currentSite]);

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
          <div class="flex items-center gap-1.5 px-2 py-0.5 bg-[#064e3b] text-[#34d399] border-2 border-[#10b981] font-mono font-bold text-[9px] shadow-[0_0_14px_rgba(16,185,129,0.9)]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-ping"></span>
            <span>[ 🚀 START: ${activeRoute.startWaypoint.name.toUpperCase().slice(0, 18)} ]</span>
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
          <div class="flex items-center gap-1.5 px-2 py-0.5 bg-[#78350f] text-[#fde68a] border-2 border-[#f59e0b] font-mono font-bold text-[9px] shadow-[0_0_14px_rgba(245,158,11,0.9)]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-ping"></span>
            <span>[ 🎯 TARGET: ${activeRoute.targetWaypoint.name.toUpperCase().slice(0, 18)} ]</span>
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
  }, [activeRoute, isLeftDrawerOpen]);

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

    // Combine standard waypoints with custom 360 waypoints (avoiding duplicate IDs)
    const combinedWaypoints = [...ALL_MARTIAN_WAYPOINTS];
    custom360Waypoints.forEach((cwp) => {
      const idx = combinedWaypoints.findIndex((w) => w.id === cwp.id);
      if (idx >= 0) {
        combinedWaypoints[idx] = { ...combinedWaypoints[idx], ...cwp };
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

      // Image 2 MMGIS Standard: Circular Camera Badge with Sol / Index Number & Connecting Pin Stem
      if (has360) {
        el.innerHTML = `
          <div class="relative flex flex-col items-center group">
            <div class="flex items-center justify-center gap-1.5 px-2.5 h-7 rounded-full bg-[#083344] text-[#38bdf8] border-2 ${
              isSelected ? "border-cyan-300 ring-4 ring-cyan-400/60" : "border-[#06b6d4]"
            } font-mono font-black text-[9px] shadow-[0_0_12px_rgba(6,182,212,0.7)] transition-transform group-hover:scale-115">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
              </svg>
              <span>360° POV</span>
            </div>
            <div class="w-0.5 h-2 bg-[#06b6d4] -mt-0.5"></div>
            <div class="whitespace-nowrap px-2 py-0.5 rounded-none text-[8px] font-mono font-bold tracking-wider ${
              isSelected
                ? "bg-amber-500 text-slate-950 border border-amber-300 z-10"
                : "bg-[#083344] text-[#a5f3fc] border border-[#06b6d4] shadow-md"
            }">
              [360°] ${wp.name}
            </div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="relative flex flex-col items-center group">
            <div class="flex items-center justify-center gap-1 px-2 h-6.5 rounded-full ${
              isSelected
                ? "bg-amber-400 text-slate-950 border-2 border-amber-200 ring-4 ring-amber-500/60"
                : "bg-white text-slate-950 border-2 border-slate-900"
            } font-mono font-black text-[9px] shadow-md transition-transform group-hover:scale-115">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
              </svg>
              <span>${wpNumber}</span>
            </div>
            <div class="w-0.5 h-1.5 ${isSelected ? "bg-amber-400" : "bg-slate-900"} -mt-0.5"></div>
            <div class="whitespace-nowrap px-1.5 py-0.5 rounded-none text-[8px] font-mono font-bold tracking-wider ${
              isSelected
                ? "bg-amber-500 text-slate-950 border border-amber-300 z-10"
                : isDark
                ? "bg-[#0b0f17] text-slate-200 border border-slate-700 shadow-sm"
                : "bg-white text-slate-800 border border-slate-300 shadow-sm"
            }">
              ${wp.name}
            </div>
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
  }, [selectedWaypoint, onSelectWaypoint, onOpenPovModal, isDark, custom360Waypoints]);

  // Render Martian Topographic Landmarks & Geomorphic Formations (Ref Image 2 & 3 Standard)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    landmarkMarkersRef.current.forEach((m) => m.remove());
    landmarkMarkersRef.current = [];

    const galeLandmarks = [
      { name: "MOUNT SHARP", sub: "AEOLIS MONS // -3,912M", coords: [137.8414, -5.4453] as [number, number] },
      { name: "BOXWORK VEINS 2025", sub: "MINERAL DISCOVERY SITE", coords: [137.8350, -5.4520] as [number, number] },
      { name: "VERA RUBIN RIDGE", sub: "HEMATITE CAPROCK", coords: [137.5684, -4.9281] as [number, number] },
      { name: "GLEN TORRIDON", sub: "SMECTITE CLAY TROUGH", coords: [137.4042, -4.7561] as [number, number] },
      { name: "BRADBURY LANDING", sub: "TOUCHDOWN SOL 0 // -4,501M", coords: [137.4417, -4.5895] as [number, number] },
      { name: "GEDIZ VALLIS", sub: "DEBRIS FLOW CHANNEL", coords: [137.7120, -5.2150] as [number, number] },
      { name: "YELLOWKNIFE BAY", sub: "LACUSTRINE MUDSTONE", coords: [137.4520, -4.5950] as [number, number] },
    ];

    galeLandmarks.forEach((lm) => {
      const el = document.createElement("div");
      el.className = "pointer-events-none select-none flex flex-col items-center opacity-85 hover:opacity-100 transition-opacity";
      el.innerHTML = `
        <div class="px-1.5 py-0.5 bg-[#07090e]/95 border border-slate-700/80 text-[8px] font-mono font-bold tracking-wider text-slate-300 flex items-center gap-1 shadow-md">
          <span class="w-1.5 h-1.5 bg-amber-400"></span>
          <span>${lm.name}</span>
        </div>
        <div class="text-[7px] font-mono text-cyan-400 font-bold bg-black/80 px-1 border border-slate-800 -mt-0.5">
          ${lm.sub}
        </div>
      `;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(lm.coords)
        .addTo(map);
      landmarkMarkersRef.current.push(marker);
    });
  }, [currentSite]);

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
          <div class="absolute -bottom-4 whitespace-nowrap px-1 py-0.2 ${
            isDark ? "bg-[#111827] text-amber-300 border-amber-400" : "bg-white text-amber-700 border-amber-500"
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
        map.flyTo({ center: pt.coordinates, zoom: 13, duration: 600 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(pt.coordinates)
        .addTo(map);

      curiosityMarkersRef.current.push(marker);
    });
  }, [showRoverTraverse, currentSite, isDark]);

  // Dragging divider handler for Swipe Curtain
  const handlePointerDownDivider = (e: React.PointerEvent) => {
    isDraggingDivider.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDivider = (e: React.PointerEvent) => {
    if (!isDraggingDivider.current || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(5, Math.min(95, Math.round((x / rect.width) * 100)));
    setSwipePosition(pct);
  };

  const handlePointerUpDivider = (e: React.PointerEvent) => {
    isDraggingDivider.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_e) {}
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${isDark ? "bg-[#07090e]" : "bg-slate-100"}`}>
      {/* MMGIS Spatial Analysis Toolbar (Single Unified Horizontal Row with Dynamic Offset) */}
      <div
        className={`absolute top-3 z-20 flex flex-nowrap items-center gap-1.5 font-mono text-[10px] transition-all duration-200 select-none ${
          isLeftDrawerOpen ? "left-[406px]" : "left-[56px]"
        }`}
      >
        {/* Re-Center Active Mission Site Button */}
        <button
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            const center = currentSite === "jezero_crater" ? JEZERO_CRATER_CENTER : MOUNT_SHARP_CENTER;
            const zoom = currentSite === "jezero_crater" ? JEZERO_DEFAULT_ZOOM : MOUNT_SHARP_DEFAULT_ZOOM;
            map.flyTo({ center, zoom, duration: 1000 });
          }}
          title={currentSite === "jezero_crater" ? "Re-center Jezero Crater" : "Re-center Gale Crater"}
          className={`h-7 px-2.5 border transition-colors flex items-center gap-1.5 font-bold ${
            isDark
              ? "bg-[#0b0f17] text-amber-400 border-slate-700 hover:text-amber-300 hover:border-amber-500"
              : "bg-white text-amber-700 border-slate-300 hover:text-amber-900 shadow-sm"
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          <span>RE-CENTER</span>
        </button>

        {/* 360° Waypoint Panorama Manager */}
        <button
          onClick={() => onOpen360Manager?.()}
          className="h-7 px-2.5 border transition-colors flex items-center gap-1.5 font-bold bg-[#083344] text-[#38bdf8] border-[#0284c7] hover:bg-[#0c4a6e]"
          title="Kelola & Tambah Waypoint Foto Panorama 360° Permukaan Mars"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>+ WAYPOINT 360°</span>
        </button>

        {/* Measure / Elevation Profile */}
        <button
          onClick={() => {
            const nextTool = activeMmgisTool === "measure" ? "none" : "measure";
            onSelectMmgisTool?.(nextTool);
          }}
          className={`h-7 px-2.5 border transition-colors flex items-center gap-1.5 ${
            activeMmgisTool === "measure"
              ? "bg-[#083344] text-[#a5f3fc] border-[#06b6d4] font-bold"
              : isDark
              ? "bg-[#0b0f17] text-slate-300 border-slate-700 hover:border-cyan-500 hover:text-cyan-400"
              : "bg-white text-slate-700 border-slate-300 hover:text-cyan-800 shadow-sm"
          }`}
        >
          <span className={`w-1.5 h-1.5 ${activeMmgisTool === "measure" ? "bg-cyan-400" : "bg-slate-500"}`} />
          <span>{activeMmgisTool === "measure" ? tMmgis("measureActive") : tMmgis("measureTool")}</span>
        </button>

        {/* Swipe Compare Curtain */}
        <button
          onClick={() => onToggleSwipeCurtain?.()}
          className={`h-7 px-2.5 border transition-colors flex items-center gap-1.5 ${
            swipeCurtainActive
              ? "bg-[#78350f] text-[#fef3c7] border-[#f59e0b] font-bold"
              : isDark
              ? "bg-[#0b0f17] text-slate-300 border-slate-700 hover:border-amber-500 hover:text-amber-400"
              : "bg-white text-slate-700 border-slate-300 hover:text-amber-800 shadow-sm"
          }`}
        >
          <span className={`w-1.5 h-1.5 ${swipeCurtainActive ? "bg-amber-400" : "bg-slate-500"}`} />
          <span>{swipeCurtainActive ? tMmgis("swipeActive") : tMmgis("swipeTool")}</span>
        </button>

        {/* Viewshed 360° */}
        <button
          onClick={() => {
            const nextTool = activeMmgisTool === "viewshed" ? "none" : "viewshed";
            onSelectMmgisTool?.(nextTool);
          }}
          className={`h-7 px-2.5 border transition-colors flex items-center gap-1.5 ${
            activeMmgisTool === "viewshed"
              ? "bg-[#064e3b] text-[#34d399] border-[#10b981] font-bold"
              : isDark
              ? "bg-[#0b0f17] text-slate-300 border-slate-700 hover:border-emerald-500 hover:text-emerald-400"
              : "bg-white text-slate-700 border-slate-300 hover:text-emerald-800 shadow-sm"
          }`}
        >
          <span className={`w-1.5 h-1.5 ${activeMmgisTool === "viewshed" ? "bg-emerald-400" : "bg-slate-500"}`} />
          <span>{activeMmgisTool === "viewshed" ? tMmgis("viewshedActive") : tMmgis("viewshedTool")}</span>
        </button>

        {/* + Mark Zone of Interest (ZOI) */}
        <button
          onClick={() => {
            const nextTool = activeMmgisTool === "zoi" ? "none" : "zoi";
            onSelectMmgisTool?.(nextTool);
          }}
          className={`h-7 px-2.5 border transition-colors flex items-center gap-1.5 ${
            activeMmgisTool === "zoi"
              ? "bg-[#451a03] text-[#fed7aa] border-[#ea580c] font-bold"
              : isDark
              ? "bg-[#0b0f17] text-slate-300 border-slate-700 hover:border-orange-500 hover:text-orange-400"
              : "bg-white text-slate-700 border-slate-300 hover:text-orange-800 shadow-sm"
          }`}
        >
          <span className={`w-1.5 h-1.5 ${activeMmgisTool === "zoi" ? "bg-orange-400" : "bg-slate-500"}`} />
          <span>{activeMmgisTool === "zoi" ? tMmgis("zoiActive") : tMmgis("markZoi")}</span>
        </button>

        {/* Export .GeoJSON */}
        <button
          onClick={() => onExportGeoJson?.()}
          className={`h-7 px-2.5 border transition-colors font-bold ${
            isDark
              ? "bg-[#111827] text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white"
              : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-sm"
          }`}
        >
          {tMmgis("exportGeoJson")}
        </button>

        {/* Rover Traverse Toggle */}
        <button
          onClick={() => setShowRoverTraverse((prev) => !prev)}
          className={`h-7 px-2.5 border transition-colors flex items-center gap-1.5 font-bold ${
            showRoverTraverse
              ? "bg-[#713f12] text-[#fef08a] border-[#eab308]"
              : isDark
              ? "bg-[#111827] text-slate-400 border-slate-700 hover:text-white"
              : "bg-white text-slate-600 border-slate-300 hover:text-slate-900 shadow-sm"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showRoverTraverse ? "bg-[#facc15]" : "bg-slate-500"}`} />
          <span>{currentSite === "jezero_crater" ? "PERSEVERANCE" : "CURIOSITY"} {showRoverTraverse ? t("on") : t("off")}</span>
        </button>

        {/* Graticule Grid Toggle */}
        <button
          onClick={() => setShowGraticule((prev) => !prev)}
          className={`h-7 px-2.5 border transition-colors flex items-center gap-1.5 font-bold ${
            showGraticule
              ? "bg-[#1e293b] text-[#93c5fd] border-[#60a5fa]"
              : isDark
              ? "bg-[#111827] text-slate-400 border-slate-700 hover:text-white"
              : "bg-white text-slate-600 border-slate-300 hover:text-slate-900 shadow-sm"
          }`}
        >
          <span className={`w-2 h-2 ${showGraticule ? "bg-[#60a5fa]" : "bg-slate-500"}`} />
          <span>[ {tMmgis("graticuleGrid")} {showGraticule ? t("on") : t("off")} ]</span>
        </button>

        {/* Floating Scientific Legend Toggle (Image 1 Ref) */}
        <button
          onClick={() => setShowFloatingLegend((prev) => !prev)}
          className={`h-7 px-2.5 border transition-colors flex items-center gap-1.5 font-bold ${
            showFloatingLegend
              ? "bg-[#1e1b4b] text-[#c7d2fe] border-[#818cf8]"
              : isDark
              ? "bg-[#111827] text-slate-400 border-slate-700 hover:text-white"
              : "bg-white text-slate-600 border-slate-300 hover:text-slate-900 shadow-sm"
          }`}
        >
          <span className={`w-2 h-2 ${showFloatingLegend ? "bg-[#818cf8]" : "bg-slate-500"}`} />
          <span>[ LEGEND {showFloatingLegend ? t("on") : t("off")} ]</span>
        </button>
      </div>

      {/* Floating Scientific Map Legend (Ref Image 1: Bioscape / MMGIS Legend Window) */}
      {showFloatingLegend && (
        <div
          className={`absolute top-12 right-4 z-20 w-64 border font-mono select-none shadow-xl ${
            isDark
              ? "bg-[#07090e]/95 border-slate-700 text-slate-200"
              : "bg-white border-slate-300 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between px-2.5 py-1 bg-[#0b0f17] border-b border-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-1.5 h-1.5 bg-amber-400" />
              <span>LEGEND</span>
            </span>
            <button
              onClick={() => setShowFloatingLegend(false)}
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
                    📷
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
      {identifiedFeature && (
        <div
          className={`absolute top-12 right-4 z-30 w-80 border font-mono select-none ${
            isDark
              ? "bg-[#07090e]/95 border-cyan-500/80 text-slate-200"
              : "bg-white border-cyan-600 text-slate-800 shadow-lg"
          }`}
        >
          {/* Header */}
          <div className="h-7 px-2.5 bg-[#0b0f17] flex items-center justify-between border-b border-cyan-900/60 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-cyan-400" />
              <span>{tMmgis("identifierTitle")}</span>
            </span>
            <button
              onClick={() => setIdentifiedFeature(null)}
              className="text-slate-400 hover:text-white px-1 text-[11px]"
            >
              ✕
            </button>
          </div>

          {/* Feature Attributes Table */}
          <div className="p-3 space-y-2 text-[10px]">
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-bold">{tMmgis("identifierUnit")}</div>
              <div className="text-cyan-400 font-bold truncate">{identifiedFeature.name}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <div>
                <span className="text-[9px] text-slate-400 block">{tMmgis("identifierAge")}</span>
                <span className="text-slate-200">{identifiedFeature.stratigraphicAge}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">{tMmgis("identifierElev")}</span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {identifiedFeature.elevationM > 0 ? `+${identifiedFeature.elevationM}` : identifiedFeature.elevationM} m
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <div>
                <span className="text-[9px] text-slate-400 block">{tMmgis("identifierSlope")}</span>
                <span className="text-slate-200 tabular-nums">{identifiedFeature.slopeDeg.toFixed(1)}°</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">COORDINATES</span>
                <span className="text-slate-300 tabular-nums">
                  {identifiedFeature.coordinates[1].toFixed(3)}°, {identifiedFeature.coordinates[0].toFixed(3)}°
                </span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800">
              <span className="text-[9px] text-slate-400 block">{tMmgis("identifierMineral")}</span>
              <span className="text-emerald-400">{identifiedFeature.mineralogy}</span>
            </div>

            {/* MMGIS Action Buttons */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              {identifiedFeature.associatedWaypoint && (
                <>
                  <button
                    onClick={() => {
                      if (identifiedFeature.associatedWaypoint && onOpenPovModal) {
                        onOpenPovModal(identifiedFeature.associatedWaypoint);
                      }
                    }}
                    className="flex-1 py-1 px-1.5 bg-[#451a03] border border-[#ea580c] text-[#fed7aa] font-bold text-[9px] hover:bg-[#7c2d12] transition-colors text-center"
                  >
                    [ {tMmgis("openPov")} ]
                  </button>
                  <button
                    onClick={() => {
                      if (identifiedFeature.associatedWaypoint && onAnalyzeProspector) {
                        onAnalyzeProspector(identifiedFeature.associatedWaypoint);
                      }
                    }}
                    className="flex-1 py-1 px-1.5 bg-[#083344] border border-[#06b6d4] text-[#a5f3fc] font-bold text-[9px] hover:bg-[#0e7490] transition-colors text-center"
                  >
                    [ {tMmgis("analyzeProspector")} ]
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Tool Banner Helper with Dynamic Offset */}
      {activeMmgisTool !== "none" && (
        <div className={`absolute top-12 z-20 px-2 py-1 bg-[#0b0f17]/95 border border-cyan-500/80 text-cyan-300 font-mono text-[9px] font-bold flex items-center gap-2 select-none transition-all duration-200 ${
          isLeftDrawerOpen ? "left-[406px]" : "left-[56px]"
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

      {/* Swipe Curtain Dividers & Labels */}
      {swipeCurtainActive && (
        <>
          {/* Left Side Label (Natural Optical Basemap) */}
          <div className="absolute top-20 left-4 z-20 px-2 py-0.5 bg-[#0b0f17]/90 border border-slate-700 text-slate-300 font-mono text-[9px] font-bold pointer-events-none">
            [ ◄ {tMmgis("swipeLeftLabel")} ]
          </div>
          {/* Right Side Label (Analytical Overlays) */}
          <div className="absolute top-20 right-4 z-20 px-2 py-0.5 bg-[#0b0f17]/90 border border-amber-500/80 text-amber-400 font-mono text-[9px] font-bold pointer-events-none">
            [ {tMmgis("swipeRightLabel")} ► ]
          </div>

          {/* Draggable Divider Line */}
          <div
            style={{ left: `${swipePosition}%` }}
            onPointerDown={handlePointerDownDivider}
            onPointerMove={handlePointerMoveDivider}
            onPointerUp={handlePointerUpDivider}
            className="absolute top-0 bottom-0 z-30 w-1 bg-amber-400 cursor-ew-resize flex items-center justify-center select-none"
          >
            {/* Center Draggable Handle */}
            <div className="w-8 h-8 -ml-3.5 bg-[#07090e] border border-amber-400 text-amber-400 text-[10px] font-mono font-bold flex items-center justify-center shadow-none">
              ◄►
            </div>
          </div>
        </>
      )}

      {/* Main Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 3. Bottom HUD: Live Cursor Telemetry & Dynamic Metric Scale Bar */}
      <div className="absolute bottom-2 left-3 right-3 z-20 flex items-center justify-between pointer-events-none font-mono text-[9px]">
        {/* Live Cursor Telemetry */}
        <div className="px-2 py-1 bg-[#07090e]/95 border border-slate-800 text-slate-300 flex items-center gap-3 tabular-nums select-none">
          <span className="text-slate-400 font-bold uppercase tracking-wider">CURSOR:</span>
          {cursorTelemetry ? (
            <>
              <div>
                <span className="text-slate-400">{tMmgis("cursorLat")}: </span>
                <span className="text-cyan-400 font-bold">{cursorTelemetry.lat}°</span>
              </div>
              <div>
                <span className="text-slate-400">{tMmgis("cursorLon")}: </span>
                <span className="text-cyan-400 font-bold">{cursorTelemetry.lon}°</span>
              </div>
              <div>
                <span className="text-slate-400">{tMmgis("cursorElev")}: </span>
                <span className="text-amber-400 font-bold">{cursorTelemetry.elev} M</span>
              </div>
              <div>
                <span className="text-slate-400">{tMmgis("cursorSlope")}: </span>
                <span className="text-purple-400 font-bold">{cursorTelemetry.slope}°</span>
              </div>
            </>
          ) : (
            <span className="text-slate-400">SCANNING MARTIAN SURFACE...</span>
          )}
        </div>

        {/* Dynamic Metric Scale Bar */}
        <div className="px-2 py-1 bg-[#07090e]/95 border border-slate-800 text-slate-300 flex items-center gap-2 select-none">
          <span className="text-slate-400 font-bold uppercase text-[8px]">{tMmgis("scaleBar")}</span>
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-amber-400 font-bold tabular-nums leading-none mb-0.5">
              {scaleBar.label}
            </span>
            <div
              style={{ width: `${scaleBar.widthPx}px` }}
              className="h-1 border-x border-b border-amber-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AresMapViewer);
