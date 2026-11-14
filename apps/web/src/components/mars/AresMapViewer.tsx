"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MountSharpWaypoint,
  MOUNT_SHARP_WAYPOINTS,
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
import mountSharpGeology from "@/data/mountSharpGeology.json";
import martianTerrainBase from "@/data/martianTerrainBase.json";

interface AresMapViewerProps {
  currentSite?: MissionSiteId;
  activeLayers: Record<string, boolean>;
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const curiosityMarkersRef = useRef<Marker[]>([]);
  const customMarkerRef = useRef<Marker | null>(null);
  const [showCuriosityTraverse, setShowCuriosityTraverse] = useState<boolean>(true);
  const t = useTranslations("mapViewer");

  const isDark = theme === "dark";

  // Fly to target mission site when switched
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (currentSite === "jezero_crater") {
      map.flyTo({
        center: JEZERO_CRATER_CENTER,
        zoom: JEZERO_DEFAULT_ZOOM,
        pitch: pitch3D ? 45 : 0,
        bearing: 0,
        duration: 1200,
      });
    } else if (currentSite === "gale_crater") {
      map.flyTo({
        center: MOUNT_SHARP_CENTER,
        zoom: MOUNT_SHARP_DEFAULT_ZOOM,
        pitch: pitch3D ? 45 : 0,
        bearing: -15,
        duration: 1200,
      });
    }
  }, [currentSite, pitch3D]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize MapLibre with 100% Martian raster basemap & procedural vector terrain
    // Official NASA/JPL Mars Trek WMTS endpoints for Gale Crater / Mount Sharp (HiRISE, MOLA/HRSC, OPM)
    // ZERO Earth tiles (no Carto/OSM/Mapbox Earth tiles)
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        name: "Ares-Martian-Map-Base",
        sources: {
          mars_hirise_gale: {
            type: "raster",
            tiles: [
              "/api/mars-tiles/gale-hirise/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 18,
            attribution: "NASA/JPL/Univ. of Arizona / Mars Trek WMTS (Server Proxy)",
          },
          mars_mola_shaded: {
            type: "raster",
            tiles: [
              "/api/mars-tiles/mola-clrshade/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "NASA/JPL/DLR / USGS Astrogeology (Server Proxy)",
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
          // Base Space / Deep Regolith solid
          {
            id: "background-mars-space",
            type: "background",
            paint: { "background-color": isDark ? "#06080d" : "#e2e8f0" },
          },
          // Mars True-Color Ferric Oxide Underlay:
          // Blends with OpenPlanetary hillshade to yield natural Mars rust-ocher terrain
          {
            id: "mars-true-color-underlay",
            type: "background",
            paint: {
              "background-color": isDark ? "#8f371a" : "#b44c28",
              "background-opacity": 0.88,
            },
          },
          // 1. Regional Shaded Relief Basemap (OpenPlanetary)
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
          // 2. MOLA + HRSC Colorized Hillshade Blend (Overlaid via Next.js Proxy)
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
          // 3. HiRISE / CTX Gale Crater High-Resolution Orthomosaic (Overlaid via Next.js Proxy)
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
      // 1. Procedural Martian Terrain Base (Ensures 100% authentic Mars even offline)
      map.addSource("mars_procedural_terrain", {
        type: "geojson",
        data: martianTerrainBase as unknown as maplibregl.GeoJSONSourceSpecification["data"],
      });

      // Procedural Martian Basal Basin
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

      // Procedural Ridge Lines and Rim Vectors
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

      // Layer 1: Optical & Geologic Units (Flat Solid Polygons)
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

      // Layer 2: Topographic & Mobility Hazards (Crisp Flat Lines)
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

      // Layer 3: Thermal & Subsurface (ATI & CT) (Flat Solid Inversion)
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

      // Layer 4: CRISM Hydrated Minerals & WEH Zone (Layer 4)
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

      // Layer 5: MGS MAG Crustal Magnetic Field & Natural Shielding Zone (Layer 5)
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

      // Curiosity Landing Ellipse Source & Layers
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

      // Curiosity Historical Traverse Line Source & Layer
      map.addSource("curiosity_traverse_source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { name: "MSL Curiosity Historical Traverse (Sol 0 - Sol 4180+)" },
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

      // Marswalk Route line source & layer (Crisp Solid Amber/Cyan Line)
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
    });

    // Silent error handler for external WMTS raster tiles (no red box error or crash)
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
        if (onWmtsStatusChange) {
          onWmtsStatusChange("fallback");
        }
        // Seamlessly suppress failing external raster tiles
        ["mars-raster-hirise", "mars-raster-mola", "mars-raster-opm"].forEach((id) => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, "visibility", "none");
          }
        });
      }
    });

    // Detect successful WMTS tile/source load
    map.on("sourcedata", (e) => {
      if (
        e.isSourceLoaded &&
        e.sourceId?.startsWith("mars_") &&
        e.dataType === "source" &&
        orbitalSource !== "local_vector" &&
        tileMode === "live_trek"
      ) {
        if (onWmtsStatusChange) {
          onWmtsStatusChange("streaming");
        }
      }
    });

    // Click anywhere to drop custom pin and interpolate elevation & slope
    map.on("click", (e) => {
      if (onMapClickCoordinate) {
        // Approximate elevation based on Gale floor (-4500m) and Mount Sharp radial rise
        const distFromHab = Math.sqrt(
          Math.pow((e.lngLat.lng - 137.4417) * 59.2, 2) +
          Math.pow((e.lngLat.lat - -4.5895) * 59.2, 2)
        );
        const approxElev = Math.min(-3500, Math.round(-4500 + distFromHab * 42));
        onMapClickCoordinate([Number(e.lngLat.lng.toFixed(4)), Number(e.lngLat.lat.toFixed(4))], approxElev);
      }
    });

    // Throttled camera movement handler to avoid main-thread saturation
    let rafMoveId: number | null = null;
    map.on("move", () => {
      if (rafMoveId) return;
      rafMoveId = requestAnimationFrame(() => {
        rafMoveId = null;
      });
    });

    mapRef.current = map;

    return () => {
      if (rafMoveId) cancelAnimationFrame(rafMoveId);
      map.remove();
      mapRef.current = null;
    };
  }, []);

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

  // Sync orbital source and tile mode (Live JPL Mars Trek WMTS vs Offline Procedural Canvas)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const isLocalVector = orbitalSource === "local_vector" || tileMode !== "live_trek";

    // When LOCAL PROCEDURAL VECTOR is active, force ALL raster satellite tiles to visibility: "none"
    if (isLocalVector) {
      ["mars-raster-opm", "mars-raster-mola", "mars-raster-hirise"].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
      });
      // Boost procedural vector terrain contrast
      if (map.getLayer("mars_terrain_basin_fills")) {
        map.setPaintProperty("mars_terrain_basin_fills", "fill-opacity", 0.90);
      }
      if (map.getLayer("mars_terrain_lines")) {
        map.setPaintProperty("mars_terrain_lines", "line-opacity", 0.95);
        map.setPaintProperty("mars_terrain_lines", "line-width", 2.0);
      }
      if (onWmtsStatusChange) onWmtsStatusChange("fallback");
      return;
    }

    // Reset procedural vector layers to standard opacity when satellite tiles are streaming
    if (map.getLayer("mars_terrain_basin_fills")) {
      map.setPaintProperty("mars_terrain_basin_fills", "fill-opacity", 0.35);
    }
    if (map.getLayer("mars_terrain_lines")) {
      map.setPaintProperty("mars_terrain_lines", "line-opacity", 0.70);
      map.setPaintProperty("mars_terrain_lines", "line-width", 1.5);
    }

    // OPM Basemap: Visible on all live modes (opm, mola, hirise) to ensure no black voids
    if (map.getLayer("mars-raster-opm")) {
      map.setLayoutProperty(
        "mars-raster-opm",
        "visibility",
        "visible"
      );
      map.setPaintProperty(
        "mars-raster-opm",
        "raster-opacity",
        orbitalSource === "opm_basemap" ? 0.85 : 0.50
      );
    }
    // MOLA/HRSC Colorized: Rich colored elevation contours
    if (map.getLayer("mars-raster-mola")) {
      map.setLayoutProperty(
        "mars-raster-mola",
        "visibility",
        orbitalSource === "mola_hrsc" ? "visible" : "none"
      );
      map.setPaintProperty("mars-raster-mola", "raster-opacity", 0.90);
    }
    // Gale CTX: High-resolution orbital mosaic with true-color natural regolith preservation
    if (map.getLayer("mars-raster-hirise")) {
      map.setLayoutProperty(
        "mars-raster-hirise",
        "visibility",
        orbitalSource === "jpl_hirise" ? "visible" : "none"
      );
      map.setPaintProperty("mars-raster-hirise", "raster-opacity", 0.88);
      map.setPaintProperty("mars-raster-hirise", "raster-saturation", -0.70);
      map.setPaintProperty("mars-raster-hirise", "raster-contrast", 0.22);
    }

    if (onWmtsStatusChange) onWmtsStatusChange("streaming");
  }, [orbitalSource, tileMode, onWmtsStatusChange]);

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

  // Sync Layer Toggles
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

    // Toggle curiosity markers
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

  // Render Flat Scientific Waypoint Markers (NO EMOJIS, NO GLOW, CLEAR 3-LETTER BADGES)
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

  // Render Curiosity Historical Sol Checkpoint Markers
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

  return (
    <div className={`relative w-full h-full overflow-hidden ${isDark ? "bg-[#07090e]" : "bg-slate-100"}`}>
      {/* Tactical Horizon / Traverse Controls */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 font-mono text-[10px]">
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

      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default React.memo(AresMapViewer);