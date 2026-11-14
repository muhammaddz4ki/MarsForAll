"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MountSharpWaypoint,
  ALL_MARTIAN_WAYPOINTS,
  MissionSiteId,
  CURIOSITY_HISTORICAL_TRAVERSE,
  BRADBURY_LANDING_ELLIPSE,
} from "@/lib/martian/mountSharpWaypoints";
import { MarswalkRouteResult } from "@/lib/martian/marswalkRouter";
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

  const [showCuriosityTraverse, setShowCuriosityTraverse] = useState<boolean>(true);
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
          mars_hirise_gale: {
            type: "raster",
            tiles: ["/api/mars-tiles/hirise-gale/{z}/{x}/{y}"],
            tileSize: 256,
            attribution: "NASA / JPL / University of Arizona",
          },
          mars_mola_shaded: {
            type: "raster",
            tiles: ["/api/mars-tiles/mola-clrshade/{z}/{x}/{y}"],
            tileSize: 256,
            attribution: "NASA / GSFC / MOLA Team",
          },
          mars_opm_basemap: {
            type: "raster",
            tiles: [
              "https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-1/all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "OpenPlanetary / CARTO / USGS",
          },
        },
        layers: [
          {
            id: "background-mars-space",
            type: "background",
            paint: { "background-color": isDark ? "#06080d" : "#e2e8f0" },
          },
          {
            id: "mars-true-color-underlay",
            type: "background",
            paint: {
              "background-color": isDark ? "#8f371a" : "#b44c28",
              "background-opacity": 0.88,
            },
          },
          {
            id: "mars-raster-opm",
            type: "raster",
            source: "mars_opm_basemap",
            layout: {
              visibility: orbitalSource !== "local_vector" && tileMode === "live_trek" ? "visible" : "none",
            },
            paint: {
              "raster-opacity": 0.82,
              "raster-contrast": 0.22,
              "raster-brightness-min": 0.08,
              "raster-brightness-max": 0.95,
              "raster-saturation": 0.20,
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
              "raster-opacity": 0.90,
              "raster-contrast": 0.35,
            },
          },
          {
            id: "mars-raster-hirise",
            type: "raster",
            source: "mars_hirise_gale",
            layout: {
              visibility: orbitalSource === "jpl_hirise" && tileMode === "live_trek" ? "visible" : "none",
            },
            paint: {
              "raster-opacity": 0.88,
              "raster-contrast": 0.22,
              "raster-saturation": -0.70,
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
          "fill-opacity": 0.75,
        },
      });

      map.addLayer({
        id: "mars_terrain_lines",
        type: "line",
        source: "mars_procedural_terrain",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.5,
          "line-opacity": 0.85,
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
          "fill-opacity": 0.32,
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
          "line-opacity": 0.9,
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
          "fill-opacity": 0.28,
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
          "fill-opacity": 0.22,
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

      // Curiosity Historical Traverse Line
      map.addSource("curiosity_traverse_source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { name: "MSL Curiosity Historical Traverse" },
          geometry: {
            type: "LineString",
            coordinates: CURIOSITY_HISTORICAL_TRAVERSE.map((p) => p.coordinates),
          },
        },
      });

      map.addLayer({
        id: "curiosity_traverse_line",
        type: "line",
        source: "curiosity_traverse_source",
        paint: {
          "line-color": "#06b6d4",
          "line-width": 2,
          "line-dasharray": [3, 2],
        },
      });

      // Marswalk Route Line
      map.addSource("marswalk_route_source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "marswalk_route_core",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": "#06b6d4",
          "line-width": 2.5,
          "line-dasharray": [4, 2],
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
        ["mars-raster-hirise", "mars-raster-mola", "mars-raster-opm"].forEach((id) => {
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

      // 4. Default: User pin drop
      if (onMapClickCoordinate) {
        const approxElev = getMartianElevation(lon, lat, currentSite);
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
        Math.min(0.85, 0.4 * (opacities.layer_optical_geologic / 0.8))
      );
    }
    if (map.getLayer("geology_borders")) {
      map.setPaintProperty(
        "geology_borders",
        "line-opacity",
        Math.min(1.0, opacities.layer_optical_geologic)
      );
    }
    if (map.getLayer("hazard_slopes")) {
      map.setPaintProperty(
        "hazard_slopes",
        "line-opacity",
        Math.min(1.0, opacities.layer_topographic_hazard)
      );
    }
    if (map.getLayer("thermal_subsurface_circles")) {
      map.setPaintProperty(
        "thermal_subsurface_circles",
        "fill-opacity",
        Math.min(0.85, 0.45 * (opacities.layer_thermal_subsurface / 0.8))
      );
    }
    if (map.getLayer("science_mineral_fills")) {
      map.setPaintProperty(
        "science_mineral_fills",
        "fill-opacity",
        Math.min(0.85, 0.35 * (opacities.layer_science_mineral / 0.8))
      );
    }
    if (map.getLayer("safety_magnetic_fills")) {
      map.setPaintProperty(
        "safety_magnetic_fills",
        "fill-opacity",
        Math.min(0.85, 0.3 * (opacities.layer_safety_magnetic / 0.8))
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

  // Sync Curiosity Historical Traverse Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const vis = showCuriosityTraverse ? "visible" : "none";
    if (map.getLayer("curiosity_ellipse_fill")) {
      map.setLayoutProperty("curiosity_ellipse_fill", "visibility", vis);
    }
    if (map.getLayer("curiosity_ellipse_line")) {
      map.setLayoutProperty("curiosity_ellipse_line", "visibility", vis);
    }
    if (map.getLayer("curiosity_traverse_line")) {
      map.setLayoutProperty("curiosity_traverse_line", "visibility", vis);
    }

    curiosityMarkersRef.current.forEach((m) => {
      const el = m.getElement();
      if (el) el.style.display = showCuriosityTraverse ? "block" : "none";
    });
  }, [showCuriosityTraverse]);

  // Render Marswalk Path on Route Calculation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("marswalk_route_source") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (activeRoute && activeRoute.pathCoordinates.length > 1) {
      const lineFeature = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: activeRoute.pathCoordinates.map((c) => [c[0], c[1]]),
        },
      };
      source.setData({
        type: "FeatureCollection",
        features: [lineFeature],
      } as any);
    } else {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [activeRoute]);

  // Render Flat Scientific Waypoint Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    ALL_MARTIAN_WAYPOINTS.forEach((wp) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer select-none group";

      const isSelected = selectedWaypoint?.id === wp.id;
      const codeMeta = WAYPOINT_SHORT_CODES[wp.id] || {
        code: "SCI",
        color: "bg-[#1e293b]",
        border: "border-[#94a3b8]",
        text: "text-slate-200",
      };

      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center justify-center w-7 h-7 ${codeMeta.color} border ${codeMeta.border} ${codeMeta.text} text-[10px] font-mono font-bold shadow-none transition-transform group-hover:scale-105">
            ${codeMeta.code}
          </div>
          <div class="absolute -bottom-4 whitespace-nowrap px-1.5 py-0.2 rounded-none text-[8px] font-mono font-bold tracking-wider ${
            isSelected
              ? "bg-amber-500 text-slate-950 border border-amber-300 z-10"
              : isDark
              ? "bg-[#0b0f17] text-slate-300 border border-slate-700"
              : "bg-white text-slate-800 border border-slate-300 shadow-sm"
          }">
            ${wp.name.split(" ")[0]}
          </div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectWaypoint(wp);
        map.flyTo({ center: wp.coordinates, zoom: 12.2, duration: 600 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(wp.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [selectedWaypoint, onSelectWaypoint, isDark]);

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

  // Render Curiosity Historical Sol Checkpoints
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    curiosityMarkersRef.current.forEach((m) => m.remove());
    curiosityMarkersRef.current = [];

    CURIOSITY_HISTORICAL_TRAVERSE.forEach((pt) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer select-none group";
      el.style.display = showCuriosityTraverse ? "block" : "none";
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="w-3.5 h-3.5 bg-[#083344] border border-[#06b6d4] flex items-center justify-center text-[8px] text-[#a5f3fc] font-mono font-bold transition-transform group-hover:scale-125">
            •
          </div>
          <div class="absolute -bottom-3.5 whitespace-nowrap px-1 bg-[#07090e]/95 text-[#a5f3fc] border border-[#0891b2] text-[7px] font-mono font-bold tracking-tight">
            SOL ${pt.sol}
          </div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        map.flyTo({ center: pt.coordinates, zoom: 12.8, duration: 600 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(pt.coordinates)
        .addTo(map);

      curiosityMarkersRef.current.push(marker);
    });
  }, [showCuriosityTraverse, isDark]);

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
      {/* 1. Tactical Navigation Bar (Top-Left) */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
        {/* Traverse Toggle */}
        <button
          onClick={() => setShowCuriosityTraverse((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 border transition-colors ${
            showCuriosityTraverse
              ? "bg-[#083344] text-[#a5f3fc] border-[#06b6d4] font-bold"
              : isDark
              ? "bg-[#111827] text-slate-400 border-slate-700 hover:text-white"
              : "bg-white text-slate-600 border-slate-300 hover:text-slate-900"
          }`}
        >
          <span className={`w-2 h-2 ${showCuriosityTraverse ? "bg-[#06b6d4]" : "bg-slate-500"}`} />
          <span>{t("curiosityTraverse")} {showCuriosityTraverse ? t("on") : t("off")}</span>
        </button>

        {/* Global Mars Globe Focus */}
        <button
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            map.flyTo({
              center: [137.4, -4.74],
              zoom: 1.8,
              pitch: 62,
              bearing: -12,
              duration: 1200,
            });
          }}
          title={t("planetGlobeTitle")}
          className={`flex items-center gap-1 px-2.5 py-1 border transition-colors ${
            isDark
              ? "bg-[#111827] text-amber-400 border-slate-700 hover:text-amber-300 hover:border-amber-500"
              : "bg-white text-amber-700 border-slate-300 hover:text-amber-900"
          }`}
        >
          <span>{t("planetGlobe")}</span>
        </button>

        {/* Gale Focus */}
        <button
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            map.flyTo({
              center: MOUNT_SHARP_CENTER,
              zoom: MOUNT_SHARP_DEFAULT_ZOOM,
              pitch: pitch3D ? 55 : 0,
              bearing: -15,
              duration: 1200,
            });
          }}
          title={t("galeFocusTitle")}
          className={`flex items-center gap-1 px-2.5 py-1 border transition-colors ${
            isDark
              ? "bg-[#111827] text-cyan-400 border-slate-700 hover:text-cyan-300 hover:border-cyan-500"
              : "bg-white text-cyan-700 border-slate-300 hover:text-cyan-900"
          }`}
        >
          <span>{t("galeFocus")}</span>
        </button>

        {/* Jezero Focus */}
        <button
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            map.flyTo({
              center: JEZERO_CRATER_CENTER,
              zoom: JEZERO_DEFAULT_ZOOM,
              pitch: pitch3D ? 45 : 0,
              bearing: 0,
              duration: 1200,
            });
          }}
          title={t("jezeroFocusTitle")}
          className={`flex items-center gap-1 px-2.5 py-1 border transition-colors ${
            isDark
              ? "bg-[#111827] text-purple-400 border-slate-700 hover:text-purple-300 hover:border-purple-500"
              : "bg-white text-purple-700 border-slate-300 hover:text-purple-900"
          }`}
        >
          <span>{t("jezeroFocus")}</span>
        </button>
      </div>

      {/* 2. MMGIS Spatial Analysis Toolbar (Top Left Row 2) */}
      <div className="absolute top-11 left-3 z-20 flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
        {/* Tool 1: Measure / Elevation Profile */}
        <button
          onClick={() => {
            const nextTool = activeMmgisTool === "measure" ? "none" : "measure";
            onSelectMmgisTool?.(nextTool);
          }}
          className={`px-2.5 py-1 border transition-colors flex items-center gap-1.5 ${
            activeMmgisTool === "measure"
              ? "bg-[#083344] text-[#a5f3fc] border-[#06b6d4] font-bold"
              : isDark
              ? "bg-[#0b0f17] text-slate-300 border-slate-700 hover:border-cyan-500 hover:text-cyan-400"
              : "bg-white text-slate-700 border-slate-300 hover:text-cyan-800"
          }`}
        >
          <span className={`w-1.5 h-1.5 ${activeMmgisTool === "measure" ? "bg-cyan-400" : "bg-slate-500"}`} />
          <span>{activeMmgisTool === "measure" ? tMmgis("measureActive") : tMmgis("measureTool")}</span>
        </button>

        {/* Tool 2: Swipe Compare Curtain */}
        <button
          onClick={() => onToggleSwipeCurtain?.()}
          className={`px-2.5 py-1 border transition-colors flex items-center gap-1.5 ${
            swipeCurtainActive
              ? "bg-[#78350f] text-[#fef3c7] border-[#f59e0b] font-bold"
              : isDark
              ? "bg-[#0b0f17] text-slate-300 border-slate-700 hover:border-amber-500 hover:text-amber-400"
              : "bg-white text-slate-700 border-slate-300 hover:text-amber-800"
          }`}
        >
          <span className={`w-1.5 h-1.5 ${swipeCurtainActive ? "bg-amber-400" : "bg-slate-500"}`} />
          <span>{swipeCurtainActive ? tMmgis("swipeActive") : tMmgis("swipeTool")}</span>
        </button>

        {/* Tool 3: Viewshed 360° */}
        <button
          onClick={() => {
            const nextTool = activeMmgisTool === "viewshed" ? "none" : "viewshed";
            onSelectMmgisTool?.(nextTool);
          }}
          className={`px-2.5 py-1 border transition-colors flex items-center gap-1.5 ${
            activeMmgisTool === "viewshed"
              ? "bg-[#064e3b] text-[#34d399] border-[#10b981] font-bold"
              : isDark
              ? "bg-[#0b0f17] text-slate-300 border-slate-700 hover:border-emerald-500 hover:text-emerald-400"
              : "bg-white text-slate-700 border-slate-300 hover:text-emerald-800"
          }`}
        >
          <span className={`w-1.5 h-1.5 ${activeMmgisTool === "viewshed" ? "bg-emerald-400" : "bg-slate-500"}`} />
          <span>{activeMmgisTool === "viewshed" ? tMmgis("viewshedActive") : tMmgis("viewshedTool")}</span>
        </button>

        {/* Tool 4: + Mark Zone of Interest (ZOI) */}
        <button
          onClick={() => {
            const nextTool = activeMmgisTool === "zoi" ? "none" : "zoi";
            onSelectMmgisTool?.(nextTool);
          }}
          className={`px-2.5 py-1 border transition-colors flex items-center gap-1.5 ${
            activeMmgisTool === "zoi"
              ? "bg-[#451a03] text-[#fed7aa] border-[#ea580c] font-bold"
              : isDark
              ? "bg-[#0b0f17] text-slate-300 border-slate-700 hover:border-orange-500 hover:text-orange-400"
              : "bg-white text-slate-700 border-slate-300 hover:text-orange-800"
          }`}
        >
          <span className={`w-1.5 h-1.5 ${activeMmgisTool === "zoi" ? "bg-orange-400" : "bg-slate-500"}`} />
          <span>{activeMmgisTool === "zoi" ? tMmgis("zoiActive") : tMmgis("markZoi")}</span>
        </button>

        {/* Tool 5: Export .GeoJSON */}
        <button
          onClick={() => onExportGeoJson?.()}
          className={`px-2.5 py-1 border transition-colors font-bold ${
            isDark
              ? "bg-[#111827] text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white"
              : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
          }`}
        >
          {tMmgis("exportGeoJson")}
        </button>
      </div>

      {/* Interactive Tool Banner Helper */}
      {activeMmgisTool !== "none" && (
        <div className="absolute top-20 left-3 z-20 px-2 py-1 bg-[#0b0f17]/95 border border-cyan-500/80 text-cyan-300 font-mono text-[9px] font-bold flex items-center gap-2 select-none">
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
