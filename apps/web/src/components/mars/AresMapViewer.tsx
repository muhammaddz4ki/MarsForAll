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

interface AresMapViewerProps {
  activeLayers: Record<string, boolean>;
  selectedWaypoint: MountSharpWaypoint | null;
  onSelectWaypoint: (wp: MountSharpWaypoint) => void;
  onMapClickCoordinate?: (coords: [number, number], elevation: number) => void;
  activeRoute: MarswalkRouteResult | null;
  viewMode: "mission_control" | "visor_hud";
}

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

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

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
              "raster-opacity": 0.40,
              "raster-contrast": 0.4,
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
          "fill-opacity": 0.28,
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
        },
      });

      // Layer 2: Topographic & Mobility Hazards (Crisp Flat Dashed Lines)
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

    map.on("click", (e) => {
      if (onMapClickCoordinate) {
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

  // Render Flat Scientific Waypoint Markers (NO EMOJIS, NO GLOW)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    MOUNT_SHARP_WAYPOINTS.forEach((wp) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer select-none";

      const isSelected = selectedWaypoint?.id === wp.id;
      const isBoxwork = wp.id === "curiosity_boxwork_2025";
      const isHab = wp.id === "gale_hab_alpha";

      let markerBadge = "";
      if (isHab) {
        markerBadge = `
          <div class="flex items-center justify-center w-7 h-7 bg-[#064e3b] border border-[#10b981] text-[#34d399] text-[10px] font-mono font-bold">
            HAB
          </div>
        `;
      } else if (isBoxwork) {
        markerBadge = `
          <div class="flex items-center justify-center w-7 h-7 bg-[#78350f] border border-[#f59e0b] text-[#fef3c7] text-[9px] font-mono font-black">
            BOX
          </div>
        `;
      } else if (wp.category === "hazard_zone") {
        markerBadge = `
          <div class="flex items-center justify-center w-6 h-6 bg-[#7f1d1d] border border-[#ef4444] text-[#fca5a5] text-[9px] font-mono font-bold">
            HAZ
          </div>
        `;
      } else {
        markerBadge = `
          <div class="flex items-center justify-center w-6 h-6 bg-[#1e293b] border border-[#94a3b8] text-slate-200 text-[9px] font-mono">
            SCI
          </div>
        `;
      }

      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          ${markerBadge}
          <div class="absolute -bottom-4 whitespace-nowrap px-1 py-0.2 rounded-none text-[8px] font-mono font-bold tracking-wider ${
            isSelected
              ? "bg-amber-500 text-slate-950 border border-amber-300"
              : "bg-[#0b0f17] text-slate-300 border border-slate-700"
          }">
            ${wp.name.split(" ")[0]}
          </div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectWaypoint(wp);
        map.flyTo({ center: wp.coordinates, zoom: 12.2, duration: 800 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(wp.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [selectedWaypoint, onSelectWaypoint]);

  const handlePitchToggle = () => {
    const map = mapRef.current;
    if (!map) return;
    const targetPitch = pitch > 20 ? 0 : 55;
    map.easeTo({ pitch: targetPitch, duration: 600 });
  };

  const handleResetNorth = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ bearing: 0, duration: 500 });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07090e]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Tactical Map Controls (Flat Solid Buttons, Sharp 1px Borders) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handlePitchToggle}
          title="Toggle 2.5D/3D Terrain Pitch"
          className="flex items-center justify-center w-8 h-8 bg-[#111827] hover:bg-[#1f2937] border border-slate-700 text-amber-400 font-mono text-[11px] font-bold transition-colors"
        >
          {pitch > 20 ? "3D" : "2D"}
        </button>
        <button
          onClick={handleResetNorth}
          title="Reset North Heading"
          className="flex items-center justify-center w-8 h-8 bg-[#111827] hover:bg-[#1f2937] border border-slate-700 text-slate-200 font-mono text-[11px] font-bold transition-colors"
        >
          N
        </button>
      </div>

      {/* Real-time Bearing & Coordinate Bar (Flat Solid, Tabular Nums) */}
      <div className="absolute bottom-2 left-3 z-10 px-2.5 py-1 bg-[#0b0f17] border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-3">
        <span>GALE CRATER (AEOLIS MONS)</span>
        <span className="text-slate-700">|</span>
        <span className="text-amber-400 font-medium tabular-nums">PITCH: {pitch}°</span>
        <span className="text-cyan-400 font-medium tabular-nums">AZ: {bearing}°</span>
        <span className="text-slate-700">|</span>
        <span className="tabular-nums">DATUM: -4500m TO -3800m</span>
      </div>
    </div>
  );
};

export default AresMapViewer;
