"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MountSharpWaypoint,
  MOUNT_SHARP_WAYPOINTS,
} from "@/lib/martian/mountSharpWaypoints";
import { MartianLayerDef, MARTIAN_SCIENTIFIC_LAYERS } from "@/lib/martian/martianLayers";
import { MarswalkRouteResult } from "@/lib/martian/marswalkRouter";
import mountSharpGeology from "@/data/mountSharpGeology.json";

interface AresMapViewerProps {
  activeLayers: Record<string, boolean>;
  selectedWaypoint: MountSharpWaypoint | null;
  onSelectWaypoint: (wp: MountSharpWaypoint) => void;
  onMapClickCoordinate?: (coords: [number, number], elevation: number) => void;
  activeRoute: MarswalkRouteResult | null;
  viewMode: "mission_control" | "visor_hud";
}

// Center of Mount Sharp (Aeolis Mons) exploration region
const MOUNT_SHARP_CENTER: [number, number] = [137.58, -4.95];

export const AresMapViewer: React.FC<AresMapViewerProps> = ({
  activeLayers,
  selectedWaypoint,
  onSelectWaypoint,
  onMapClickCoordinate,
  activeRoute,
  viewMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [pitch, setPitch] = useState<number>(45);
  const [bearing, setBearing] = useState<number>(-15);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dark Martian / Deep Space MapLibre style definition
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        name: "Ares-Martian-Base",
        sources: {
          osm_dark_fallback: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "USGS Astrogeology / NASA JPL Mars Trek / Esri",
          },
        },
        layers: [
          {
            id: "background-space",
            type: "background",
            paint: { "background-color": "#07090e" },
          },
          {
            id: "planetary-basemap",
            type: "raster",
            source: "osm_dark_fallback",
            paint: {
              "raster-opacity": 0.45,
              "raster-contrast": 0.35,
              "raster-hue-rotate": 18,
            },
          },
        ],
      },
      center: MOUNT_SHARP_CENTER,
      zoom: 10.6,
      pitch: 45,
      bearing: -15,
      maxPitch: 70,
      attributionControl: false,
    });

    map.on("load", () => {
      // 1. Add Local Geology GeoJSON Source
      map.addSource("gale_geology", {
        type: "geojson",
        data: mountSharpGeology as GeoJSON.FeatureCollection,
      });

      // Layer 1: Optical & Geologic Units (Polygons)
      map.addLayer({
        id: "geology_fills",
        type: "fill",
        source: "gale_geology",
        layout: {
          visibility: activeLayers["layer_optical_geologic"] ? "visible" : "none",
        },
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.38,
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
          "line-width": 2,
          "line-opacity": 0.85,
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
            "#22c55e",
            "caution",
            "#eab308",
            "cliff_hazard",
            "#ef4444",
            "#64748b",
          ],
          "line-width": 3,
          "line-dasharray": [2, 2],
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
            "#38bdf8",
            0,
            "#94a3b8",
            -1,
            "#f97316",
            "#6366f1",
          ],
          "fill-opacity": 0.45,
        },
      });

      // Layer 4: Marswalk Route line source & layer
      map.addSource("marswalk_route_source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "marswalk_route_glow",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": "#06b6d4",
          "line-width": 6,
          "line-blur": 4,
          "line-opacity": 0.65,
        },
      });

      map.addLayer({
        id: "marswalk_route_core",
        type: "line",
        source: "marswalk_route_source",
        paint: {
          "line-color": "#22d3ee",
          "line-width": 2.5,
          "line-dasharray": [3, 2],
        },
      });
    });

    // Camera movement updates
    map.on("rotate", () => setBearing(Math.round(map.getBearing())));
    map.on("pitch", () => setPitch(Math.round(map.getPitch())));

    // Map click on canvas
    map.on("click", (e) => {
      if (onMapClickCoordinate) {
        // Approximate elevation interpolation based on latitude distance to peak
        const approxElev = Math.round(-4500 + Math.abs(e.lngLat.lat - -4.6) * 1100);
        onMapClickCoordinate([e.lngLat.lng, e.lngLat.lat], approxElev);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update layer visibility when activeLayers prop changes
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

  // Update Marswalk route on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("marswalk_route_source") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (activeRoute && activeRoute.pathCoordinates.length > 1) {
      const lineFeature: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: activeRoute.pathCoordinates.map((c) => [c[0], c[1]]),
        },
      };
      source.setData({
        type: "FeatureCollection",
        features: [lineFeature],
      });
    } else {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [activeRoute]);

  // Render Waypoint Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    MOUNT_SHARP_WAYPOINTS.forEach((wp) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer select-none transition-transform hover:scale-110";

      const isSelected = selectedWaypoint?.id === wp.id;
      const isBoxwork = wp.id === "curiosity_boxwork_2025";
      const isHab = wp.id === "gale_hab_alpha";

      let iconSvg = "";
      if (isHab) {
        iconSvg = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)] text-white text-xs font-mono font-bold">
            HAB
          </div>
        `;
      } else if (isBoxwork) {
        iconSvg = `
          <div class="flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.9)] animate-pulse text-amber-200 text-[10px] font-mono font-black">
            BOX
          </div>
        `;
      } else if (wp.category === "hazard_zone") {
        iconSvg = `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 border-2 border-red-500 text-red-400 text-xs font-bold">
            ▲
          </div>
        `;
      } else {
        iconSvg = `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800/80 border border-slate-300 shadow text-slate-200 text-xs">
            ●
          </div>
        `;
      }

      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          ${iconSvg}
          <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
            isSelected
              ? "bg-amber-400 text-slate-950 ring-2 ring-amber-300"
              : "bg-slate-900/90 text-slate-200 border border-slate-700/80"
          }">
            ${wp.name.split(" ")[0]}
          </div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectWaypoint(wp);
        map.flyTo({ center: wp.coordinates, zoom: 12.2, duration: 1200 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(wp.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [selectedWaypoint, onSelectWaypoint]);

  // Adjust camera pitch helpers
  const handlePitchToggle = () => {
    const map = mapRef.current;
    if (!map) return;
    const targetPitch = pitch > 20 ? 0 : 55;
    map.easeTo({ pitch: targetPitch, duration: 800 });
  };

  const handleResetNorth = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ bearing: 0, duration: 600 });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Tactical Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handlePitchToggle}
          title="Toggle 2.5D/3D Terrain Pitch"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs font-bold shadow-lg transition-colors"
        >
          {pitch > 20 ? "3D" : "2D"}
        </button>
        <button
          onClick={handleResetNorth}
          title="Reset North Heading"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold shadow-lg transition-colors"
        >
          N
        </button>
      </div>

      {/* Real-time Bearing & Coordinate Bar */}
      <div className="absolute bottom-3 left-4 z-10 px-3 py-1.5 rounded-md bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-4">
        <span>GALE CRATER (AEOLIS MONS)</span>
        <span className="text-slate-600">|</span>
        <span className="text-amber-400 font-semibold">TILT: {pitch}°</span>
        <span className="text-cyan-400 font-semibold">AZ: {bearing}°</span>
        <span className="text-slate-600">|</span>
        <span>DATUM: -4500m to -3800m</span>
      </div>
    </div>
  );
};

export default AresMapViewer;
