"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MountSharpWaypoint,
  MOUNT_SHARP_WAYPOINTS,
} from "@/lib/martian/mountSharpWaypoints";
import { MarswalkRouteResult } from "@/lib/martian/marswalkRouter";
import mountSharpGeology from "@/data/mountSharpGeology.json";
import martianTerrainBase from "@/data/martianTerrainBase.json";

interface AresMapViewerProps {
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
}

const MOUNT_SHARP_CENTER: [number, number] = [137.40, -4.74];
const MOUNT_SHARP_DEFAULT_ZOOM = 12.2;

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
};

export const AresMapViewer: React.FC<AresMapViewerProps> = ({
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const customMarkerRef = useRef<Marker | null>(null);
  const [pitch, setPitch] = useState<number>(45);
  const [bearing, setBearing] = useState<number>(-15);
  const [tileMode, setTileMode] = useState<"live_trek" | "offline_procedural">("live_trek");

  const isDark = theme === "dark";

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize MapLibre with 100% Martian raster basemap & procedural vector terrain
    // ZERO Earth tiles (no Carto/OSM/Mapbox Earth tiles)
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        name: "Ares-Martian-Map-Base",
        sources: {
          mars_mola_shaded: {
            type: "raster",
            tiles: [
              "https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-1/all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "USGS Astrogeology / NASA JPL Mars Trek / OpenPlanetary",
          },
        },
        layers: [
          // Base Space / Deep Regolith solid
          {
            id: "background-mars-space",
            type: "background",
            paint: { "background-color": isDark ? "#07090e" : "#e2e8f0" },
          },
          // Official Mars Basemap Raster
          {
            id: "mars-planetary-basemap",
            type: "raster",
            source: "mars_mola_shaded",
            paint: {
              "raster-opacity": 0.55,
              "raster-contrast": 0.35,
              "raster-hue-rotate": 12,
            },
          },
        ],
      },
      center: MOUNT_SHARP_CENTER,
      zoom: MOUNT_SHARP_DEFAULT_ZOOM,
      pitch: 45,
      bearing: -15,
      maxPitch: 70,
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

      // Layer 4: Marswalk Route line source & layer (Crisp Solid Cyan Line, NO BLUR)
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

    map.on("rotate", () => setBearing(Math.round(map.getBearing())));
    map.on("pitch", () => setPitch(Math.round(map.getPitch())));

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

    mapRef.current = map;

    return () => {
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
        isDark ? "#07090e" : "#f1f5f9"
      );
    }
  }, [isDark]);

  // Sync tile mode (Live JPL Mars Trek vs Offline Procedural Canvas)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer("mars-planetary-basemap")) {
      map.setLayoutProperty(
        "mars-planetary-basemap",
        "visibility",
        tileMode === "live_trek" ? "visible" : "none"
      );
    }
  }, [tileMode]);

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
  }, [activeLayers]);

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

    MOUNT_SHARP_WAYPOINTS.forEach((wp) => {
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
            PIN
          </div>
          <div class="absolute -bottom-4 whitespace-nowrap px-1 py-0.2 ${
            isDark ? "bg-[#111827] text-amber-300 border-amber-400" : "bg-white text-amber-700 border-amber-500"
          } border text-[8px] font-mono font-bold tracking-wider">
            CUSTOM-TARGET
          </div>
        </div>
      `;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(customPinCoords)
        .addTo(map);
      customMarkerRef.current = marker;
    }
  }, [customPinCoords, isDark]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${isDark ? "bg-[#07090e]" : "bg-slate-100"}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Real-time Bearing & Coordinate Bar + Live WMTS / Procedural Toggle (Flat Solid, Tabular Nums) */}
      <div className={`absolute bottom-2 left-4 z-10 px-2.5 py-1 ${
        isDark ? "bg-[#0b0f17] border-slate-800 text-slate-400" : "bg-white border-slate-300 text-slate-600 shadow-sm"
      } border text-[10px] font-mono flex items-center gap-3`}>
        <span className="text-amber-500 font-bold">GALE CRATER // AEOLIS MONS</span>
        <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
        <span className={`${isDark ? "text-slate-300" : "text-slate-800"} font-medium tabular-nums`}>
          PITCH: {pitch}°
        </span>
        <span className="text-cyan-500 font-medium tabular-nums">AZ: {bearing}°</span>
        <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>
        <span className="tabular-nums">DATUM: -4500m TO -3500m</span>
        <span className={isDark ? "text-slate-700" : "text-slate-300"}>|</span>

        {/* Tile Source Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTileMode("live_trek")}
            className={`px-1.5 py-0.2 border text-[9px] font-bold uppercase transition-colors ${
              tileMode === "live_trek"
                ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                : isDark
                ? "bg-[#111827] text-slate-400 border-slate-800"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            [JPL TREK LIVE]
          </button>
          <button
            onClick={() => setTileMode("offline_procedural")}
            className={`px-1.5 py-0.2 border text-[9px] font-bold uppercase transition-colors ${
              tileMode === "offline_procedural"
                ? "bg-[#78350f] text-[#fde68a] border-[#d97706]"
                : isDark
                ? "bg-[#111827] text-slate-400 border-slate-800"
                : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            [OFFLINE PROCEDURAL]
          </button>
        </div>
      </div>
    </div>
  );
};

export default AresMapViewer;